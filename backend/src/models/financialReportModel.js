import mongoose from 'mongoose';

const financialReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: [
      'daily_summary',
      'weekly_summary', 
      'monthly_summary',
      'quarterly_summary',
      'yearly_summary',
      'driver_earnings',
      'commission_report',
      'payment_breakdown',
      'refund_report',
      'tax_report',
      'custom_range'
    ],
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'expired'],
    default: 'generating'
  },
  data: {
    // Summary totals
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalCommission: {
      type: Number,
      default: 0
    },
    totalDriverEarnings: {
      type: Number,
      default: 0
    },
    totalRides: {
      type: Number,
      default: 0
    },
    totalRefunds: {
      type: Number,
      default: 0
    },
    
    // Breakdown by payment method
    paymentBreakdown: {
      cash: {
        amount: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
      },
      card: {
        amount: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
      },
      wallet: {
        amount: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
      },
      upi: {
        amount: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
      }
    },
    
    // Breakdown by vehicle type
    vehicleTypeBreakdown: [{
      vehicleType: String,
      revenue: Number,
      rideCount: Number,
      commission: Number
    }],
    
    // Daily/hourly breakdown
    timeSeriesData: [{
      date: Date,
      revenue: Number,
      rideCount: Number,
      commission: Number,
      driverEarnings: Number
    }],
    
    // Top performers
    topDrivers: [{
      driverId: mongoose.Schema.Types.ObjectId,
      driverName: String,
      totalEarnings: Number,
      totalRides: Number,
      rating: Number
    }],
    
    // Geographic breakdown
    cityBreakdown: [{
      city: String,
      revenue: Number,
      rideCount: Number
    }],
    
    // Cancellation and refund data
    cancellations: {
      count: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 },
      byReason: [{
        reason: String,
        count: Number,
        refundAmount: Number
      }]
    },
    
    // Tax information
    taxBreakdown: {
      gst: {
        rate: Number,
        amount: Number
      },
      serviceTax: {
        rate: Number,
        amount: Number
      },
      totalTaxCollected: Number
    }
  },
  
  // Export settings
  exportSettings: {
    formats: [{
      type: {
        type: String,
        enum: ['pdf', 'excel', 'csv']
      },
      generated: {
        type: Boolean,
        default: false
      },
      filePath: String,
      fileSize: Number,
      downloadCount: {
        type: Number,
        default: 0
      }
    }],
    includeCharts: {
      type: Boolean,
      default: true
    },
    includeDetailedBreakdown: {
      type: Boolean,
      default: true
    }
  },
  
  // Processing information
  processingInfo: {
    startTime: Date,
    endTime: Date,
    processingDuration: Number, // in milliseconds
    recordsProcessed: Number,
    errors: [String]
  },
  
  // Scheduling information
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly']
    },
    nextRun: Date,
    emailRecipients: [String]
  },
  
  // Access control
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'confidential'],
    default: 'restricted'
  },
  
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes for performance
financialReportSchema.index({ reportType: 1, 'period.startDate': 1, 'period.endDate': 1 });
financialReportSchema.index({ generatedBy: 1, createdAt: -1 });
financialReportSchema.index({ status: 1 });
financialReportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate report ID
financialReportSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = await this.constructor.countDocuments({ 
      createdAt: { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
      } 
    });
    this.reportId = `FIN-${date}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for file downloads
financialReportSchema.virtual('downloadUrls').get(function() {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return this.exportSettings.formats.reduce((urls, format) => {
    if (format.generated && format.filePath) {
      urls[format.type] = `${baseUrl}/api/financial/reports/${this.reportId}/download/${format.type}`;
    }
    return urls;
  }, {});
});

// Method to mark report as completed
financialReportSchema.methods.markCompleted = function(processingDuration) {
  this.status = 'completed';
  this.processingInfo.endTime = new Date();
  this.processingInfo.processingDuration = processingDuration;
  return this.save();
};

// Method to mark report as failed
financialReportSchema.methods.markFailed = function(error) {
  this.status = 'failed';
  this.processingInfo.endTime = new Date();
  this.processingInfo.errors.push(error);
  return this.save();
};

// Method to increment download count
financialReportSchema.methods.incrementDownload = function(format) {
  const formatObj = this.exportSettings.formats.find(f => f.type === format);
  if (formatObj) {
    formatObj.downloadCount += 1;
    return this.save();
  }
};

export const FinancialReport = mongoose.model('FinancialReport', financialReportSchema);
