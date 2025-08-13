import { User } from '../models/userModel.js';
import { DriverProfile } from '../models/driverProfileModel.js';
import notificationService from '../services/notificationService.js';

// Get driver documents
export const getDriverDocuments = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await User.findById(driverId).populate('driverProfile');
    
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const driverProfile = await DriverProfile.findOne({ userId: driverId });

    res.json({
      success: true,
      data: {
        driver: {
          _id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          profilePhoto: driver.profilePhoto || driverProfile?.photo,
          verificationStatus: driver.verificationStatus || 'pending',
          status: driver.status,
          createdAt: driver.createdAt,
          documents: driverProfile?.documents || [],
          vehicleDetails: driverProfile?.vehicle || null,
          address: driverProfile?.address || null,
          rating: driverProfile?.rating || 0,
          totalRides: driverProfile?.totalRides || 0
        }
      }
    });
  } catch (error) {
    console.error('Get driver documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver documents',
      error: error.message
    });
  }
};

// Update document status
export const updateDocumentStatus = async (req, res) => {
  try {
    const { driverId, documentId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or pending'
      });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a document'
      });
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const driverProfile = await DriverProfile.findOne({ userId: driverId });
    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // Find and update the document
    const documentIndex = driverProfile.documents.findIndex(
      doc => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Update document status
    driverProfile.documents[documentIndex].status = status;
    driverProfile.documents[documentIndex].verifiedAt = new Date();
    driverProfile.documents[documentIndex].verifiedBy = req.user._id;

    if (status === 'rejected') {
      driverProfile.documents[documentIndex].rejectionReason = rejectionReason;
    } else {
      driverProfile.documents[documentIndex].rejectionReason = undefined;
    }

    await driverProfile.save();

    // Send notification to driver
    const documentType = driverProfile.documents[documentIndex].type;
    const notificationTitle = status === 'approved' 
      ? '✅ Document Approved' 
      : '❌ Document Rejected';
    
    const notificationMessage = status === 'approved'
      ? `Your ${documentType} has been approved by our verification team.`
      : `Your ${documentType} was rejected. Reason: ${rejectionReason}`;

    await notificationService.sendNotification(driverId, {
      type: 'document_verification',
      title: notificationTitle,
      message: notificationMessage,
      action: status === 'rejected' ? 'reupload_document' : 'view_profile'
    });

    res.json({
      success: true,
      message: `Document ${status} successfully`,
      data: {
        documentId,
        status,
        verifiedAt: driverProfile.documents[documentIndex].verifiedAt,
        verifiedBy: driverProfile.documents[documentIndex].verifiedBy
      }
    });
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document status',
      error: error.message
    });
  }
};

// Update driver verification status
export const updateDriverVerificationStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, note } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or pending'
      });
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Update driver verification status
    driver.verificationStatus = status;
    driver.status = status === 'approved' ? 'active' : 'inactive';
    
    if (status === 'approved') {
      driver.verified = true;
    }

    await driver.save();

    // Update driver profile
    const driverProfile = await DriverProfile.findOne({ userId: driverId });
    if (driverProfile) {
      driverProfile.verificationStatus = status;
      driverProfile.verificationDate = new Date();
      driverProfile.verifiedBy = req.user._id;
      
      if (note) {
        driverProfile.verificationNote = note;
      }
      
      await driverProfile.save();
    }

    // Send notification to driver
    const notificationTitle = status === 'approved' 
      ? '🎉 Verification Complete' 
      : '❌ Verification Failed';
    
    const notificationMessage = status === 'approved'
      ? 'Congratulations! Your driver account has been verified. You can now start accepting ride requests.'
      : `Your driver verification was unsuccessful. ${note || 'Please review your documents and resubmit.'}`;

    await notificationService.sendNotification(driverId, {
      type: 'driver_verification',
      title: notificationTitle,
      message: notificationMessage,
      action: status === 'approved' ? 'start_driving' : 'review_documents'
    });

    // Send notification to admin
    await notificationService.sendSystemNotification(
      await getAdminUserIds(),
      `Driver ${status}`,
      `Driver ${driver.name} has been ${status} for verification.`
    );

    res.json({
      success: true,
      message: `Driver verification ${status} successfully`,
      data: {
        driverId,
        status,
        verifiedAt: driver.verificationStatus === 'approved' ? new Date() : null
      }
    });
  } catch (error) {
    console.error('Update driver verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver verification status',
      error: error.message
    });
  }
};

// Get all pending verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Find drivers with pending verification status
    const pendingDrivers = await User.aggregate([
      {
        $match: {
          role: 'driver',
          $or: [
            { verificationStatus: 'pending' },
            { verificationStatus: { $exists: false } }
          ]
        }
      },
      {
        $lookup: {
          from: 'driverprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $addFields: {
          profile: { $arrayElemAt: ['$profile', 0] },
          pendingDocuments: {
            $size: {
              $filter: {
                input: { $ifNull: [{ $arrayElemAt: ['$profile.documents', 0] }, []] },
                cond: { $eq: ['$$this.status', 'pending'] }
              }
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          createdAt: 1,
          verificationStatus: 1,
          pendingDocuments: 1,
          totalDocuments: { $size: { $ifNull: ['$profile.documents', []] } },
          profilePhoto: { $ifNull: ['$profilePhoto', '$profile.photo'] }
        }
      }
    ]);

    const total = await User.countDocuments({
      role: 'driver',
      $or: [
        { verificationStatus: 'pending' },
        { verificationStatus: { $exists: false } }
      ]
    });

    res.json({
      success: true,
      data: {
        drivers: pendingDrivers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications',
      error: error.message
    });
  }
};

// Bulk approve/reject documents
export const bulkUpdateDocuments = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { driverId, documentId, status, rejectionReason }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required and must not be empty'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { driverId, documentId, status, rejectionReason } = update;

        const driverProfile = await DriverProfile.findOne({ userId: driverId });
        if (!driverProfile) {
          errors.push({ driverId, error: 'Driver profile not found' });
          continue;
        }

        const documentIndex = driverProfile.documents.findIndex(
          doc => doc._id.toString() === documentId
        );

        if (documentIndex === -1) {
          errors.push({ driverId, documentId, error: 'Document not found' });
          continue;
        }

        // Update document
        driverProfile.documents[documentIndex].status = status;
        driverProfile.documents[documentIndex].verifiedAt = new Date();
        driverProfile.documents[documentIndex].verifiedBy = req.user._id;

        if (status === 'rejected') {
          driverProfile.documents[documentIndex].rejectionReason = rejectionReason;
        }

        await driverProfile.save();

        results.push({
          driverId,
          documentId,
          status,
          success: true
        });

        // Send notification
        await notificationService.sendNotification(driverId, {
          type: 'document_verification',
          title: status === 'approved' ? '✅ Document Approved' : '❌ Document Rejected',
          message: `Your document has been ${status}.`,
          action: 'view_profile'
        });

      } catch (error) {
        errors.push({
          driverId: update.driverId,
          documentId: update.documentId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} documents successfully`,
      data: {
        successful: results,
        errors,
        totalProcessed: updates.length,
        successCount: results.length,
        errorCount: errors.length
      }
    });
  } catch (error) {
    console.error('Bulk update documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update documents',
      error: error.message
    });
  }
};

// Helper function to get admin user IDs
async function getAdminUserIds() {
  const admins = await User.find({ role: 'admin' }, '_id');
  return admins.map(admin => admin._id.toString());
}

// Get verification statistics
export const getVerificationStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: { role: 'driver' }
      },
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const documentStats = await DriverProfile.aggregate([
      {
        $unwind: '$documents'
      },
      {
        $group: {
          _id: '$documents.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      drivers: {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      },
      documents: {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      }
    };

    stats.forEach(stat => {
      const status = stat._id || 'pending';
      formattedStats.drivers[status] = stat.count;
      formattedStats.drivers.total += stat.count;
    });

    documentStats.forEach(stat => {
      const status = stat._id || 'pending';
      formattedStats.documents[status] = stat.count;
      formattedStats.documents.total += stat.count;
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification statistics',
      error: error.message
    });
  }
};
