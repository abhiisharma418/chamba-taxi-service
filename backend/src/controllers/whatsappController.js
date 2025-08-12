import Joi from 'joi';
import whatsappService from '../services/whatsappService.js';
import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';

// Send booking confirmation
export const sendBookingConfirmation = async (req, res) => {
  const schema = Joi.object({
    customerPhone: Joi.string().required(),
    bookingData: Joi.object({
      customerName: Joi.string().required(),
      bookingId: Joi.string().required(),
      vehicleType: Joi.string().required(),
      pickupLocation: Joi.string().required(),
      destination: Joi.string().required(),
      fare: Joi.number().required()
    }).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const result = await whatsappService.sendBookingConfirmation(
      value.customerPhone,
      value.bookingData
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('WhatsApp booking confirmation error:', error);
    res.status(500).json({ success: false, message: 'Failed to send WhatsApp confirmation' });
  }
};

// Send driver assigned notification
export const sendDriverAssigned = async (req, res) => {
  const schema = Joi.object({
    customerPhone: Joi.string().required(),
    driverData: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      vehicleNumber: Joi.string().required(),
      vehicleModel: Joi.string().required(),
      estimatedArrival: Joi.number().required()
    }).required(),
    bookingData: Joi.object({
      customerName: Joi.string().required(),
      bookingId: Joi.string().required()
    }).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const result = await whatsappService.sendDriverAssigned(
      value.customerPhone,
      value.driverData,
      value.bookingData
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('WhatsApp driver assigned error:', error);
    res.status(500).json({ success: false, message: 'Failed to send WhatsApp notification' });
  }
};

// Send ride status update
export const sendRideStatusUpdate = async (req, res) => {
  const schema = Joi.object({
    customerPhone: Joi.string().required(),
    status: Joi.string().valid('driver_arrived', 'trip_started', 'trip_completed').required(),
    bookingData: Joi.object({
      customerName: Joi.string().required(),
      bookingId: Joi.string().required(),
      fare: Joi.number().optional()
    }).required(),
    additionalInfo: Joi.object().optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const result = await whatsappService.sendRideStatusUpdate(
      value.customerPhone,
      value.status,
      value.bookingData,
      value.additionalInfo
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('WhatsApp status update error:', error);
    res.status(500).json({ success: false, message: 'Failed to send WhatsApp update' });
  }
};

// Send driver notification
export const sendDriverNotification = async (req, res) => {
  const schema = Joi.object({
    driverPhone: Joi.string().required(),
    type: Joi.string().valid('new_booking', 'booking_cancelled').required(),
    bookingData: Joi.object().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    const result = await whatsappService.sendDriverNotification(
      value.driverPhone,
      value.type,
      value.bookingData
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('WhatsApp driver notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send driver notification' });
  }
};

// Send custom message
export const sendCustomMessage = async (req, res) => {
  const schema = Joi.object({
    to: Joi.string().required(),
    message: Joi.string().required(),
    type: Joi.string().valid('text', 'location', 'contact').default('text'),
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      name: Joi.string().optional(),
      address: Joi.string().optional()
    }).optional(),
    contact: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required()
    }).optional()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  try {
    let result;

    switch (value.type) {
      case 'location':
        if (!value.location) {
          return res.status(400).json({ success: false, message: 'Location data required' });
        }
        result = await whatsappService.sendLocation(
          value.to,
          value.location.latitude,
          value.location.longitude,
          value.location.name,
          value.location.address
        );
        break;

      case 'contact':
        if (!value.contact) {
          return res.status(400).json({ success: false, message: 'Contact data required' });
        }
        result = await whatsappService.sendContact(
          value.to,
          value.contact.name,
          value.contact.phone
        );
        break;

      default:
        result = await whatsappService.sendTextMessage(value.to, value.message);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('WhatsApp custom message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send WhatsApp message' });
  }
};

// WhatsApp webhook for incoming messages
export const webhookVerify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ridewithus-webhook-token';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

// Handle incoming WhatsApp messages
export const webhookReceive = async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(async (entry) => {
        const changes = entry.changes?.[0];
        if (changes?.field === 'messages') {
          const messages = changes.value?.messages;
          
          if (messages) {
            for (const message of messages) {
              await whatsappService.handleIncomingMessage({
                from: message.from,
                text: message.text,
                type: message.type,
                timestamp: message.timestamp
              });
            }
          }
        }
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
};

// Automated notification for ride events
export const sendRideNotification = async (rideId, event, additionalData = {}) => {
  try {
    const ride = await Ride.findById(rideId).populate('customerId driverId');
    if (!ride) return { success: false, message: 'Ride not found' };

    const customer = ride.customerId;
    const driver = ride.driverId;

    if (!customer.phone) return { success: false, message: 'Customer phone not available' };

    const bookingData = {
      customerName: customer.name,
      bookingId: ride._id.toString(),
      vehicleType: ride.vehicleType,
      pickupLocation: ride.pickup.address,
      destination: ride.destination.address,
      fare: ride.fare.actual || ride.fare.estimated,
      distance: ride.distance
    };

    let result;

    switch (event) {
      case 'booking_confirmed':
        result = await whatsappService.sendBookingConfirmation(customer.phone, bookingData);
        break;

      case 'driver_assigned':
        if (driver) {
          const driverData = {
            name: driver.name,
            phone: driver.phone,
            vehicleNumber: driver.vehicleDetails?.number || 'N/A',
            vehicleModel: driver.vehicleDetails?.model || 'N/A',
            estimatedArrival: additionalData.estimatedArrival || 10
          };
          result = await whatsappService.sendDriverAssigned(customer.phone, driverData, bookingData);
        }
        break;

      case 'driver_arrived':
      case 'trip_started':
      case 'trip_completed':
        result = await whatsappService.sendRideStatusUpdate(
          customer.phone,
          event,
          bookingData,
          additionalData
        );
        break;
    }

    return result || { success: true, message: 'No notification sent' };
  } catch (error) {
    console.error('Automated ride notification error:', error);
    return { success: false, error: error.message };
  }
};

export { sendRideNotification };
