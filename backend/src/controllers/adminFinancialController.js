const { Ride } = require('../models/rideModel');
const Payment = require('../models/paymentModel');
const Wallet = require('../models/walletModel');
const { AdminAction } = require('../models/adminUserModel');

// Get financial dashboard overview
const getFinancialOverview = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [
      totalRevenue,
      totalCommission,
      totalDriverPayouts,
      completedRides,
      pendingPayments,
      refundsProcessed,
      revenueByDay,
      paymentMethodStats,
      topEarningDrivers
    ] = await Promise.all([
      calculateTotalRevenue(startDate),
      calculateTotalCommission(startDate),
      calculateDriverPayouts(startDate),
      Ride.countDocuments({
        status: 'completed',
        completedAt: { $gte: startDate }
      }),
      Payment.countDocuments({
        status: 'pending',
        createdAt: { $gte: startDate }
      }),
      Payment.countDocuments({
        type: 'refund',
        createdAt: { $gte: startDate }
      }),
      getRevenueByDay(startDate),
      getPaymentMethodStats(startDate),
      getTopEarningDrivers(startDate, 10)
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalCommission,
          totalDriverPayouts,
          completedRides,
          pendingPayments,
          refundsProcessed,
          netProfit: totalCommission
        },
        trends: {
          revenueByDay,
          paymentMethods: paymentMethodStats
        },
        insights: {
          topEarningDrivers,
          avgRideValue: completedRides > 0 ? totalRevenue / completedRides : 0,
          commissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Get financial overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial overview',
      error: error.message
    });
  }
};

// Get detailed payment transactions
const getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      method,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (method) query.method = method;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { 'metadata.orderId': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('rideId', 'pickup destination fare')
        .populate('customerId', 'name email phone')
        .populate('driverId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Payment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason, notifyCustomer = true } = req.body;

    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not in completed status'
      });
    }

    const refundAmount = amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    // Create refund record
    const refund = new Payment({
      type: 'refund',
      customerId: payment.customerId,
      rideId: payment.rideId,
      amount: refundAmount,
      method: payment.method,
      status: 'processing',
      metadata: {
        originalPaymentId: paymentId,
        refundReason: reason,
        processedBy: req.user.id
      }
    });

    await refund.save();

    // Update original payment
    payment.refundAmount = (payment.refundAmount || 0) + refundAmount;
    payment.refundStatus = refundAmount >= payment.amount ? 'full' : 'partial';
    await payment.save();

    // Process refund based on payment method
    let refundResult;
    try {
      switch (payment.method) {
        case 'razorpay':
          refundResult = await processRazorpayRefund(payment.providerPaymentId, refundAmount);
          break;
        case 'stripe':
          refundResult = await processStripeRefund(payment.providerPaymentId, refundAmount);
          break;
        case 'upi':
        case 'wallet':
          refundResult = await processWalletRefund(payment.customerId, refundAmount);
          break;
        default:
          refundResult = { status: 'manual', message: 'Manual refund required' };
      }

      // Update refund status
      refund.status = refundResult.status === 'success' ? 'completed' : 'failed';
      refund.providerRefundId = refundResult.refundId;
      refund.metadata.refundResponse = refundResult;
      await refund.save();

    } catch (refundError) {
      refund.status = 'failed';
      refund.metadata.refundError = refundError.message;
      await refund.save();
    }

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'refund_process',
      'payment',
      paymentId,
      payment.toObject(),
      refund.toObject(),
      reason,
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      data: refund,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
};

// Get driver payouts
const getDriverPayouts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      driverId,
      startDate,
      endDate
    } = req.query;

    const query = { type: 'driver_payout' };
    
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      Payment.find(query)
        .populate('driverId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Payment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get driver payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver payouts',
      error: error.message
    });
  }
};

// Process driver payout
const processDriverPayout = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { amount, method = 'bank_transfer', notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payout amount'
      });
    }

    // Check driver wallet balance
    const wallet = await Wallet.findOne({ userId: driverId });
    
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Create payout record
    const payout = new Payment({
      type: 'driver_payout',
      driverId,
      amount,
      method,
      status: 'processing',
      metadata: {
        processedBy: req.user.id,
        payoutMethod: method,
        notes
      }
    });

    await payout.save();

    // Deduct from driver wallet
    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'debit',
      amount,
      description: `Payout to ${method}`,
      paymentId: payout._id
    });
    await wallet.save();

    // Process payout (integration with payment gateway)
    // For now, mark as completed
    payout.status = 'completed';
    await payout.save();

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'driver_payout',
      'payment',
      payout._id,
      null,
      payout.toObject(),
      notes || 'Driver payout processed',
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      data: payout,
      message: 'Driver payout processed successfully'
    });
  } catch (error) {
    console.error('Process driver payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process driver payout',
      error: error.message
    });
  }
};

// Get financial reports
const getFinancialReports = async (req, res) => {
  try {
    const { 
      type = 'revenue', 
      period = '30d',
      format = 'json'
    } = req.query;

    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    let reportData;

    switch (type) {
      case 'revenue':
        reportData = await generateRevenueReport(startDate);
        break;
      case 'commission':
        reportData = await generateCommissionReport(startDate);
        break;
      case 'payouts':
        reportData = await generatePayoutReport(startDate);
        break;
      case 'summary':
        reportData = await generateSummaryReport(startDate);
        break;
      default:
        reportData = await generateSummaryReport(startDate);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${period}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Get financial reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: error.message
    });
  }
};

// Helper functions
async function calculateTotalRevenue(startDate) {
  const result = await Ride.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$fare.actual' }
      }
    }
  ]);
  
  return result[0]?.total || 0;
}

async function calculateTotalCommission(startDate) {
  const result = await Ride.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$fare.actual', 0.25] } } // 25% commission
      }
    }
  ]);
  
  return result[0]?.total || 0;
}

async function calculateDriverPayouts(startDate) {
  const result = await Ride.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$fare.actual', 0.75] } } // 75% to driver
      }
    }
  ]);
  
  return result[0]?.total || 0;
}

async function getRevenueByDay(startDate) {
  return Ride.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
        },
        revenue: { $sum: '$fare.actual' },
        rides: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function getPaymentMethodStats(startDate) {
  return Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        total: { $sum: '$amount' }
      }
    }
  ]);
}

async function getTopEarningDrivers(startDate, limit) {
  return Ride.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate },
        driverId: { $exists: true }
      }
    },
    {
      $group: {
        _id: '$driverId',
        totalEarnings: { $sum: { $multiply: ['$fare.actual', 0.75] } },
        totalRides: { $sum: 1 },
        avgRating: { $avg: '$rating.driver' }
      }
    },
    { $sort: { totalEarnings: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'driver'
      }
    }
  ]);
}

async function generateRevenueReport(startDate) {
  const [dailyRevenue, monthlyRevenue, paymentMethods] = await Promise.all([
    getRevenueByDay(startDate),
    getMonthlyRevenue(startDate),
    getPaymentMethodStats(startDate)
  ]);

  return {
    period: `${startDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
    daily: dailyRevenue,
    monthly: monthlyRevenue,
    paymentMethods
  };
}

async function generateCommissionReport(startDate) {
  return Ride.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
        },
        totalFare: { $sum: '$fare.actual' },
        commission: { $sum: { $multiply: ['$fare.actual', 0.25] } },
        rides: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function generatePayoutReport(startDate) {
  return Payment.aggregate([
    {
      $match: {
        type: 'driver_payout',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        totalPayouts: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function generateSummaryReport(startDate) {
  const [revenue, commission, payouts, rides] = await Promise.all([
    calculateTotalRevenue(startDate),
    calculateTotalCommission(startDate),
    calculateDriverPayouts(startDate),
    Ride.countDocuments({ status: 'completed', completedAt: { $gte: startDate } })
  ]);

  return {
    period: `${startDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
    summary: {
      totalRevenue: revenue,
      totalCommission: commission,
      totalPayouts: payouts,
      totalRides: rides,
      avgRideValue: rides > 0 ? revenue / rides : 0,
      commissionRate: revenue > 0 ? (commission / revenue) * 100 : 0
    }
  };
}

function convertToCSV(data) {
  // Simple CSV conversion - would need more sophisticated logic for complex nested data
  if (!data || !Array.isArray(data)) return '';
  
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  
  return [headers, ...rows].join('\n');
}

module.exports = {
  getFinancialOverview,
  getPayments,
  processRefund,
  getDriverPayouts,
  processDriverPayout,
  getFinancialReports
};
