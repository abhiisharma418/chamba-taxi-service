const mongoose = require('mongoose');
const { AdminAction } = require('../models/adminUserModel');

// System Configuration Schema
const systemConfigSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['pricing', 'app', 'notifications', 'security', 'features', 'limits', 'integrations']
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: mongoose.Schema.Types.Mixed,
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  description: String,
  isEditable: {
    type: Boolean,
    default: true
  },
  requiresRestart: {
    type: Boolean,
    default: false
  },
  validationRules: {
    min: Number,
    max: Number,
    options: [mongoose.Schema.Types.Mixed],
    required: Boolean
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

systemConfigSchema.index({ category: 1, key: 1 });

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

// Initialize default configuration
const initializeDefaultConfig = async () => {
  const defaultConfigs = [
    // Pricing Configuration
    {
      category: 'pricing',
      key: 'base_fare',
      value: 40,
      dataType: 'number',
      description: 'Base fare for all rides (INR)',
      validationRules: { min: 0, max: 1000, required: true }
    },
    {
      category: 'pricing',
      key: 'per_km_rate',
      value: 12,
      dataType: 'number',
      description: 'Rate per kilometer (INR)',
      validationRules: { min: 0, max: 100, required: true }
    },
    {
      category: 'pricing',
      key: 'per_minute_rate',
      value: 2,
      dataType: 'number',
      description: 'Rate per minute (INR)',
      validationRules: { min: 0, max: 50, required: true }
    },
    {
      category: 'pricing',
      key: 'commission_rate',
      value: 0.25,
      dataType: 'number',
      description: 'Platform commission rate (0.25 = 25%)',
      validationRules: { min: 0, max: 1, required: true }
    },
    {
      category: 'pricing',
      key: 'surge_multiplier_max',
      value: 3.0,
      dataType: 'number',
      description: 'Maximum surge multiplier',
      validationRules: { min: 1, max: 10, required: true }
    },
    {
      category: 'pricing',
      key: 'cancellation_fee',
      value: 50,
      dataType: 'number',
      description: 'Cancellation fee after driver assignment (INR)',
      validationRules: { min: 0, max: 500, required: true }
    },

    // App Configuration
    {
      category: 'app',
      key: 'app_name',
      value: 'RideWithUs',
      dataType: 'string',
      description: 'Application name',
      validationRules: { required: true }
    },
    {
      category: 'app',
      key: 'support_phone',
      value: '+91-1800-123-4567',
      dataType: 'string',
      description: 'Customer support phone number',
      validationRules: { required: true }
    },
    {
      category: 'app',
      key: 'support_email',
      value: 'support@ridewithus.com',
      dataType: 'string',
      description: 'Customer support email',
      validationRules: { required: true }
    },
    {
      category: 'app',
      key: 'min_app_version',
      value: '1.0.0',
      dataType: 'string',
      description: 'Minimum supported app version',
      validationRules: { required: true }
    },
    {
      category: 'app',
      key: 'maintenance_mode',
      value: false,
      dataType: 'boolean',
      description: 'Enable maintenance mode',
      requiresRestart: true
    },

    // Notifications Configuration
    {
      category: 'notifications',
      key: 'enable_sms',
      value: true,
      dataType: 'boolean',
      description: 'Enable SMS notifications'
    },
    {
      category: 'notifications',
      key: 'enable_push',
      value: true,
      dataType: 'boolean',
      description: 'Enable push notifications'
    },
    {
      category: 'notifications',
      key: 'enable_email',
      value: true,
      dataType: 'boolean',
      description: 'Enable email notifications'
    },
    {
      category: 'notifications',
      key: 'enable_whatsapp',
      value: true,
      dataType: 'boolean',
      description: 'Enable WhatsApp notifications'
    },

    // Security Configuration
    {
      category: 'security',
      key: 'jwt_expiry_hours',
      value: 24,
      dataType: 'number',
      description: 'JWT token expiry in hours',
      validationRules: { min: 1, max: 168, required: true },
      requiresRestart: true
    },
    {
      category: 'security',
      key: 'max_login_attempts',
      value: 5,
      dataType: 'number',
      description: 'Maximum login attempts before lockout',
      validationRules: { min: 3, max: 10, required: true }
    },
    {
      category: 'security',
      key: 'account_lockout_minutes',
      value: 30,
      dataType: 'number',
      description: 'Account lockout duration in minutes',
      validationRules: { min: 5, max: 1440, required: true }
    },
    {
      category: 'security',
      key: 'require_phone_verification',
      value: true,
      dataType: 'boolean',
      description: 'Require phone number verification for new accounts'
    },
    {
      category: 'security',
      key: 'require_email_verification',
      value: true,
      dataType: 'boolean',
      description: 'Require email verification for new accounts'
    },

    // Features Configuration
    {
      category: 'features',
      key: 'enable_ride_scheduling',
      value: true,
      dataType: 'boolean',
      description: 'Enable scheduled rides feature'
    },
    {
      category: 'features',
      key: 'enable_ride_sharing',
      value: false,
      dataType: 'boolean',
      description: 'Enable ride sharing feature'
    },
    {
      category: 'features',
      key: 'enable_live_tracking',
      value: true,
      dataType: 'boolean',
      description: 'Enable live ride tracking'
    },
    {
      category: 'features',
      key: 'enable_driver_rating',
      value: true,
      dataType: 'boolean',
      description: 'Enable driver rating system'
    },
    {
      category: 'features',
      key: 'enable_customer_rating',
      value: true,
      dataType: 'boolean',
      description: 'Enable customer rating system'
    },

    // Limits Configuration
    {
      category: 'limits',
      key: 'max_ride_distance_km',
      value: 100,
      dataType: 'number',
      description: 'Maximum ride distance in kilometers',
      validationRules: { min: 1, max: 1000, required: true }
    },
    {
      category: 'limits',
      key: 'driver_search_radius_km',
      value: 10,
      dataType: 'number',
      description: 'Driver search radius in kilometers',
      validationRules: { min: 1, max: 50, required: true }
    },
    {
      category: 'limits',
      key: 'max_wait_time_minutes',
      value: 15,
      dataType: 'number',
      description: 'Maximum wait time for driver assignment',
      validationRules: { min: 5, max: 60, required: true }
    },
    {
      category: 'limits',
      key: 'max_rides_per_hour',
      value: 10,
      dataType: 'number',
      description: 'Maximum rides per user per hour',
      validationRules: { min: 1, max: 50, required: true }
    },

    // Integrations Configuration
    {
      category: 'integrations',
      key: 'google_maps_api_key',
      value: '',
      dataType: 'string',
      description: 'Google Maps API key',
      isEditable: true
    },
    {
      category: 'integrations',
      key: 'razorpay_enabled',
      value: true,
      dataType: 'boolean',
      description: 'Enable Razorpay payments'
    },
    {
      category: 'integrations',
      key: 'stripe_enabled',
      value: false,
      dataType: 'boolean',
      description: 'Enable Stripe payments'
    },
    {
      category: 'integrations',
      key: 'twilio_enabled',
      value: true,
      dataType: 'boolean',
      description: 'Enable Twilio SMS'
    }
  ];

  for (const config of defaultConfigs) {
    await SystemConfig.findOneAndUpdate(
      { key: config.key },
      config,
      { upsert: true, new: true }
    );
  }
};

// Get all system configurations
const getSystemConfig = async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = category ? { category } : {};
    
    const configs = await SystemConfig.find(query)
      .populate('lastModifiedBy', 'name email')
      .sort({ category: 1, key: 1 })
      .lean();

    // Group by category for better organization
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        configs: groupedConfigs,
        categories: Object.keys(groupedConfigs)
      }
    });
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system configuration',
      error: error.message
    });
  }
};

// Update system configuration
const updateSystemConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, reason } = req.body;

    const config = await SystemConfig.findOne({ key });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration key not found'
      });
    }

    if (!config.isEditable) {
      return res.status(403).json({
        success: false,
        message: 'This configuration is not editable'
      });
    }

    // Validate the new value
    const validationError = validateConfigValue(config, value);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    const previousValue = config.value;
    
    // Update configuration
    config.value = value;
    config.lastModifiedBy = req.user.id;
    await config.save();

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'system_config_change',
      'system',
      config._id,
      { key, value: previousValue },
      { key, value },
      reason || 'System configuration update',
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      data: config,
      message: `Configuration '${key}' updated successfully`,
      requiresRestart: config.requiresRestart
    });
  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system configuration',
      error: error.message
    });
  }
};

// Bulk update configurations
const bulkUpdateConfig = async (req, res) => {
  try {
    const { updates, reason } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be an array'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { key, value } = update;
        
        const config = await SystemConfig.findOne({ key });
        
        if (!config) {
          errors.push(`Configuration key '${key}' not found`);
          continue;
        }

        if (!config.isEditable) {
          errors.push(`Configuration '${key}' is not editable`);
          continue;
        }

        const validationError = validateConfigValue(config, value);
        if (validationError) {
          errors.push(`${key}: ${validationError}`);
          continue;
        }

        const previousValue = config.value;
        config.value = value;
        config.lastModifiedBy = req.user.id;
        await config.save();

        results.push({ key, oldValue: previousValue, newValue: value });

        // Log individual config changes
        await AdminAction.logAction(
          req.user.id,
          'system_config_change',
          'system',
          config._id,
          { key, value: previousValue },
          { key, value },
          reason || 'Bulk configuration update',
          { ipAddress: req.ip, userAgent: req.get('User-Agent') }
        );

      } catch (updateError) {
        errors.push(`${update.key}: ${updateError.message}`);
      }
    }

    res.json({
      success: true,
      data: {
        updated: results,
        errors: errors.length > 0 ? errors : null
      },
      message: `${results.length} configurations updated successfully`
    });
  } catch (error) {
    console.error('Bulk update config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update configurations',
      error: error.message
    });
  }
};

// Reset configuration to default
const resetConfigToDefault = async (req, res) => {
  try {
    const { key } = req.params;
    const { reason } = req.body;

    const config = await SystemConfig.findOne({ key });
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration key not found'
      });
    }

    if (!config.isEditable) {
      return res.status(403).json({
        success: false,
        message: 'This configuration is not editable'
      });
    }

    // Find default value (you'd store this in a separate collection or hardcode)
    const defaultValue = await getDefaultConfigValue(key);
    
    if (defaultValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'No default value found for this configuration'
      });
    }

    const previousValue = config.value;
    
    config.value = defaultValue;
    config.lastModifiedBy = req.user.id;
    await config.save();

    // Log admin action
    await AdminAction.logAction(
      req.user.id,
      'system_config_reset',
      'system',
      config._id,
      { key, value: previousValue },
      { key, value: defaultValue },
      reason || 'Configuration reset to default',
      { ipAddress: req.ip, userAgent: req.get('User-Agent') }
    );

    res.json({
      success: true,
      data: config,
      message: `Configuration '${key}' reset to default value`
    });
  } catch (error) {
    console.error('Reset config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset configuration',
      error: error.message
    });
  }
};

// Get system status and health
const getSystemStatus = async (req, res) => {
  try {
    const { Ride } = require('../models/rideModel');
    const { User } = require('../models/userModel');

    const [
      activeRides,
      onlineDrivers,
      totalUsers,
      systemHealth,
      configsRequiringRestart
    ] = await Promise.all([
      Ride.countDocuments({ status: { $in: ['requested', 'accepted', 'on-trip'] } }),
      User.countDocuments({ role: 'driver', status: 'active', isOnline: true }),
      User.countDocuments({ status: { $ne: 'deleted' } }),
      checkSystemHealth(),
      SystemConfig.find({ requiresRestart: true, lastModifiedBy: { $exists: true } })
        .populate('lastModifiedBy', 'name')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          activeRides,
          onlineDrivers,
          totalUsers,
          systemHealth: systemHealth.status,
          uptime: process.uptime()
        },
        health: systemHealth,
        alerts: {
          configsRequiringRestart: configsRequiringRestart.length,
          configs: configsRequiringRestart
        }
      }
    });
  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system status',
      error: error.message
    });
  }
};

// Helper functions
function validateConfigValue(config, value) {
  const { dataType, validationRules } = config;

  // Type validation
  switch (dataType) {
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return 'Value must be a valid number';
      }
      if (validationRules.min !== undefined && value < validationRules.min) {
        return `Value must be at least ${validationRules.min}`;
      }
      if (validationRules.max !== undefined && value > validationRules.max) {
        return `Value must be at most ${validationRules.max}`;
      }
      break;
    
    case 'string':
      if (typeof value !== 'string') {
        return 'Value must be a string';
      }
      if (validationRules.required && value.trim() === '') {
        return 'Value is required';
      }
      break;
    
    case 'boolean':
      if (typeof value !== 'boolean') {
        return 'Value must be a boolean';
      }
      break;
    
    case 'array':
      if (!Array.isArray(value)) {
        return 'Value must be an array';
      }
      break;
    
    case 'object':
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return 'Value must be an object';
      }
      break;
  }

  // Options validation
  if (validationRules.options && validationRules.options.length > 0) {
    if (!validationRules.options.includes(value)) {
      return `Value must be one of: ${validationRules.options.join(', ')}`;
    }
  }

  return null;
}

async function getDefaultConfigValue(key) {
  // In a real implementation, you'd have a default configs store
  const defaults = {
    'base_fare': 40,
    'per_km_rate': 12,
    'per_minute_rate': 2,
    'commission_rate': 0.25,
    'maintenance_mode': false,
    // ... other defaults
  };
  
  return defaults[key];
}

async function checkSystemHealth() {
  const checks = [];
  
  try {
    // Database connectivity
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    checks.push({ name: 'Database', status: dbStatus, healthy: dbStatus === 'connected' });
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memHealthy = memUsage.heapUsed / memUsage.heapTotal < 0.9;
    checks.push({ 
      name: 'Memory Usage', 
      status: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
      healthy: memHealthy 
    });
    
    // Uptime
    const uptimeHours = process.uptime() / 3600;
    checks.push({ 
      name: 'Uptime', 
      status: `${Math.round(uptimeHours * 100) / 100} hours`,
      healthy: true 
    });

  } catch (error) {
    checks.push({ name: 'Health Check', status: 'error', healthy: false, error: error.message });
  }

  const allHealthy = checks.every(check => check.healthy);
  
  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date()
  };
}

// Initialize default config on module load
initializeDefaultConfig().catch(console.error);

module.exports = {
  SystemConfig,
  getSystemConfig,
  updateSystemConfig,
  bulkUpdateConfig,
  resetConfigToDefault,
  getSystemStatus,
  initializeDefaultConfig
};
