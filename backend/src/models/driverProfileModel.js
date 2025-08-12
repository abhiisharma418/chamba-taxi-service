const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['profilePhoto', 'licensePhoto', 'aadharCard', 'panCard', 'medicalCertificate', 'policeVerification']
  },
  url: {
    type: String,
    required: true
  },
  expiry: {
    type: Date
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

const availabilitySchema = new mongoose.Schema({
  workingHours: {
    start: {
      type: String,
      default: '06:00'
    },
    end: {
      type: String,
      default: '22:00'
    }
  },
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  maxDistance: {
    type: Number,
    default: 25,
    min: 5,
    max: 50
  }
});

const notificationPreferencesSchema = new mongoose.Schema({
  rides: {
    type: Boolean,
    default: true
  },
  earnings: {
    type: Boolean,
    default: true
  },
  promotions: {
    type: Boolean,
    default: false
  },
  maintenance: {
    type: Boolean,
    default: true
  }
});

const driverProfileSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  personalInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    dateOfBirth: {
      type: Date
    },
    address: {
      type: String
    },
    emergencyContact: {
      name: String,
      phone: String
    }
  },
  driverInfo: {
    licenseNumber: {
      type: String,
      required: true
    },
    licenseExpiry: {
      type: Date,
      required: true
    },
    experience: {
      type: String,
      enum: ['1-2 years', '3-5 years', '5-10 years', '10+ years']
    },
    languages: [{
      type: String
    }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRides: {
      type: Number,
      default: 0
    },
    joinDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    }
  },
  documents: [documentSchema],
  preferences: {
    notifications: notificationPreferencesSchema,
    availability: availabilitySchema
  },
  verification: {
    profileComplete: {
      type: Boolean,
      default: false
    },
    documentsVerified: {
      type: Boolean,
      default: false
    },
    backgroundCheckComplete: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
driverProfileSchema.index({ driverId: 1 });
driverProfileSchema.index({ 'driverInfo.status': 1 });
driverProfileSchema.index({ 'verification.documentsVerified': 1 });

// Virtual for document expiry alerts
driverProfileSchema.virtual('documentAlerts').get(function() {
  const alerts = [];
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  this.documents.forEach(doc => {
    if (doc.expiry && doc.expiry <= thirtyDaysFromNow) {
      alerts.push({
        type: doc.type,
        expiry: doc.expiry,
        daysRemaining: Math.ceil((doc.expiry - new Date()) / (1000 * 60 * 60 * 24))
      });
    }
  });
  
  return alerts;
});

// Method to update document
driverProfileSchema.methods.updateDocument = function(documentType, url, expiry) {
  const existingDoc = this.documents.find(doc => doc.type === documentType);
  
  if (existingDoc) {
    existingDoc.url = url;
    if (expiry) existingDoc.expiry = expiry;
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
driverProfileSchema.methods.verifyDocument = function(documentType, verified = true) {
  const doc = this.documents.find(doc => doc.type === documentType);
  if (doc) {
    doc.verified = verified;
    return this.save();
  }
  throw new Error('Document not found');
};

// Method to check profile completion
driverProfileSchema.methods.checkProfileCompletion = function() {
  const requiredDocs = ['profilePhoto', 'licensePhoto', 'aadharCard', 'panCard'];
  const hasAllRequiredDocs = requiredDocs.every(docType => 
    this.documents.some(doc => doc.type === docType && doc.verified)
  );
  
  const hasBasicInfo = this.personalInfo.name && 
                      this.personalInfo.email && 
                      this.personalInfo.phone &&
                      this.driverInfo.licenseNumber;
  
  this.verification.profileComplete = hasBasicInfo && hasAllRequiredDocs;
  this.verification.documentsVerified = hasAllRequiredDocs;
  
  return this.save();
};

const DriverProfile = mongoose.model('DriverProfile', driverProfileSchema);

module.exports = DriverProfile;
