import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';

export const uploadDocuments = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'driver') return res.status(403).json({ success: false, message: 'Forbidden' });
  const files = (req.files || []).map(f => ({ filename: f.filename, url: `/uploads/${f.filename}`, uploadedAt: new Date() }));
  user.driver = user.driver || {};
  user.driver.documents = [...(user.driver.documents || []), ...files];
  user.driver.verificationStatus = 'pending';
  await user.save();
  res.status(201).json({ success: true, data: user.driver });
};

export const adminSetVerification = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'driver') return res.status(404).json({ success: false, message: 'Driver not found' });
  user.driver = user.driver || {};
  user.driver.verificationStatus = req.body.status;
  await user.save();
  res.json({ success: true, data: user.driver });
};

// Driver earnings analytics
export const getDriverEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { period = 'daily' } = req.query;

    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const lastWeekStart = new Date(thisWeekStart.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Aggregations for summary
    const [
      todayEarnings,
      yesterdayEarnings,
      thisWeekEarnings,
      lastWeekEarnings,
      thisMonthEarnings,
      lastMonthEarnings,
      totalStats
    ] = await Promise.all([
      // Today
      Ride.aggregate([
        { $match: { driverId: driverId, status: 'completed', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$fare' }, count: { $sum: 1 } } }
      ]),
      // Yesterday
      Ride.aggregate([
        { $match: { driverId: driverId, status: 'completed', createdAt: { $gte: yesterday, $lt: today } } },
        { $group: { _id: null, total: { $sum: '$fare' }, count: { $sum: 1 } } }
      ]),
      // This week
      Ride.aggregate([
        { $match: { driverId: driverId, status: 'completed', createdAt: { $gte: thisWeekStart } } },
        { $group: { _id: null, total: { $sum: '$fare' }, count: { $sum: 1 } } }
      ]),
      // Last week
      Ride.aggregate([
        { $match: { driverId: driverId, status: 'completed', createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } } },
        { $group: { _id: null, total: { $sum: '$fare' }, count: { $sum: 1 } } }
      ]),
      // This month
      Ride.aggregate([
        { $match: { driverId: driverId, status: 'completed', createdAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$fare' }, count: { $sum: 1 } } }
      ]),
      // Last month
      Ride.aggregate([
        { $match: { driverId: driverId, status: 'completed', createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$fare' }, count: { $sum: 1 } } }
      ]),
      // Total stats
      Ride.aggregate([
        { $match: { driverId: driverId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$fare' }, count: { $sum: 1 }, avg: { $avg: '$fare' } } }
      ])
    ]);

    // Period-based data
    let periodData = [];
    if (period === 'daily') {
      // Last 30 days
      periodData = await Ride.aggregate([
        {
          $match: {
            driverId: driverId,
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            amount: { $sum: '$fare' },
            rides: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
    } else if (period === 'weekly') {
      // Last 12 weeks
      periodData = await Ride.aggregate([
        {
          $match: {
            driverId: driverId,
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              week: { $week: '$createdAt' }
            },
            amount: { $sum: '$fare' },
            rides: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } }
      ]);
    } else if (period === 'monthly') {
      // Last 12 months
      periodData = await Ride.aggregate([
        {
          $match: {
            driverId: driverId,
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            amount: { $sum: '$fare' },
            rides: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
    }

    // Peak hours analysis
    const peakHours = await Ride.aggregate([
      {
        $match: {
          driverId: driverId,
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          earnings: { $sum: '$fare' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // Best earning day
    const bestDay = await Ride.aggregate([
      {
        $match: {
          driverId: driverId,
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          earnings: { $sum: '$fare' },
          count: { $sum: 1 }
        }
      },
      { $sort: { earnings: -1 } },
      { $limit: 1 }
    ]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const summary = {
      today: todayEarnings[0]?.total || 0,
      yesterday: yesterdayEarnings[0]?.total || 0,
      thisWeek: thisWeekEarnings[0]?.total || 0,
      lastWeek: lastWeekEarnings[0]?.total || 0,
      thisMonth: thisMonthEarnings[0]?.total || 0,
      lastMonth: lastMonthEarnings[0]?.total || 0,
      totalEarnings: totalStats[0]?.total || 0,
      totalRides: totalStats[0]?.count || 0,
      avgPerRide: Math.round(totalStats[0]?.avg || 0),
      peakHours: peakHours.map(h => `${h._id}:00`),
      topEarningDay: bestDay[0] ? dayNames[bestDay[0]._id - 1] : 'N/A'
    };

    res.json({
      success: true,
      data: {
        summary,
        [period]: periodData,
        period
      }
    });
  } catch (error) {
    console.error('Driver earnings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings data' });
  }
};

export const getEarningsBreakdown = async (req, res) => {
  try {
    const driverId = req.user.id;
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const breakdown = await Ride.aggregate([
      {
        $match: {
          driverId: driverId,
          status: 'completed',
          createdAt: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          rideFare: { $sum: '$fare' },
          tips: { $sum: { $ifNull: ['$tips', 0] } },
          incentives: { $sum: { $ifNull: ['$incentives', 0] } },
          surge: { $sum: { $ifNull: ['$surgeAmount', 0] } },
          cancellationFee: { $sum: { $ifNull: ['$cancellationFee', 0] } }
        }
      }
    ]);

    const result = breakdown[0] || {
      rideFare: 0,
      tips: 0,
      incentives: 0,
      surge: 0,
      cancellationFee: 0
    };

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Earnings breakdown error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings breakdown' });
  }
};

export const getEarningsHistory = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const rides = await Ride.find({
      driverId: driverId,
      status: 'completed'
    })
    .select('pickup destination fare tips incentives surgeAmount createdAt')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Ride.countDocuments({
      driverId: driverId,
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        rides,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Earnings history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings history' });
  }
};
