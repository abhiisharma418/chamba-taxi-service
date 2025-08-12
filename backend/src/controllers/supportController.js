const { FAQ, SupportTicket, FAQFeedback } = require('../models/supportModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads (ticket attachments)
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/support-attachments');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.includes('document');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, PDF, DOC, DOCX, and TXT files are allowed'));
    }
  }
});

// Get all FAQs
const getFAQs = async (req, res) => {
  try {
    const { search, category } = req.query;
    
    const faqs = await FAQ.search(search, category);
    
    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
};

// Record FAQ feedback
const recordFAQFeedback = async (req, res) => {
  try {
    const { faqId } = req.params;
    const { helpful, feedback } = req.body;
    
    const faq = await FAQ.findById(faqId);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    await faq.recordFeedback(req.user.id, helpful, feedback);
    
    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Record FAQ feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record feedback',
      error: error.message
    });
  }
};

// Get support tickets for driver
const getTickets = async (req, res) => {
  try {
    const { status } = req.query;
    
    const tickets = await SupportTicket.getByDriver(req.user.id, status);
    
    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

// Get single ticket
const getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: ticketId },
        { ticketId: ticketId }
      ],
      driverId: req.user.id
    });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Mark messages as read for driver
    await ticket.markMessagesAsRead('driver');
    
    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
};

// Create new support ticket
const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, message, metadata } = req.body;
    
    const ticket = new SupportTicket({
      driverId: req.user.id,
      subject,
      category,
      priority: priority || 'medium',
      metadata: {
        ...metadata,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    
    // Add initial message
    ticket.messages.push({
      sender: 'driver',
      message,
      isRead: true // Driver's own message is marked as read
    });
    
    await ticket.save();
    
    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
};

// Add message to ticket
const addMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    
    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: ticketId },
        { ticketId: ticketId }
      ],
      driverId: req.user.id
    });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add message to closed ticket'
      });
    }
    
    // Handle file attachments if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        url: `/uploads/support-attachments/${file.filename}`,
        size: file.size,
        type: file.mimetype
      }));
    }
    
    await ticket.addMessage('driver', message, attachments);
    
    res.json({
      success: true,
      data: ticket,
      message: 'Message added successfully'
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message
    });
  }
};

// Close ticket
const closeTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { rating, feedback } = req.body;
    
    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: ticketId },
        { ticketId: ticketId }
      ],
      driverId: req.user.id
    });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    if (ticket.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is already closed'
      });
    }
    
    // Add rating and feedback if provided
    if (rating || feedback) {
      if (!ticket.resolution) {
        ticket.resolution = {};
      }
      if (rating) ticket.resolution.rating = rating;
      if (feedback) ticket.resolution.feedback = feedback;
    }
    
    await ticket.close();
    
    res.json({
      success: true,
      data: ticket,
      message: 'Ticket closed successfully'
    });
  } catch (error) {
    console.error('Close ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close ticket',
      error: error.message
    });
  }
};

// Get ticket statistics
const getTicketStats = async (req, res) => {
  try {
    const stats = await SupportTicket.aggregate([
      { $match: { driverId: req.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const ticketStats = {
      total: 0,
      open: 0,
      pending: 0,
      resolved: 0,
      closed: 0
    };
    
    stats.forEach(stat => {
      ticketStats[stat._id] = stat.count;
      ticketStats.total += stat.count;
    });
    
    // Get average resolution time for resolved tickets
    const avgResolutionTime = await SupportTicket.aggregate([
      { 
        $match: { 
          driverId: req.user.id,
          status: 'resolved',
          'resolution.resolvedAt': { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$resolutionTime' }
        }
      }
    ]);
    
    ticketStats.avgResolutionTimeHours = avgResolutionTime[0]?.avgHours || 0;
    
    res.json({
      success: true,
      data: ticketStats
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket statistics',
      error: error.message
    });
  }
};

// Get FAQ categories
const getFAQCategories = async (req, res) => {
  try {
    const categories = await FAQ.distinct('category', { isActive: true });
    
    const categoriesWithCounts = await FAQ.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        categories,
        categoriesWithCounts
      }
    });
  } catch (error) {
    console.error('Get FAQ categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ categories',
      error: error.message
    });
  }
};

// Search functionality
const search = async (req, res) => {
  try {
    const { query, type } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const results = {};
    
    if (!type || type === 'faq') {
      results.faqs = await FAQ.search(query);
    }
    
    if (!type || type === 'tickets') {
      results.tickets = await SupportTicket.find({
        driverId: req.user.id,
        $or: [
          { subject: { $regex: query, $options: 'i' } },
          { 'messages.message': { $regex: query, $options: 'i' } }
        ]
      }).sort({ updatedAt: -1 }).limit(10);
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
};

module.exports = {
  getFAQs,
  recordFAQFeedback,
  getTickets,
  getTicket,
  createTicket,
  addMessage: [upload.array('attachments', 5), addMessage],
  closeTicket,
  getTicketStats,
  getFAQCategories,
  search
};
