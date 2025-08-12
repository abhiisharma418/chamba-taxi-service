const mongoose = require('mongoose');

// FAQ Schema
const faqSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['earnings', 'rides', 'app', 'account', 'documents', 'vehicle', 'safety', 'payments', 'general']
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0 // Higher numbers appear first
  }
}, {
  timestamps: true
});

// Support Ticket Message Schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['driver', 'support', 'system'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    type: String
  }],
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Support Ticket Schema
const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['earnings', 'rides', 'app', 'account', 'documents', 'vehicle', 'safety', 'payments', 'other']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'resolved', 'closed'],
    default: 'open'
  },
  messages: [messageSchema],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Support agent
  },
  resolution: {
    summary: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    appVersion: String,
    deviceInfo: String
  }
}, {
  timestamps: true
});

// FAQ Feedback Schema
const faqFeedbackSchema = new mongoose.Schema({
  faqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  helpful: {
    type: Boolean,
    required: true
  },
  feedback: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes
faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

supportTicketSchema.index({ driverId: 1, status: 1 });
supportTicketSchema.index({ ticketId: 1 });
supportTicketSchema.index({ category: 1, priority: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

faqFeedbackSchema.index({ faqId: 1, driverId: 1 }, { unique: true });

// Virtual for ticket age
supportTicketSchema.virtual('ageInHours').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual for unread messages count
supportTicketSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => !msg.isRead && msg.sender !== 'driver').length;
});

// Pre-save middleware to generate ticket ID
supportTicketSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.ticketId = `TKT-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to add message to ticket
supportTicketSchema.methods.addMessage = function(sender, message, attachments = []) {
  this.messages.push({
    sender,
    message,
    attachments,
    isRead: sender === 'driver' // Mark as read if sent by driver
  });
  
  // Update status based on sender
  if (sender === 'driver' && this.status === 'pending') {
    this.status = 'open';
  } else if (sender === 'support' && this.status === 'open') {
    this.status = 'pending';
  }
  
  return this.save();
};

// Method to mark messages as read
supportTicketSchema.methods.markMessagesAsRead = function(sender) {
  this.messages.forEach(msg => {
    if (msg.sender !== sender) {
      msg.isRead = true;
    }
  });
  return this.save();
};

// Method to resolve ticket
supportTicketSchema.methods.resolve = function(resolvedBy, summary) {
  this.status = 'resolved';
  this.resolution = {
    summary,
    resolvedAt: new Date(),
    resolvedBy
  };
  return this.save();
};

// Method to close ticket
supportTicketSchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

// Static method to get tickets by driver
supportTicketSchema.statics.getByDriver = function(driverId, status = null) {
  const query = { driverId };
  if (status) query.status = status;
  return this.find(query).sort({ updatedAt: -1 });
};

// Static method to search FAQs
faqSchema.statics.search = function(searchTerm, category = null) {
  const query = { isActive: true };
  
  if (category && category !== 'all') {
    query.category = category;
  }
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  return this.find(query).sort({ priority: -1, helpful: -1 });
};

// Method to record FAQ feedback
faqSchema.methods.recordFeedback = async function(driverId, helpful, feedback = null) {
  try {
    // Create or update feedback record
    await FAQFeedback.findOneAndUpdate(
      { faqId: this._id, driverId },
      { helpful, feedback },
      { upsert: true, new: true }
    );
    
    // Update FAQ helpful/not helpful counts
    const feedbackCounts = await FAQFeedback.aggregate([
      { $match: { faqId: this._id } },
      {
        $group: {
          _id: '$helpful',
          count: { $sum: 1 }
        }
      }
    ]);
    
    this.helpful = feedbackCounts.find(f => f._id === true)?.count || 0;
    this.notHelpful = feedbackCounts.find(f => f._id === false)?.count || 0;
    
    return this.save();
  } catch (error) {
    throw error;
  }
};

const FAQ = mongoose.model('FAQ', faqSchema);
const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
const FAQFeedback = mongoose.model('FAQFeedback', faqFeedbackSchema);

module.exports = { FAQ, SupportTicket, FAQFeedback };
