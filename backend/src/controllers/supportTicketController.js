import { SupportTicket } from '../models/supportTicketModel.js';
import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';
import notificationService from '../services/notificationService.js';

export class SupportTicketController {
  // Create a new support ticket
  static async createTicket(req, res) {
    try {
      const {
        category,
        priority = 'medium',
        subject,
        description,
        rideId,
        metadata = {}
      } = req.body;

      const userId = req.user.id;
      const userType = req.user.role || 'customer';

      // Get user details
      const user = await User.findById(userId).select('name email phone');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate ride if provided
      if (rideId) {
        const ride = await Ride.findById(rideId);
        if (!ride) {
          return res.status(404).json({
            success: false,
            message: 'Ride not found'
          });
        }
      }

      // Create support ticket
      const ticket = new SupportTicket({
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          userType
        },
        category,
        priority,
        subject,
        description,
        rideId,
        metadata: {
          source: 'app',
          ...metadata
        }
      });

      await ticket.save();

      // Add initial message
      await ticket.addMessage({
        id: userId,
        name: user.name,
        type: 'user'
      }, description);

      // Send notification to admin
      notificationService.sendNotification('admin', {
        type: 'new_support_ticket',
        title: '🎫 New Support Ticket',
        message: `${user.name} created a new ${category} ticket`,
        data: {
          ticketId: ticket.ticketId,
          category,
          priority
        }
      });

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Support ticket created successfully'
      });

    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create support ticket',
        error: error.message
      });
    }
  }

  // Get user's tickets
  static async getUserTickets(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, category } = req.query;

      const filter = { 'user.id': userId };
      if (status) filter.status = status;
      if (category) filter.category = category;

      const skip = (page - 1) * limit;
      
      const [tickets, totalTickets] = await Promise.all([
        SupportTicket.find(filter)
          .sort({ lastActivityAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('rideId', 'pickup destination fare status createdAt')
          .lean(),
        SupportTicket.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalTickets,
            pages: Math.ceil(totalTickets / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: error.message
      });
    }
  }

  // Get single ticket details
  static async getTicketById(req, res) {
    try {
      const { ticketId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      let filter = { ticketId };
      
      // Non-admin users can only see their own tickets
      if (userRole !== 'admin') {
        filter['user.id'] = userId;
      }

      const ticket = await SupportTicket.findOne(filter)
        .populate('rideId', 'pickup destination fare status createdAt')
        .populate('assignedTo', 'name email')
        .lean();

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Filter internal messages for non-admin users
      if (userRole !== 'admin') {
        ticket.messages = ticket.messages.filter(msg => !msg.isInternal);
      }

      res.json({
        success: true,
        data: ticket
      });

    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ticket',
        error: error.message
      });
    }
  }

  // Add message to ticket
  static async addMessage(req, res) {
    try {
      const { ticketId } = req.params;
      const { message, attachments = [] } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      let filter = { ticketId };
      
      // Non-admin users can only add messages to their own tickets
      if (userRole !== 'admin') {
        filter['user.id'] = userId;
      }

      const ticket = await SupportTicket.findOne(filter);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Get sender info
      const user = await User.findById(userId).select('name');
      
      await ticket.addMessage({
        id: userId,
        name: user.name,
        type: userRole === 'admin' ? 'admin' : 'user'
      }, message, attachments);

      // Send notification to the other party
      const recipientId = userRole === 'admin' ? ticket.user.id : 'admin';
      notificationService.sendNotification(recipientId, {
        type: 'ticket_message',
        title: '💬 New Support Message',
        message: `New message in ticket ${ticket.ticketId}`,
        data: {
          ticketId: ticket.ticketId,
          senderName: user.name
        }
      });

      res.json({
        success: true,
        message: 'Message added successfully'
      });

    } catch (error) {
      console.error('Error adding message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add message',
        error: error.message
      });
    }
  }

  // Update ticket status (admin only)
  static async updateTicketStatus(req, res) {
    try {
      const { ticketId } = req.params;
      const { status, resolution, assignedTo } = req.body;
      const userId = req.user.id;

      const ticket = await SupportTicket.findOne({ ticketId });
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      // Update assignment if provided
      if (assignedTo) {
        ticket.assignedTo = assignedTo;
      }

      await ticket.updateStatus(status, userId, resolution);

      // Send notification to user
      notificationService.sendNotification(ticket.user.id, {
        type: 'ticket_status_update',
        title: '📋 Ticket Status Updated',
        message: `Your ticket ${ticketId} status changed to ${status}`,
        data: {
          ticketId,
          status,
          resolution
        }
      });

      res.json({
        success: true,
        message: 'Ticket status updated successfully'
      });

    } catch (error) {
      console.error('Error updating ticket status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update ticket status',
        error: error.message
      });
    }
  }

  // Get all tickets (admin only)
  static async getAllTickets(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        category,
        priority,
        assignedTo,
        search
      } = req.query;

      const filter = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (assignedTo) filter.assignedTo = assignedTo;

      if (search) {
        filter.$or = [
          { ticketId: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { 'user.name': { $regex: search, $options: 'i' } },
          { 'user.email': { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const [tickets, totalTickets] = await Promise.all([
        SupportTicket.find(filter)
          .sort({ lastActivityAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('assignedTo', 'name email')
          .populate('rideId', 'pickup destination fare status')
          .lean(),
        SupportTicket.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalTickets,
            pages: Math.ceil(totalTickets / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching all tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tickets',
        error: error.message
      });
    }
  }

  // Get support statistics (admin only)
  static async getSupportStats(req, res) {
    try {
      const { period = '30d' } = req.query;
      
      const dateFilter = {};
      if (period === '7d') {
        dateFilter.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      } else if (period === '30d') {
        dateFilter.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      }

      const [
        totalTickets,
        openTickets,
        resolvedTickets,
        ticketsByCategory,
        ticketsByPriority,
        averageResolutionTime,
        slaBreaches
      ] = await Promise.all([
        SupportTicket.countDocuments(dateFilter),
        SupportTicket.countDocuments({ ...dateFilter, status: 'open' }),
        SupportTicket.countDocuments({ ...dateFilter, status: 'resolved' }),
        
        SupportTicket.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ]),

        SupportTicket.aggregate([
          { $match: dateFilter },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),

        SupportTicket.aggregate([
          {
            $match: {
              ...dateFilter,
              actualResolutionTime: { $exists: true }
            }
          },
          {
            $group: {
              _id: null,
              avgTime: {
                $avg: {
                  $divide: [
                    { $subtract: ['$actualResolutionTime', '$createdAt'] },
                    1000 * 60 * 60 // Convert to hours
                  ]
                }
              }
            }
          }
        ]),

        SupportTicket.countDocuments({
          ...dateFilter,
          firstResponseTime: { $exists: false },
          createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalTickets,
          openTickets,
          resolvedTickets,
          ticketsByCategory,
          ticketsByPriority,
          averageResolutionTime: averageResolutionTime[0]?.avgTime || 0,
          slaBreaches,
          resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets * 100).toFixed(1) : 0
        }
      });

    } catch (error) {
      console.error('Error fetching support stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch support statistics',
        error: error.message
      });
    }
  }

  // Submit feedback for resolved ticket
  static async submitFeedback(req, res) {
    try {
      const { ticketId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      const ticket = await SupportTicket.findOne({
        ticketId,
        'user.id': userId,
        status: { $in: ['resolved', 'closed'] }
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found or not eligible for feedback'
        });
      }

      ticket.feedback = {
        rating,
        comment,
        submittedAt: new Date()
      };

      await ticket.save();

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        error: error.message
      });
    }
  }
}
