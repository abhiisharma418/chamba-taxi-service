const { EmergencyIncident, EmergencySettings } = require('../models/emergencyModel');
const User = require('../models/userModel');
const { validationResult } = require('express-validator');

class AdminEmergencyController {
  async getAllIncidents(req, res) {
    try {
      const { page = 1, limit = 20, status, severity, userType, timeframe = '30d' } = req.query;

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
        case '365d':
          startDate.setDate(startDate.getDate() - 365);
          break;
      }

      const query = { createdAt: { $gte: startDate } };
      
      if (status && status !== 'all') {
        query.status = status;
      }
      if (severity && severity !== 'all') {
        query.severity = severity;
      }
      if (userType && userType !== 'all') {
        query.userType = userType;
      }

      const incidents = await EmergencyIncident.find(query)
        .populate('userId', 'name email phoneNumber')
        .populate('rideId', 'rideId startLocation endLocation')
        .populate('responseTeam.assignedOperator', 'name email')
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
      console.error('Error fetching admin incidents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incidents'
      });
    }
  }

  async getIncidentDetails(req, res) {
    try {
      const { incidentId } = req.params;

      const incident = await EmergencyIncident.findOne({ incidentId })
        .populate('userId', 'name email phoneNumber role createdAt')
        .populate('rideId')
        .populate('responseTeam.assignedOperator', 'name email');

      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Emergency incident not found'
        });
      }

      res.json({
        success: true,
        data: incident
      });

    } catch (error) {
      console.error('Error fetching incident details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch incident details'
      });
    }
  }

  async assignOperator(req, res) {
    try {
      const { incidentId } = req.params;
      const { operatorId, notes } = req.body;
      const adminId = req.user.id;

      const incident = await EmergencyIncident.findOne({ incidentId });
      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Emergency incident not found'
        });
      }

      await incident.escalate(operatorId, notes);

      res.json({
        success: true,
        message: 'Operator assigned successfully',
        data: {
          incidentId: incident.incidentId,
          assignedOperator: operatorId,
          status: incident.status
        }
      });

    } catch (error) {
      console.error('Error assigning operator:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign operator'
      });
    }
  }

  async updateIncident(req, res) {
    try {
      const { incidentId } = req.params;
      const { status, resolution, notes, severity } = req.body;
      const adminId = req.user.id;

      const incident = await EmergencyIncident.findOne({ incidentId });
      if (!incident) {
        return res.status(404).json({
          success: false,
          message: 'Emergency incident not found'
        });
      }

      if (status) {
        await incident.updateStatus(status, adminId, resolution);
      }

      if (severity && severity !== incident.severity) {
        incident.severity = severity;
        await incident.addTimelineEntry(
          `Severity changed from ${incident.severity} to ${severity}`,
          adminId,
          'AdminUser',
          notes
        );
      }

      if (notes && notes !== (incident.responseTeam?.notes || '')) {
        incident.responseTeam = incident.responseTeam || {};
        incident.responseTeam.notes = notes;
        await incident.addTimelineEntry(
          'Admin notes updated',
          adminId,
          'AdminUser',
          notes
        );
      }

      await incident.save();

      res.json({
        success: true,
        message: 'Incident updated successfully',
        data: {
          incidentId: incident.incidentId,
          status: incident.status,
          severity: incident.severity,
          updatedAt: incident.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating incident:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update incident'
      });
    }
  }

  async getEmergencyStatistics(req, res) {
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
        case '365d':
          startDate.setDate(startDate.getDate() - 365);
          break;
      }

      const [stats, trendData] = await Promise.all([
        EmergencyIncident.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: null,
              totalIncidents: { $sum: 1 },
              byType: { $push: '$incidentType' },
              bySeverity: { $push: '$severity' },
              byStatus: { $push: '$status' },
              byUserType: { $push: '$userType' },
              avgResponseTime: {
                $avg: {
                  $subtract: ['$responseTeam.responseTime', '$createdAt']
                }
              },
              resolvedIncidents: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
                }
              },
              activeIncidents: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                }
              },
              escalatedIncidents: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0]
                }
              }
            }
          }
        ]),
        
        // Daily trend data
        EmergencyIncident.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              resolved: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
                }
              }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      const typeStats = {};
      const severityStats = {};
      const statusStats = {};
      const userTypeStats = {};

      if (stats[0]) {
        stats[0].byType?.forEach(type => {
          typeStats[type] = (typeStats[type] || 0) + 1;
        });
        
        stats[0].bySeverity?.forEach(severity => {
          severityStats[severity] = (severityStats[severity] || 0) + 1;
        });
        
        stats[0].byStatus?.forEach(status => {
          statusStats[status] = (statusStats[status] || 0) + 1;
        });
        
        stats[0].byUserType?.forEach(userType => {
          userTypeStats[userType] = (userTypeStats[userType] || 0) + 1;
        });
      }

      const responseRate = stats[0]?.totalIncidents > 0 
        ? ((stats[0]?.resolvedIncidents || 0) / stats[0].totalIncidents * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        data: {
          overview: {
            totalIncidents: stats[0]?.totalIncidents || 0,
            activeIncidents: stats[0]?.activeIncidents || 0,
            resolvedIncidents: stats[0]?.resolvedIncidents || 0,
            escalatedIncidents: stats[0]?.escalatedIncidents || 0,
            avgResponseTime: stats[0]?.avgResponseTime || 0,
            responseRate: parseFloat(responseRate)
          },
          breakdown: {
            incidentsByType: typeStats,
            incidentsBySeverity: severityStats,
            incidentsByStatus: statusStats,
            incidentsByUserType: userTypeStats
          },
          trends: trendData,
          timeframe
        }
      });

    } catch (error) {
      console.error('Error fetching emergency statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emergency statistics'
      });
    }
  }

  async getUserEmergencySettings(req, res) {
    try {
      const { userId } = req.params;

      const settings = await EmergencySettings.findOne({ userId })
        .populate('userId', 'name email phoneNumber');

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Emergency settings not found for this user'
        });
      }

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      console.error('Error fetching user emergency settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emergency settings'
      });
    }
  }

  async getRecentAlerts(req, res) {
    try {
      const { limit = 10 } = req.query;

      const recentIncidents = await EmergencyIncident.find({
        status: { $in: ['active', 'escalated'] }
      })
        .populate('userId', 'name phoneNumber')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: recentIncidents
      });

    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent alerts'
      });
    }
  }

  async exportIncidents(req, res) {
    try {
      const { format = 'csv', timeframe = '30d' } = req.query;

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

      const incidents = await EmergencyIncident.find({
        createdAt: { $gte: startDate }
      })
        .populate('userId', 'name email phoneNumber')
        .populate('rideId', 'rideId')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        const csv = this.generateCSV(incidents);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=emergency-incidents-${timeframe}.csv`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: incidents
        });
      }

    } catch (error) {
      console.error('Error exporting incidents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export incidents'
      });
    }
  }

  generateCSV(incidents) {
    const headers = [
      'Incident ID',
      'User Name',
      'User Phone',
      'User Type',
      'Incident Type',
      'Severity',
      'Status',
      'Location',
      'Description',
      'Created At',
      'Resolved At',
      'Response Time (minutes)'
    ];

    const rows = incidents.map(incident => {
      const responseTime = incident.responseTeam?.responseTime 
        ? Math.round((new Date(incident.responseTeam.responseTime) - new Date(incident.createdAt)) / 1000 / 60)
        : '';

      return [
        incident.incidentId,
        incident.userId?.name || '',
        incident.userId?.phoneNumber || '',
        incident.userType,
        incident.incidentType,
        incident.severity,
        incident.status,
        incident.location.address || `${incident.location.latitude}, ${incident.location.longitude}`,
        incident.description || '',
        incident.createdAt.toISOString(),
        incident.resolution?.resolvedAt || '',
        responseTime
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

module.exports = new AdminEmergencyController();
