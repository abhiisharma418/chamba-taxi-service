const mongoose = require('mongoose');

const vehicleDocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['registration', 'insurance', 'pollution', 'fitness', 'permit']
  },
  url: {
    type: String,
    required: true
  },
  expiry: {
    type: Date,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const serviceRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['routine', 'repair', 'emergency'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  mileage: {
    type: Number,
    required: true,
    min: 0
  },
  garage: {
    type: String,
    required: true
  },
  nextServiceDue: {
    type: Date
  },
  receipts: [{
    type: String // URLs to receipt images/PDFs
  }]
}, {
  timestamps: true
});

const inspectionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  issues: [{
    type: String
  }],
  inspector: {
    type: String
  },
  nextInspectionDue: {
    type: Date
  },
  certificate: {
    type: String // URL to inspection certificate
  }
}, {
  timestamps: true
});

const vehicleSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  color: {
    type: String,
    required: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['hatchback', 'sedan', 'suv', 'auto'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'cng', 'electric'],
    required: true
  },
  seatingCapacity: {
    type: Number,
    required: true,
    min: 2,
    max: 8
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'suspended'],
    default: 'active'
  },
  documents: [vehicleDocumentSchema],
  maintenance: {
    currentMileage: {
      type: Number,
      default: 0,
      min: 0
    },
    lastServiceDate: {
      type: Date
    },
    nextServiceDate: {
      type: Date
    },
    serviceIntervalKm: {
      type: Number,
      default: 10000 // Default service interval in kilometers
    },
    serviceHistory: [serviceRecordSchema]
  },
  inspection: {
    currentScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastInspectionDate: {
      type: Date
    },
    nextInspectionDate: {
      type: Date
    },
    inspectionHistory: [inspectionSchema]
  },
  insurance: {
    provider: String,
    policyNumber: String,
    premium: Number,
    startDate: Date,
    endDate: Date,
    coverage: {
      thirdParty: Boolean,
      comprehensive: Boolean,
      personalAccident: Boolean
    }
  },
  features: {
    ac: {
      type: Boolean,
      default: false
    },
    gps: {
      type: Boolean,
      default: false
    },
    musicSystem: {
      type: Boolean,
      default: false
    },
    wifi: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
vehicleSchema.index({ driverId: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ isActive: 1 });

// Virtual for upcoming service reminder
vehicleSchema.virtual('serviceReminder').get(function() {
  if (!this.maintenance.nextServiceDate && !this.maintenance.lastServiceDate) {
    return null;
  }
  
  const nextService = this.maintenance.nextServiceDate;
  const today = new Date();
  
  if (nextService) {
    const daysUntilService = Math.ceil((nextService - today) / (1000 * 60 * 60 * 24));
    return {
      daysUntilService,
      overdue: daysUntilService < 0,
      urgent: daysUntilService <= 7 && daysUntilService >= 0
    };
  }
  
  return null;
});

// Virtual for document expiry alerts
vehicleSchema.virtual('documentAlerts').get(function() {
  const alerts = [];
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  this.documents.forEach(doc => {
    if (doc.expiry <= thirtyDaysFromNow) {
      alerts.push({
        type: doc.type,
        expiry: doc.expiry,
        daysRemaining: Math.ceil((doc.expiry - new Date()) / (1000 * 60 * 60 * 24)),
        expired: doc.expiry < new Date()
      });
    }
  });
  
  return alerts;
});

// Method to add service record
vehicleSchema.methods.addServiceRecord = function(serviceData) {
  this.maintenance.serviceHistory.push(serviceData);
  this.maintenance.lastServiceDate = serviceData.date;
  this.maintenance.currentMileage = serviceData.mileage;
  
  // Calculate next service date (3 months or serviceIntervalKm from last service)
  const nextServiceDate = new Date(serviceData.date);
  nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);
  this.maintenance.nextServiceDate = nextServiceDate;
  
  return this.save();
};

// Method to add inspection record
vehicleSchema.methods.addInspectionRecord = function(inspectionData) {
  this.inspection.inspectionHistory.push(inspectionData);
  this.inspection.lastInspectionDate = inspectionData.date;
  this.inspection.currentScore = inspectionData.score;
  
  // Calculate next inspection date (3 months from last inspection)
  const nextInspectionDate = new Date(inspectionData.date);
  nextInspectionDate.setMonth(nextInspectionDate.getMonth() + 3);
  this.inspection.nextInspectionDate = nextInspectionDate;
  
  return this.save();
};

// Method to update document
vehicleSchema.methods.updateDocument = function(documentType, url, expiry) {
  const existingDoc = this.documents.find(doc => doc.type === documentType);
  
  if (existingDoc) {
    existingDoc.url = url;
    existingDoc.expiry = expiry;
    existingDoc.verified = false; // Reset verification when document is updated
    existingDoc.uploadedAt = new Date();
  } else {
    this.documents.push({
      type: documentType,
      url,
      expiry,
      verified: false
    });
  }
  
  return this.save();
};

// Method to verify document
vehicleSchema.methods.verifyDocument = function(documentType, verified = true) {
  const doc = this.documents.find(doc => doc.type === documentType);
  if (doc) {
    doc.verified = verified;
    return this.save();
  }
  throw new Error('Document not found');
};

// Static method to get vehicles by driver
vehicleSchema.statics.getByDriver = function(driverId) {
  return this.find({ driverId }).sort({ createdAt: -1 });
};

// Static method to get active vehicles by driver
vehicleSchema.statics.getActiveByDriver = function(driverId) {
  return this.find({ driverId, isActive: true, status: 'active' });
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
