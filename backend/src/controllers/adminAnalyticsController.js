import { Ride } from '../models/rideModel.js';
import { User } from '../models/userModel.js';
import Payment from '../models/paymentModel.js';
import { UserActivity } from '../models/adminUserModel.js';
import TrackingData from '../models/trackingModel.js';

// Get comprehensive analytics dashboard
const getAnalyticsDashboard = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [
      rideMetrics,
      userMetrics,
      financialMetrics,
      operationalMetrics,
      growthMetrics
    ] = await Promise.all([
      getRideMetrics(startDate),
      getUserMetrics(startDate),
      getFinancialMetrics(startDate),
      getOperationalMetrics(startDate),
      getGrowthMetrics(startDate)
    ]);

    res.json({
      success: true,
      data: {
        period: `${startDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
        overview: {
          totalRides: rideMetrics.totalRides,
          totalRevenue: financialMetrics.totalRevenue,
          activeUsers: userMetrics.activeUsers,
          avgRating: rideMetrics.avgRating
        },
        metrics: {
          rides: rideMetrics,
          users: userMetrics,
          financial: financialMetrics,
          operational: operationalMetrics,
          growth: growthMetrics
        }
      }
    });
  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics dashboard',
      error: error.message
    });
  }
};

// Get detailed ride analytics
const getRideAnalytics = async (req, res) => {
  try {
    const { 
      period = '30d',
      groupBy = 'day',
      region,
      vehicleType 
    } = req.query;

    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const matchQuery = {
      createdAt: { $gte: startDate }
    };

    if (region) matchQuery.region = region;
    if (vehicleType) matchQuery.vehicleType = vehicleType;

    // Determine grouping format
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d-%H';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const [
      ridesByTime,
      ridesByStatus,
      ridesByVehicleType,
      ridesByRegion,
      averageMetrics,
      peakHours,
      cancellationReasons
    ] = await Promise.all([
      Ride.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            count: { $sum: 1 },
            revenue: { $sum: '$fare.actual' },
            avgFare: { $avg: '$fare.actual' },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      Ride.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      Ride.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$vehicleType', count: { $sum: 1 }, revenue: { $sum: '$fare.actual' } } }
      ]),
      
      Ride.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$region', count: { $sum: 1 }, revenue: { $sum: '$fare.actual' } } }
      ]),
      
      Ride.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        {
          $group: {
            _id: null,
            avgDistance: { $avg: '$distance' },
            avgDuration: { $avg: '$duration' },
            avgFare: { $avg: '$fare.actual' },
            avgRating: { $avg: '$rating.overall' }
          }
        }
      ]),
      
      Ride.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      Ride.aggregate([
        { $match: { ...matchQuery, status: 'cancelled' } },
        { $group: { _id: '$cancellationReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        timeline: ridesByTime,
        breakdown: {
          byStatus: ridesByStatus,
          byVehicleType: ridesByVehicleType,
          byRegion: ridesByRegion
        },
        metrics: averageMetrics[0] || {},
        insights: {
          peakHours,
          cancellationReasons
        }
      }
    });
  } catch (error) {
    console.error('Get ride analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ride analytics',
      error: error.message
    });
  }
};

// Get user behavior analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [
      userRegistrations,
      userActivity,
      retentionMetrics,
      userSegmentation,
      topUsers,
      churnAnalysis
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              role: '$role'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      
      UserActivity.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              action: '$action'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      
      calculateRetentionMetrics(startDate),
      
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$role',
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            verified: { $sum: { $cond: ['$verified', 1, 0] } }
          }
        }
      ]),
      
      getTopUsers(startDate),
      
      calculateChurnAnalysis(startDate)
    ]);

    res.json({
      success: true,
      data: {
        registrations: userRegistrations,
        activity: userActivity,
        retention: retentionMetrics,
        segmentation: userSegmentation,
        topUsers,
        churn: churnAnalysis
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
};

// Get financial analytics
const getFinancialAnalytics = async (req, res) => {
  try {
    const { period = '30d', currency = 'INR' } = req.query;
    
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [
      revenueTimeline,
      paymentMethodAnalysis,
      refundAnalysis,
      profitabilityAnalysis,
      driverEarningsAnalysis,
      geographicRevenue
    ] = await Promise.all([
      getRevenueTimeline(startDate),
      getPaymentMethodAnalysis(startDate),
      getRefundAnalysis(startDate),
      getProfitabilityAnalysis(startDate),
      getDriverEarningsAnalysis(startDate),
      getGeographicRevenue(startDate)
    ]);

    res.json({
      success: true,
      data: {
        currency,
        timeline: revenueTimeline,
        paymentMethods: paymentMethodAnalysis,
        refunds: refundAnalysis,
        profitability: profitabilityAnalysis,
        driverEarnings: driverEarningsAnalysis,
        geographic: geographicRevenue
      }
    });
  } catch (error) {
    console.error('Get financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial analytics',
      error: error.message
    });
  }
};

// Get operational analytics
const getOperationalAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [
      driverPerformance,
      supplyDemandAnalysis,
      waitTimeAnalysis,
      utilizationMetrics,
      serviceQualityMetrics,
      geographicAnalysis
    ] = await Promise.all([
      getDriverPerformanceMetrics(startDate),
      getSupplyDemandAnalysis(startDate),
      getWaitTimeAnalysis(startDate),
      getUtilizationMetrics(startDate),
      getServiceQualityMetrics(startDate),
      getGeographicAnalysis(startDate)
    ]);

    res.json({
      success: true,
      data: {
        driverPerformance,
        supplyDemand: supplyDemandAnalysis,
        waitTimes: waitTimeAnalysis,
        utilization: utilizationMetrics,
        serviceQuality: serviceQualityMetrics,
        geographic: geographicAnalysis
      }
    });
  } catch (error) {
    console.error('Get operational analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch operational analytics',
      error: error.message
    });
  }
};

// Generate custom reports
const generateCustomReport = async (req, res) => {
  try {
    const {
      reportType,
      metrics,
      filters,
      groupBy,
      dateRange,
      format = 'json'
    } = req.body;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    let reportData;

    switch (reportType) {
      case 'rides':
        reportData = await generateRideReport(metrics, filters, groupBy, startDate, endDate);
        break;
      case 'users':
        reportData = await generateUserReport(metrics, filters, groupBy, startDate, endDate);
        break;
      case 'financial':
        reportData = await generateFinancialReport(metrics, filters, groupBy, startDate, endDate);
        break;
      case 'operational':
        reportData = await generateOperationalReport(metrics, filters, groupBy, startDate, endDate);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: {
        reportType,
        dateRange,
        generatedAt: new Date(),
        data: reportData
      }
    });
  } catch (error) {
    console.error('Generate custom report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom report',
      error: error.message
    });
  }
};

// Helper functions for analytics calculations
async function getRideMetrics(startDate) {
  const result = await Ride.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalRides: { $sum: 1 },
        completedRides: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        cancelledRides: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        avgFare: { $avg: '$fare.actual' },
        avgDistance: { $avg: '$distance' },
        avgDuration: { $avg: '$duration' },
        avgRating: { $avg: '$rating.overall' }
      }
    }
  ]);

  return result[0] || {};
}

async function getUserMetrics(startDate) {
  const [userStats, activityStats] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          newUsers: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } },
          drivers: { $sum: { $cond: [{ $eq: ['$role', 'driver'] }, 1, 0] } },
          customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } }
        }
      }
    ]),
    UserActivity.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: null, totalActivities: { $sum: 1 } } }
    ])
  ]);

  return {
    ...userStats[0] || {},
    totalActivities: activityStats[0]?.totalActivities || 0
  };
}

async function getFinancialMetrics(startDate) {
  const result = await Ride.aggregate([
    { $match: { status: 'completed', completedAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$fare.actual' },
        totalCommission: { $sum: { $multiply: ['$fare.actual', 0.25] } },
        totalDriverEarnings: { $sum: { $multiply: ['$fare.actual', 0.75] } },
        avgRevenue: { $avg: '$fare.actual' }
      }
    }
  ]);

  return result[0] || {};
}

async function getOperationalMetrics(startDate) {
  const [avgWaitTime, utilizationRate, onlineDrivers] = await Promise.all([
    calculateAverageWaitTime(startDate),
    calculateUtilizationRate(startDate),
    User.countDocuments({ role: 'driver', isOnline: true })
  ]);

  return {
    avgWaitTime,
    utilizationRate,
    onlineDrivers
  };
}

async function getGrowthMetrics(startDate) {
  const thirtyDaysAgo = new Date(startDate);
  const sixtyDaysAgo = new Date(startDate);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);

  const [currentPeriod, previousPeriod] = await Promise.all([
    Ride.countDocuments({ createdAt: { $gte: startDate } }),
    Ride.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: startDate } })
  ]);

  const growthRate = previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;

  return {
    currentPeriod,
    previousPeriod,
    growthRate: Math.round(growthRate * 100) / 100
  };
}

// Additional helper functions would be implemented here...
async function calculateRetentionMetrics(startDate) {
  // Implementation for user retention calculation
  return {
    dailyRetention: 0.85,
    weeklyRetention: 0.65,
    monthlyRetention: 0.45
  };
}

async function calculateChurnAnalysis(startDate) {
  // Implementation for churn analysis
  return {
    churnRate: 0.05,
    riskFactors: ['low_activity', 'negative_ratings']
  };
}

async function getTopUsers(startDate) {
  return User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $lookup: {
        from: 'rides',
        localField: '_id',
        foreignField: 'customerId',
        as: 'rides'
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        role: 1,
        totalRides: { $size: '$rides' },
        totalSpent: { $sum: '$rides.fare.actual' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ]);
}

function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  
  return [headers, ...rows].join('\n');
}

module.exports = {
  getAnalyticsDashboard,
  getRideAnalytics,
  getUserAnalytics,
  getFinancialAnalytics,
  getOperationalAnalytics,
  generateCustomReport
};
