import axios from 'axios';

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.businessPhoneNumber = process.env.WHATSAPP_BUSINESS_NUMBER || '+911234567890';
  }

  async sendMessage(to, messageData) {
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('WhatsApp not configured - skipping message send');
      return { success: false, message: 'WhatsApp not configured' };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          ...messageData
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('WhatsApp send error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  formatPhoneNumber(phone) {
    // Remove all non-digits and add country code if missing
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91')) return cleaned;
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return `91${cleaned}`;
  }

  // Booking confirmation message
  async sendBookingConfirmation(customerPhone, bookingData) {
    const message = {
      type: 'template',
      template: {
        name: 'booking_confirmation',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: bookingData.customerName },
              { type: 'text', text: bookingData.bookingId },
              { type: 'text', text: bookingData.vehicleType },
              { type: 'text', text: bookingData.pickupLocation },
              { type: 'text', text: bookingData.destination },
              { type: 'text', text: `₹${bookingData.fare}` }
            ]
          }
        ]
      }
    };

    return this.sendMessage(customerPhone, message);
  }

  // Driver assigned notification
  async sendDriverAssigned(customerPhone, driverData, bookingData) {
    const message = {
      type: 'template',
      template: {
        name: 'driver_assigned',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: bookingData.customerName },
              { type: 'text', text: driverData.name },
              { type: 'text', text: driverData.phone },
              { type: 'text', text: driverData.vehicleNumber },
              { type: 'text', text: driverData.vehicleModel },
              { type: 'text', text: `${driverData.estimatedArrival} minutes` }
            ]
          }
        ]
      }
    };

    return this.sendMessage(customerPhone, message);
  }

  // Ride status updates
  async sendRideStatusUpdate(customerPhone, status, bookingData, additionalInfo = {}) {
    let templateName = 'ride_status_update';
    let parameters = [
      { type: 'text', text: bookingData.customerName },
      { type: 'text', text: bookingData.bookingId }
    ];

    switch (status) {
      case 'driver_arrived':
        templateName = 'driver_arrived';
        parameters.push({ type: 'text', text: additionalInfo.location || 'pickup location' });
        break;
      case 'trip_started':
        templateName = 'trip_started';
        parameters.push({ type: 'text', text: additionalInfo.estimatedTime || '15 minutes' });
        break;
      case 'trip_completed':
        templateName = 'trip_completed';
        parameters.push(
          { type: 'text', text: `₹${bookingData.fare}` },
          { type: 'text', text: additionalInfo.paymentMethod || 'Cash' }
        );
        break;
    }

    const message = {
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [{ type: 'body', parameters }]
      }
    };

    return this.sendMessage(customerPhone, message);
  }

  // Driver notifications
  async sendDriverNotification(driverPhone, type, bookingData) {
    let message;

    switch (type) {
      case 'new_booking':
        message = {
          type: 'template',
          template: {
            name: 'new_booking_driver',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: bookingData.customerName },
                  { type: 'text', text: bookingData.pickupLocation },
                  { type: 'text', text: bookingData.destination },
                  { type: 'text', text: `₹${bookingData.fare}` },
                  { type: 'text', text: `${bookingData.distance} km` }
                ]
              }
            ]
          }
        };
        break;

      case 'booking_cancelled':
        message = {
          type: 'template',
          template: {
            name: 'booking_cancelled_driver',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: bookingData.bookingId },
                  { type: 'text', text: bookingData.reason || 'Customer request' }
                ]
              }
            ]
          }
        };
        break;
    }

    return this.sendMessage(driverPhone, message);
  }

  // Simple text message (fallback)
  async sendTextMessage(to, text) {
    const message = {
      type: 'text',
      text: { body: text }
    };

    return this.sendMessage(to, message);
  }

  // Send location
  async sendLocation(to, latitude, longitude, name = '', address = '') {
    const message = {
      type: 'location',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name,
        address
      }
    };

    return this.sendMessage(to, message);
  }

  // Send contact
  async sendContact(to, name, phone) {
    const message = {
      type: 'contacts',
      contacts: [
        {
          name: { formatted_name: name },
          phones: [{ phone: this.formatPhoneNumber(phone), type: 'CELL' }]
        }
      ]
    };

    return this.sendMessage(to, message);
  }

  // Handle incoming messages (webhook)
  async handleIncomingMessage(messageData) {
    const { from, text, type } = messageData;
    
    // Basic auto-responses
    if (type === 'text') {
      const messageText = text.body.toLowerCase();
      
      if (messageText.includes('status') || messageText.includes('booking')) {
        return this.sendTextMessage(from, 
          'To check your booking status, please log into the RideWithUs app or call our support at +91-1234567890');
      }
      
      if (messageText.includes('cancel')) {
        return this.sendTextMessage(from, 
          'To cancel your booking, please use the RideWithUs app or contact support. Cancellation charges may apply.');
      }
      
      if (messageText.includes('help') || messageText.includes('support')) {
        return this.sendTextMessage(from, 
          '🚗 *RideWithUs Support*\n\n📱 App Support: Use in-app help\n📞 Call: +91-1234567890\n📧 Email: support@ridewithus.com\n\nAvailable 24/7 for assistance!');
      }

      // Default response
      return this.sendTextMessage(from, 
        'Thank you for contacting RideWithUs! 🚗\n\nFor booking support, please use our app or call +91-1234567890.\n\nOur team is available 24/7 to assist you!');
    }

    return { success: true, message: 'Message processed' };
  }
}

export default new WhatsAppService();
