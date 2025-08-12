import Vehicle from '../models/vehicleModel.js';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/vehicle-documents');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
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
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

// Middleware to handle upload for a single document file with field name 'document'
export const uploadDocumentMiddleware = upload.single('document');

// Controller functions

export const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.getByDriver(req.user.id);
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicles', error: error.message });
  }
};

export const getVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, driverId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle', error: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const vehicleData = { ...req.body, driverId: req.user.id };

    // Uppercase license plate for uniqueness check
    if (vehicleData.licensePlate) {
      vehicleData.licensePlate = vehicleData.licensePlate.toUpperCase();
    }

    const existingVehicle = await Vehicle.findOne({ licensePlate: vehicleData.licensePlate });
    if (existingVehicle) {
      return res.status(400).json({ success: false, message: 'Vehicle with this license plate already exists' });
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    res.status(201).json({ success: true, data: vehicle, message: 'Vehicle created successfully' });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ success: false, message: 'Failed to create vehicle', error: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const updates = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, driverId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Check license plate uniqueness if updated
    if (updates.licensePlate && updates.licensePlate.toUpperCase() !== vehicle.licensePlate) {
      const existingVehicle = await Vehicle.findOne({
        licensePlate: updates.licensePlate.toUpperCase(),
        _id: { $ne: vehicleId }
      });
      if (existingVehicle) {
        return res.status(400).json({ success: false, message: 'Vehicle with this license plate already exists' });
      }
      updates.licensePlate = updates.licensePlate.toUpperCase();
    }

    Object.assign(vehicle, updates);
    await vehicle.save();

    res.json({ success: true, data: vehicle, message: 'Vehicle updated successfully' });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ success: false, message: 'Failed to update vehicle', error: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOneAndDelete({ _id: vehicleId, driverId: req.user.id });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete vehicle', error: error.message });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { documentType, expiry } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, driverId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const documentUrl = `/uploads/vehicle-documents/${req.file.filename}`;

    await vehicle.updateDocument(documentType, documentUrl, expiry ? new Date(expiry) : null);

    res.json({
      success: true,
      data: { type: documentType, url: documentUrl, expiry: expiry ? new Date(expiry) : null },
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Upload vehicle document error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document', error: error.message });
  }
};

export const addServiceRecord = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const serviceData = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, driverId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await vehicle.addServiceRecord(serviceData);

    res.json({ success: true, data: vehicle.maintenance, message: 'Service record added successfully' });
  } catch (error) {
    console.error('Add service record error:', error);
    res.status(500).json({ success: false, message: 'Failed to add service record', error: error.message });
  }
};

export const addInspectionRecord = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const inspectionData = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, driverId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await vehicle.addInspectionRecord(inspectionData);

    res.json({ success: true, data: vehicle.inspection, message: 'Inspection record added successfully' });
  } catch (error) {
    console.error('Add inspection record error:', error);
    res.status(500).json({ success: false, message: 'Failed to add inspection record', error: error.message });
  }
};

export const getVehicleAlerts = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ _id: vehicleId, driverId: req.user.id });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const alerts = {
      documentAlerts: vehicle.documentAlerts,
      serviceReminder: vehicle.serviceReminder,
      inspectionDue:
        vehicle.inspection?.nextInspectionDate &&
        vehicle.inspection.nextInspectionDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Get vehicle alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle alerts', error: error.message });
  }
};

export const toggleVehicleStatus = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { isActive } = req.body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, driverId: req.user.id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.isActive = isActive;
    vehicle.status = isActive ? 'active' : 'inactive';
    await vehicle.save();

    res.json({
      success: true,
      data: { isActive: vehicle.isActive, status: vehicle.status },
      message: `Vehicle ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle vehicle status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update vehicle status', error: error.message });
  }
};

export const getVehicleStats = async (req, res) => {
  try {
    const vehicles = await Vehicle.getByDriver(req.user.id);

    const stats = {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.isActive && v.status === 'active').length,
      vehiclesInMaintenance: vehicles.filter(v => v.status === 'maintenance').length,
      documentAlertsCount: vehicles.reduce((count, vehicle) => count + vehicle.documentAlerts.length, 0),
      servicesDue: vehicles.filter(v => v.serviceReminder?.urgent).length
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get vehicle stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle statistics', error: error.message });
  }
};
