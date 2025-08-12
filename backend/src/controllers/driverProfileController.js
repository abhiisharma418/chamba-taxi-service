const DriverProfile = require('../models/driverProfileModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/documents');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Get driver profile
const getProfile = async (req, res) => {
  try {
    let profile = await DriverProfile.findOne({ driverId: req.user.id });
    
    if (!profile) {
      // Create initial profile if doesn't exist
      profile = new DriverProfile({
        driverId: req.user.id,
        personalInfo: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || ''
        },
        driverInfo: {
          licenseNumber: '',
          licenseExpiry: new Date(),
          rating: 0,
          totalRides: 0
        },
        documents: [],
        preferences: {
          notifications: {
            rides: true,
            earnings: true,
            promotions: false,
            maintenance: true
          },
          availability: {
            workingHours: { start: '06:00', end: '22:00' },
            workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            maxDistance: 25
          }
        }
      });
      await profile.save();
    }
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update driver profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    let profile = await DriverProfile.findOne({ driverId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    // Update fields
    if (updates.personalInfo) {
      Object.assign(profile.personalInfo, updates.personalInfo);
    }
    
    if (updates.driverInfo) {
      Object.assign(profile.driverInfo, updates.driverInfo);
    }
    
    if (updates.preferences) {
      if (updates.preferences.notifications) {
        Object.assign(profile.preferences.notifications, updates.preferences.notifications);
      }
      if (updates.preferences.availability) {
        Object.assign(profile.preferences.availability, updates.preferences.availability);
      }
    }
    
    await profile.save();
    await profile.checkProfileCompletion();
    
    res.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    const { documentType, expiry } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    let profile = await DriverProfile.findOne({ driverId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    const documentUrl = `/uploads/documents/${req.file.filename}`;
    
    await profile.updateDocument(documentType, documentUrl, expiry ? new Date(expiry) : null);
    
    res.json({
      success: true,
      data: {
        type: documentType,
        url: documentUrl,
        expiry: expiry ? new Date(expiry) : null
      },
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

// Get document alerts
const getDocumentAlerts = async (req, res) => {
  try {
    const profile = await DriverProfile.findOne({ driverId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    const alerts = profile.documentAlerts;
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get document alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document alerts',
      error: error.message
    });
  }
};

// Verify document (admin only)
const verifyDocument = async (req, res) => {
  try {
    const { driverId, documentType, verified, notes } = req.body;
    
    // Check if user is admin (you'll need to implement admin check)
    if (req.user.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const profile = await DriverProfile.findOne({ driverId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    await profile.verifyDocument(documentType, verified);
    
    // Log verification action
    console.log(`Document ${documentType} for driver ${driverId} ${verified ? 'verified' : 'rejected'} by ${req.user.id}`);
    
    res.json({
      success: true,
      message: `Document ${verified ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document',
      error: error.message
    });
  }
};

// Get profile completion status
const getProfileCompletion = async (req, res) => {
  try {
    const profile = await DriverProfile.findOne({ driverId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    await profile.checkProfileCompletion();
    
    const requiredDocs = ['profilePhoto', 'licensePhoto', 'aadharCard', 'panCard'];
    const uploadedDocs = profile.documents.map(doc => doc.type);
    const verifiedDocs = profile.documents.filter(doc => doc.verified).map(doc => doc.type);
    
    const completion = {
      profileComplete: profile.verification.profileComplete,
      documentsVerified: profile.verification.documentsVerified,
      backgroundCheckComplete: profile.verification.backgroundCheckComplete,
      requiredDocuments: requiredDocs,
      uploadedDocuments: uploadedDocs,
      verifiedDocuments: verifiedDocs,
      missingDocuments: requiredDocs.filter(doc => !uploadedDocs.includes(doc)),
      pendingVerification: uploadedDocs.filter(doc => !verifiedDocs.includes(doc))
    };
    
    res.json({
      success: true,
      data: completion
    });
  } catch (error) {
    console.error('Get profile completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile completion status',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadDocument: [upload.single('document'), uploadDocument],
  getDocumentAlerts,
  verifyDocument,
  getProfileCompletion
};
