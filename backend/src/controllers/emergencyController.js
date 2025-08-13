const { EmergencyIncident, EmergencySettings } = require('../models/emergencyModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const notificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');

class EmergencyController {
  async triggerSOS(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { 
        incidentType, 
        severity, 
        location, 
        description, 
        rideId,
        media = []
      } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const emergencySettings = await EmergencySettings.findOne({ userId });

      const incident = new EmergencyIncident({
        userId,
        userType: user.role,
        rideId: rideId || null,
        incidentType,
        severity: severity || 'medium',
        location,
        description,
        media,
        metadata: {
          deviceInfo: req.body.deviceInfo || {},
          networkInfo: req.body.networkInfo || {},
          appVersion: req.headers['app-version'] || '1.0.0'
        }
      });

      await incident.save();

      await incident.addTimelineEntry(
        'SOS triggered',
        userId,
        'User',
        `Emergency reported: ${incidentType}`
      );

      if (emergencySettings) {
        await this.notifyEmergencyContacts(incident, emergencySettings);
        
        if (emergencySettings.preferences.autoCallPolice && 
            ['accident', 'harassment', 'theft'].includes(incidentType)) {
          await this.notifyEmergencyServices(incident, 'police');
        }
        
        if (emergencySettings.preferences.autoCallAmbulance && 
            ['medical', 'accident'].includes(incidentType)) {
          await this.notifyEmergencyServices(incident, 'ambulance');
        }
      }

      await notificationService.sendToAdmins({
        type: 'emergency_alert',
        title: `🚨 EMERGENCY SOS - ${incidentType.toUpperCase()}`,
        message: `${user.name} has triggered an SOS alert`,
        data: {
          incidentId: incident.incidentId,
          userId,
          userType: user.role,
          severity,
          location
        },
        priority: 'high'
      });

      if (global.io) {
        global.io.emit('emergency_alert', {
          incidentId: incident.incidentId,
          userType: user.role,
          severity,
          location,
          timestamp: incident.createdAt
        });
      }

      res.status(201).json({
        success: true,
        message: 'SOS alert triggered successfully',
        data: {
          incidentId: incident.incidentId,
          status: incident.status,
          responseTime: incident.createdAt
        }
      });

    } catch (error) {
      console.error('Error triggering SOS:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger SOS alert',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getIncident(req, res) {
    try {
      const { incidentId } = req.params;
      const userId = req.user.id;

      const incident = await EmergencyIncident.findOne({ incidentId })
        .populate('userId', 'name email phoneNumber')
        .populate('rideId')
        .populate('responseTeam.assignedOperator', 'name email');

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Emergency incident not found'
        });
      }

      if (incident.userId._id.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: incident
      });

    } catch (error) {
      console.error('Error fetching incident:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incident details'
      });
    }
  }

  async getUserIncidents(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const query = { userId };
      if (status && status !== 'all') {
        query.status = status;
      }

      const incidents = await EmergencyIncident.find(query)
        .populate('rideId', 'rideId startLocation endLocation')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await EmergencyIncident.countDocuments(query);

      res.json({
        success: true,
        data: {
          incidents,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalIncidents: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user incidents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incidents'
      });
    }
  }

  async updateIncidentStatus(req, res) {
    try {
      const { incidentId } = req.params;
      const { status, resolution, notes } = req.body;
      const adminId = req.user.id;

      const incident = await EmergencyIncident.findOne({ incidentId });
      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Emergency incident not found'
        });
      }

      await incident.updateStatus(status, adminId, resolution);

      if (notes) {
        incident.responseTeam.notes = notes;
        await incident.save();
      }

      res.json({
        success: true,
        message: 'Incident status updated successfully',
        data: {
          incidentId: incident.incidentId,
          status: incident.status,
          updatedAt: incident.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating incident status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update incident status'
      });
    }
  }

  async getEmergencySettings(req, res) {
    try {
      const userId = req.user.id;

      let settings = await EmergencySettings.findOne({ userId });
      
      if (!settings) {
        settings = new EmergencySettings({
          userId,
          emergencyContacts: [],
          medicalInfo: {},
          preferences: {},
          notifications: {}
        });
        await settings.save();
      }

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      console.error('Error fetching emergency settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emergency settings'
      });
    }
  }

  async updateEmergencySettings(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      let settings = await EmergencySettings.findOne({ userId });
      
      if (!settings) {
        settings = new EmergencySettings({ userId, ...updateData });
      } else {
        Object.assign(settings, updateData);
      }

      await settings.save();

      res.json({
        success: true,
        message: 'Emergency settings updated successfully',
        data: settings
      });

    } catch (error) {
      console.error('Error updating emergency settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update emergency settings'
      });
    }
  }

  async addEmergencyContact(req, res) {
    try {
      const userId = req.user.id;
      const { name, phoneNumber, relationship, isPrimary } = req.body;

      let settings = await EmergencySettings.findOne({ userId });
      
      if (!settings) {
        settings = new EmergencySettings({ userId });
      }

      await settings.addEmergencyContact({
        name,
        phoneNumber,
        relationship,
        isPrimary: isPrimary || false
      });

      res.json({
        success: true,
        message: 'Emergency contact added successfully',
        data: settings.emergencyContacts
      });

    } catch (error) {
      console.error('Error adding emergency contact:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add emergency contact'
      });
    }
  }

  async removeEmergencyContact(req, res) {
    try {
      const userId = req.user.id;
      const { contactId } = req.params;

      const settings = await EmergencySettings.findOne({ userId });
      
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Emergency settings not found'
        });
      }

      await settings.removeEmergencyContact(contactId);

      res.json({
        success: true,
        message: 'Emergency contact removed successfully',
        data: settings.emergencyContacts
      });

    } catch (error) {
      console.error('Error removing emergency contact:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove emergency contact'
      });
    }
  }

  async triggerFakeCall(req, res) {
    try {
      const userId = req.user.id;
      const { contactName = "Mom", duration = 60 } = req.body;

      const user = await User.findById(userId);
      
      res.json({
        success: true,
        message: 'Fake call initiated',
        data: {
          callerId: contactName,
          duration,
          startTime: new Date(),
          callType: 'fake_emergency'
        }
      });

      setTimeout(() => {
        if (global.io) {
          global.io.to(`user_${userId}`).emit('fake_call_ended', {
            duration,
            endTime: new Date()
          });
        }
      }, duration * 1000);

    } catch (error) {
      console.error('Error triggering fake call:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger fake call'
      });
    }
  }

  async notifyEmergencyContacts(incident, settings) {
    try {
      const user = await User.findById(incident.userId);
      const contacts = settings.emergencyContacts || [];

      for (const contact of contacts) {
        const notification = {
          contactId: contact._id,
          contactName: contact.name,
          contactPhone: contact.phoneNumber,
          notificationTime: new Date(),
          notificationMethod: 'sms',
          deliveryStatus: 'pending'
        };

        try {
          const message = `EMERGENCY ALERT: ${user.name} has triggered an SOS alert. Location: ${incident.location.address || 'Location shared'}. Incident: ${incident.incidentType}. Time: ${new Date().toLocaleString()}. Contact authorities if needed.`;
          
          await notificationService.sendSMS(contact.phoneNumber, message);
          notification.deliveryStatus = 'sent';
          
        } catch (error) {
          console.error(`Failed to notify contact ${contact.name}:`, error);
          notification.deliveryStatus = 'failed';
        }

        incident.contactsNotified.push(notification);
      }

      await incident.save();
      
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  }

  async notifyEmergencyServices(incident, serviceType) {
    try {
      const timestamp = new Date();
      
      incident.emergencyServices[`${serviceType}Notified`] = true;
      incident.emergencyServices.notificationTime = timestamp;
      incident.emergencyServices.referenceNumber = `${serviceType.toUpperCase()}-${incident.incidentId}`;

      await incident.addTimelineEntry(
        `${serviceType} services notified`,
        'system',
        'System',
        `Automatic notification sent to ${serviceType} services`
      );

      console.log(`Emergency services (${serviceType}) notified for incident ${incident.incidentId}`);
      
    } catch (error) {
      console.error(`Error notifying ${serviceType} services:`, error);
    }
  }

  async getEmergencyStats(req, res) {
    try {
      const { timeframe = '30d' } = req.query;
      const startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const stats = await EmergencyIncident.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalIncidents: { $sum: 1 },
            byType: {
              $push: '$incidentType'
            },
            bySeverity: {
              $push: '$severity'
            },
            byStatus: {
              $push: '$status'
            },
            avgResponseTime: {
              $avg: {
                $subtract: ['$responseTeam.responseTime', '$createdAt']
              }
            }
          }
        }
      ]);

      const typeStats = {};
      const severityStats = {};
      const statusStats = {};

      if (stats[0]) {
        stats[0].byType.forEach(type => {
          typeStats[type] = (typeStats[type] || 0) + 1;
        });
        
        stats[0].bySeverity.forEach(severity => {
          severityStats[severity] = (severityStats[severity] || 0) + 1;
        });
        
        stats[0].byStatus.forEach(status => {
          statusStats[status] = (statusStats[status] || 0) + 1;
        });
      }

      res.json({
        success: true,
        data: {
          totalIncidents: stats[0]?.totalIncidents || 0,
          avgResponseTime: stats[0]?.avgResponseTime || 0,
          incidentsByType: typeStats,
          incidentsBySeverity: severityStats,
          incidentsByStatus: statusStats,
          timeframe
        }
      });

    } catch (error) {
      console.error('Error fetching emergency stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emergency statistics'
      });
    }
  }
}

module.exports = new EmergencyController();
