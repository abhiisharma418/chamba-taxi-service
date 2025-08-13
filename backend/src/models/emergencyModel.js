import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s\-\(\)]+$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  relationship: {
    type: String,
    required: true,
    enum: ['family', 'friend', 'colleague', 'other'],
    default: 'family'
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
});

const emergencyIncidentSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['customer', 'driver'],
    required: true
  },
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false
  },
  incidentType: {
    type: String,
    enum: ['medical', 'accident', 'harassment', 'theft', 'other', 'panic', 'vehicle_breakdown'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: false
    },
    landmark: {
      type: String,
      required: false
    }
  },
  description: {
    type: String,
    maxlength: 1000,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm', 'escalated'],
    default: 'active'
  },
  responseTeam: {
    assignedOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: false
    },
    responseTime: {
      type: Date,
      required: false
    },
    notes: {
      type: String,
      maxlength: 2000,
      required: false
    }
  },
  contactsNotified: [{
    contactId: String,
    contactName: String,
    contactPhone: String,
    notificationTime: Date,
    notificationMethod: {
      type: String,
      enum: ['sms', 'call', 'app'],
      default: 'sms'
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    }
  }],
  emergencyServices: {
    policeNotified: {
      type: Boolean,
      default: false
    },
    ambulanceNotified: {
      type: Boolean,
      default: false
    },
    fireServiceNotified: {
      type: Boolean,
      default: false
    },
    notificationTime: Date,
    referenceNumber: String
  },
  timeline: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'timeline.performedByModel'
    },
    performedByModel: {
      type: String,
      enum: ['User', 'AdminUser', 'System']
    },
    details: String
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'audio', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  resolution: {
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    },
    resolution: String,
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date
  },
  metadata: {
    deviceInfo: {
      platform: String,
      version: String,
      batteryLevel: Number
    },
    networkInfo: {
      connectionType: String,
      signalStrength: Number
    },
    appVersion: String
  }
}, {
  timestamps: true
});

const emergencySettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emergencyContacts: [emergencyContactSchema],
  medicalInfo: {
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
      default: 'unknown'
    },
    allergies: [{
      allergen: String,
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        default: 'moderate'
      }
    }],
    medications: [String],
    medicalConditions: [String],
    emergencyMedicalInfo: {
      type: String,
      maxlength: 500
    }
  },
  preferences: {
    autoCallPolice: {
      type: Boolean,
      default: false
    },
    autoCallAmbulance: {
      type: Boolean,
      default: false
    },
    shareLocationWithContacts: {
      type: Boolean,
      default: true
    },
    recordAudio: {
      type: Boolean,
      default: false
    },
    enableFakeCall: {
      type: Boolean,
      default: true
    },
    sosShortcut: {
      type: String,
      enum: ['volume_buttons', 'power_button', 'shake_device', 'app_button'],
      default: 'app_button'
    }
  },
  notifications: {
    smsEnabled: {
      type: Boolean,
      default: true
    },
    callEnabled: {
      type: Boolean,
      default: true
    },
    appNotifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

emergencyIncidentSchema.pre('save', async function(next) {
  if (this.isNew && !this.incidentId) {
    this.incidentId = `SOS${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

emergencyIncidentSchema.methods.addTimelineEntry = function(action, performedBy, performedByModel, details) {
  this.timeline.push({
    action,
    performedBy,
    performedByModel,
    details,
    timestamp: new Date()
  });
  return this.save();
};

emergencyIncidentSchema.methods.updateStatus = function(newStatus, resolvedBy, resolution) {
  this.status = newStatus;
  
  if (newStatus === 'resolved' && !this.resolution.resolvedAt) {
    this.resolution.resolvedAt = new Date();
    this.resolution.resolvedBy = resolvedBy;
    this.resolution.resolution = resolution;
  }
  
  return this.addTimelineEntry(`Status changed to ${newStatus}`, resolvedBy, 'AdminUser', resolution);
};

emergencyIncidentSchema.methods.escalate = function(assignedOperator, notes) {
  this.status = 'escalated';
  this.responseTeam.assignedOperator = assignedOperator;
  this.responseTeam.responseTime = new Date();
  this.responseTeam.notes = notes;
  
  return this.addTimelineEntry('Incident escalated', assignedOperator, 'AdminUser', notes);
};

emergencySettingsSchema.methods.addEmergencyContact = function(contact) {
  if (contact.isPrimary) {
    this.emergencyContacts.forEach(c => c.isPrimary = false);
  }
  this.emergencyContacts.push(contact);
  return this.save();
};

emergencySettingsSchema.methods.removeEmergencyContact = function(contactId) {
  this.emergencyContacts = this.emergencyContacts.filter(
    contact => contact._id.toString() !== contactId.toString()
  );
  return this.save();
};

emergencySettingsSchema.methods.getPrimaryContact = function() {
  return this.emergencyContacts.find(contact => contact.isPrimary) || this.emergencyContacts[0];
};

emergencyIncidentSchema.index({ userId: 1, createdAt: -1 });
emergencyIncidentSchema.index({ incidentId: 1 });
emergencyIncidentSchema.index({ status: 1, createdAt: -1 });
emergencyIncidentSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

const EmergencyIncident = mongoose.model('EmergencyIncident', emergencyIncidentSchema);
const EmergencySettings = mongoose.model('EmergencySettings', emergencySettingsSchema);

module.exports = {
  EmergencyIncident,
  EmergencySettings
};
