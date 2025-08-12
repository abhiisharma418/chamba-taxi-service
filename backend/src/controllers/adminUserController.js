const { User } = require('../models/userModel');
const { UserActivity, UserSuspension, UserVerification, AdminAction } = require('../models/adminUserModel');
const DriverProfile = require('../models/driverProfileModel');

// Get all users with filtering and pagination
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      verified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Apply filters
    if (role) query.role = role;
    if (status) query.status = status;
    if (verified !== undefined) query.verified = verified === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    // Get additional data for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const [suspension, verification, activityCount] = await Promise.all([
          UserSuspension.findOne({ userId: user._id, isActive: true }),
          UserVerification.findOne({ userId: user._id }),
          UserActivity.countDocuments({ 
            userId: user._id, 
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
          })
        ]);

        return {
          ...user,
          isSuspended: !!suspension,
          suspensionReason: suspension?.reason,
          verificationStatus: verification?.identity?.verified ? 'verified' : 'pending',
          recentActivityCount: activityCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithDetails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get single user details
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const [user, suspension, verification, driverProfile] = await Promise.all([
      User.findById(userId).select('-password').lean(),
      UserSuspension.findOne({ userId, isActive: true }),
      UserVerification.findOne({ userId }),
      DriverProfile.findOne({ driverId: userId })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get recent activity
    const recentActivity = await UserActivity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get activity stats
    const activityStats = await UserActivity.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          isSuspended: !!suspension,
          suspension,
          verification,
          driverProfile
        },
        activity: {
          recent: recentActivity,
          stats: activityStats
        }
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates._id;
    delete updates.createdAt;

    const previousState = await User.findById(userId).select('-password').lean();
    
    if (!previousState) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'user_update',
      'user',
      userId,
      previousState,
      updatedUser.toObject(),
      req.body.reason || 'User update',
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Suspend user
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, type = 'temporary', endDate } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create suspension record
    await UserSuspension.suspendUser(userId, req.user.id, reason, type, endDate);

    // Update user status
    const previousState = user.toObject();
    user.status = 'suspended';
    await user.save();

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'user_suspend',
      'user',
      userId,
      previousState,
      user.toObject(),
      reason,
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
};

// Unsuspend user
const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove suspension
    await UserSuspension.unsuspendUser(userId);

    // Update user status
    const previousState = user.toObject();
    user.status = 'active';
    await user.save();

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'user_unsuspend',
      'user',
      userId,
      previousState,
      user.toObject(),
      reason || 'User unsuspended',
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      message: 'User unsuspended successfully'
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsuspend user',
      error: error.message
    });
  }
};

// Verify user documents
const verifyUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { documentType, status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected.'
      });
    }

    let verification = await UserVerification.findOne({ userId });
    
    if (!verification) {
      verification = new UserVerification({ userId });
    }

    await verification.verifyDocument(documentType, status, req.user.id, rejectionReason);

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      status === 'approved' ? 'document_approve' : 'document_reject',
      'user',
      userId,
      null,
      { documentType, status, rejectionReason },
      `Document ${status}`,
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      data: verification,
      message: `Document ${status} successfully`
    });
  } catch (error) {
    console.error('Verify user documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify documents',
      error: error.message
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const previousState = user.toObject();

    // Soft delete - mark as deleted instead of actually removing
    user.status = 'deleted';
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    await user.save();

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'user_delete',
      'user',
      userId,
      previousState,
      user.toObject(),
      reason || 'User deleted',
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      newUsersThisMonth,
      usersByRole,
      usersByStatus,
      recentSignups
    ] = await Promise.all([
      User.countDocuments({ status: { $ne: 'deleted' } }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo },
        status: { $ne: 'deleted' }
      }),
      User.aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      User.find({ 
        createdAt: { $gte: thirtyDaysAgo },
        status: { $ne: 'deleted' }
      })
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    ]);

    // Get verification stats
    const verificationStats = await UserVerification.aggregate([
      {
        $group: {
          _id: '$identity.verified',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          newUsersThisMonth,
          verifiedUsers: verificationStats.find(v => v._id === true)?.count || 0,
          pendingVerification: verificationStats.find(v => v._id === false)?.count || 0
        },
        breakdown: {
          byRole: usersByRole,
          byStatus: usersByStatus
        },
        recentSignups
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// Get admin action logs
const getAdminLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      adminId,
      action,
      targetType,
      startDate,
      endDate
    } = req.query;

    const query = {};
    
    if (adminId) query.adminId = adminId;
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AdminAction.find(query)
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AdminAction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin logs',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserDetails,
  updateUser,
  suspendUser,
  unsuspendUser,
  verifyUserDocuments,
  deleteUser,
  getUserStats,
  getAdminLogs
};
