import Joi from 'joi';
import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';
import multer from 'multer';
import path from 'path';

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/driver-documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// Get driver profile
export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.id;
    
    const driver = await User.findById(driverId).select('-password');
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Get driver statistics
    const rides = await Ride.find({ driverId }).sort({ createdAt: -1 });
    const completedRides = rides.filter(ride => ride.status === 'completed');
    
    const stats = {
      totalRides: completedRides.length,
      rating: driver.rating || 0,
      totalRatings: driver.totalRatings || 0,
      joinDate: driver.createdAt,
      badgesEarned: driver.badges || [],
      verificationLevel: driver.verificationLevel || 'basic',
      acceptanceRate: calculateAcceptanceRate(rides),
      cancellationRate: calculateCancellationRate(rides),
      avgTripTime: calculateAvgTripTime(completedRides)
    };

    const profile = {
      personalInfo: {
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        address: driver.address || '',
        dateOfBirth: driver.dateOfBirth || '',
        emergencyContact: driver.emergencyContact || '',
        profilePhoto: driver.profilePhoto || ''
      },
      vehicleInfo: driver.vehicleDetails || {
        make: '',
        model: '',
        year: '',
        color: '',
        licensePlate: '',
        registrationNumber: '',
        insuranceExpiry: '',
        pollutionExpiry: '',
        vehiclePhoto: ''
      },
      documents: driver.documents || {
        drivingLicense: { uploaded: false, verified: false, expiryDate: '' },
        aadharCard: { uploaded: false, verified: false },
        panCard: { uploaded: false, verified: false },
        vehicleRC: { uploaded: false, verified: false },
        insurance: { uploaded: false, verified: false, expiryDate: '' },
        pollutionCert: { uploaded: false, verified: false, expiryDate: '' }
      },
      stats
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get driver profile' });
  }
};

// Update driver profile
export const updateDriverProfile = async (req, res) => {
  const schema = Joi.object({
    personalInfo: Joi.object({
      name: Joi.string().optional(),
      phone: Joi.string().optional(),
      email: Joi.string().email().optional(),
      address: Joi.string().optional(),
      dateOfBirth: Joi.date().optional(),
      emergencyContact: Joi.string().optional()
    }).optional(),
    vehicleInfo: Joi.object({
      make: Joi.string().optional(),
      model: Joi.string().optional(),
      year: Joi.string().optional(),
      color: Joi.string().optional(),
      licensePlate: Joi.string().optional(),
      registrationNumber: Joi.string().optional(),
      insuranceExpiry: Joi.date().optional(),
      pollutionExpiry: Joi.date().optional()
    }).optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const driverId = req.user.id;
    const updateData = {};

    if (value.personalInfo) {
      Object.assign(updateData, value.personalInfo);
    }

    if (value.vehicleInfo) {
      updateData.vehicleDetails = value.vehicleInfo;
    }

    const updatedDriver = await User.findByIdAndUpdate(
      driverId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: updatedDriver });
  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update driver profile' });
  }
};

// Upload document
export const uploadDocument = async (req, res) => {
  try {
    const { documentType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const driverId = req.user.id;
    const filePath = `/uploads/driver-documents/${file.filename}`;

    // Update driver document status
    const updateField = `documents.${documentType}`;
    const updateData = {
      [`${updateField}.uploaded`]: true,
      [`${updateField}.filePath`]: filePath,
      [`${updateField}.uploadedAt`]: new Date()
    };

    await User.findByIdAndUpdate(driverId, updateData);

    res.json({
      success: true,
      data: {
        documentType,
        filePath,
        uploaded: true
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

// Get driver earnings
export const getDriverEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { period = 'daily' } = req.query;

    const rides = await Ride.find({ 
      driverId, 
      status: 'completed' 
    }).sort({ completedAt: -1 });

    const earningsData = calculateEarnings(rides, period);
    
    res.json({ success: true, data: earningsData });
  } catch (error) {
    console.error('Get driver earnings error:', error);
    res.status(500).json({ success: false, message: 'Failed to get earnings data' });
  }
};

// Get driver statistics
export const getDriverStats = async (req, res) => {
  try {
    const driverId = req.user.id;
    
    const driver = await User.findById(driverId);
    const rides = await Ride.find({ driverId });
    const completedRides = rides.filter(ride => ride.status === 'completed');
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayRides = completedRides.filter(ride => 
      new Date(ride.completedAt) >= todayStart
    );

    const thisWeek = getWeekStart(today);
    const weekRides = completedRides.filter(ride => 
      new Date(ride.completedAt) >= thisWeek
    );

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthRides = completedRides.filter(ride => 
      new Date(ride.completedAt) >= thisMonth
    );

    const stats = {
      todayEarnings: todayRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
      weeklyEarnings: weekRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
      monthlyEarnings: monthRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
      totalRides: completedRides.length,
      todayRides: todayRides.length,
      rating: driver.rating || 0,
      totalRatings: driver.totalRatings || 0,
      acceptanceRate: calculateAcceptanceRate(rides),
      cancellationRate: calculateCancellationRate(rides),
      avgTripTime: calculateAvgTripTime(completedRides)
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get driver stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get driver statistics' });
  }
};

// Helper functions
function calculateAcceptanceRate(rides) {
  const totalOffers = rides.length;
  const acceptedRides = rides.filter(ride => ride.status !== 'cancelled').length;
  return totalOffers > 0 ? Math.round((acceptedRides / totalOffers) * 100) : 0;
}

function calculateCancellationRate(rides) {
  const totalRides = rides.length;
  const cancelledRides = rides.filter(ride => ride.status === 'cancelled').length;
  return totalRides > 0 ? Math.round((cancelledRides / totalRides) * 100) : 0;
}

function calculateAvgTripTime(completedRides) {
  if (completedRides.length === 0) return 0;
  
  const totalTime = completedRides.reduce((sum, ride) => {
    if (ride.startedAt && ride.completedAt) {
      return sum + (new Date(ride.completedAt) - new Date(ride.startedAt));
    }
    return sum;
  }, 0);
  
  return Math.round(totalTime / completedRides.length / (1000 * 60)); // Convert to minutes
}

function calculateEarnings(rides, period) {
  const now = new Date();
  let data = [];
  let summary = {};

  switch (period) {
    case 'daily':
      data = getLast30DaysData(rides);
      break;
    case 'weekly':
      data = getLast12WeeksData(rides);
      break;
    case 'monthly':
      data = getLast12MonthsData(rides);
      break;
  }

  // Calculate summary
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  
  const todayRides = rides.filter(ride => new Date(ride.completedAt) >= todayStart);
  const yesterdayRides = rides.filter(ride => 
    new Date(ride.completedAt) >= yesterdayStart && 
    new Date(ride.completedAt) < todayStart
  );

  summary = {
    today: todayRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
    yesterday: yesterdayRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
    thisWeek: getWeeklyEarnings(rides, getWeekStart(today)),
    lastWeek: getWeeklyEarnings(rides, getWeekStart(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))),
    thisMonth: getMonthlyEarnings(rides, new Date(today.getFullYear(), today.getMonth(), 1)),
    lastMonth: getMonthlyEarnings(rides, new Date(today.getFullYear(), today.getMonth() - 1, 1)),
    totalEarnings: rides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
    totalRides: rides.length,
    avgPerRide: rides.length > 0 ? Math.round(rides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0) / rides.length) : 0,
    peakHours: ['9:00 AM', '6:00 PM', '10:00 PM'], // This would be calculated from actual data
    topEarningDay: 'Saturday' // This would be calculated from actual data
  };

  const breakdown = {
    rideFare: rides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
    tips: rides.reduce((sum, ride) => sum + (ride.tip || 0), 0),
    incentives: rides.reduce((sum, ride) => sum + (ride.incentive || 0), 0),
    surge: rides.reduce((sum, ride) => sum + (ride.surgeAmount || 0), 0),
    cancellationFee: rides.reduce((sum, ride) => sum + (ride.cancellationFee || 0), 0)
  };

  return {
    [period]: data,
    summary,
    breakdown
  };
}

function getLast30DaysData(rides) {
  const data = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayRides = rides.filter(ride => {
      const rideDate = new Date(ride.completedAt);
      return rideDate >= dayStart && rideDate < dayEnd;
    });
    
    data.push({
      date: dayStart.toISOString().split('T')[0],
      amount: dayRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
      rides: dayRides.length
    });
  }
  
  return data;
}

function getLast12WeeksData(rides) {
  const data = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const weekStart = getWeekStart(new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000));
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const weekRides = rides.filter(ride => {
      const rideDate = new Date(ride.completedAt);
      return rideDate >= weekStart && rideDate < weekEnd;
    });
    
    data.push({
      week: `Week ${12 - i}`,
      amount: weekRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
      rides: weekRides.length
    });
  }
  
  return data;
}

function getLast12MonthsData(rides) {
  const data = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
    
    const monthRides = rides.filter(ride => {
      const rideDate = new Date(ride.completedAt);
      return rideDate >= monthStart && rideDate < monthEnd;
    });
    
    data.push({
      month: monthStart.toLocaleString('default', { month: 'long' }),
      amount: monthRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0),
      rides: monthRides.length
    });
  }
  
  return data;
}

function getWeekStart(date) {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}

function getWeeklyEarnings(rides, weekStart) {
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekRides = rides.filter(ride => {
    const rideDate = new Date(ride.completedAt);
    return rideDate >= weekStart && rideDate < weekEnd;
  });
  return weekRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0);
}

function getMonthlyEarnings(rides, monthStart) {
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const monthRides = rides.filter(ride => {
    const rideDate = new Date(ride.completedAt);
    return rideDate >= monthStart && rideDate < monthEnd;
  });
  return monthRides.reduce((sum, ride) => sum + (ride.fare.actual || ride.fare.estimated), 0);
}
