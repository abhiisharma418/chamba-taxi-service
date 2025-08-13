import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true,
    index: true
  },
  sender: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: String,
      enum: ['customer', 'driver'],
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  receiver: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: String,
      enum: ['customer', 'driver'],
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  message: {
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ['text', 'image', 'location', 'quick_reply'],
      default: 'text'
    },
    metadata: {
      imageUrl: String,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      },
      quickReplyType: {
        type: String,
        enum: ['eta_request', 'pickup_confirmation', 'destination_reached', 'custom']
      }
    }
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  deliveredAt: Date
}, {
  timestamps: true
});

// Index for efficient querying
chatMessageSchema.index({ rideId: 1, createdAt: -1 });
chatMessageSchema.index({ 'sender.id': 1, 'receiver.id': 1 });

// Virtual for formatting timestamp
chatMessageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to mark as read
chatMessageSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Method to mark as delivered
chatMessageSchema.methods.markAsDelivered = function() {
  if (this.status === 'sent') {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
