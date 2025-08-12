# WhatsApp Business Message Templates for RideWithUs

This document contains the message templates that need to be created in WhatsApp Business Manager for the RideWithUs application.

## Required Templates

### 1. Booking Confirmation Template
**Template Name:** `booking_confirmation`
**Category:** Transactional
**Language:** English (en)

```
🚗 *RideWithUs Booking Confirmed*

Hi {{1}}! Your ride has been booked successfully.

📋 *Booking Details:*
• Booking ID: {{2}}
• Vehicle Type: {{3}}
• From: {{4}}
• To: {{5}}
• Fare: {{6}}

We're finding the best driver for you! You'll be notified once a driver is assigned.

Thank you for choosing RideWithUs! 🙏
```

### 2. Driver Assigned Template
**Template Name:** `driver_assigned`
**Category:** Transactional
**Language:** English (en)

```
🚗 *Driver Assigned - RideWithUs*

Great news {{1}}! Your driver is on the way.

👤 *Driver Details:*
• Name: {{2}}
• Phone: {{3}}
• Vehicle: {{4}} ({{5}})
• ETA: {{6}}

Your driver will contact you shortly. Have a safe journey! 🛣️
```

### 3. Driver Arrived Template
**Template Name:** `driver_arrived`
**Category:** Transactional
**Language:** English (en)

```
🚗 *Driver Arrived - RideWithUs*

Hi {{1}}! Your driver has arrived at {{3}}.

Please proceed to your pickup location. Your driver is waiting for you.

Booking ID: {{2}}

Have a safe trip! 🛣️
```

### 4. Trip Started Template
**Template Name:** `trip_started`
**Category:** Transactional
**Language:** English (en)

```
🚗 *Trip Started - RideWithUs*

Hi {{1}}! Your trip has begun.

Booking ID: {{2}}
Estimated arrival: {{3}}

Enjoy your ride! You can track your trip in real-time through the app. 📍
```

### 5. Trip Completed Template
**Template Name:** `trip_completed`
**Category:** Transactional
**Language:** English (en)

```
🎉 *Trip Completed - RideWithUs*

Hi {{1}}! You've reached your destination safely.

📋 *Trip Summary:*
• Booking ID: {{2}}
• Total Fare: {{3}}
• Payment Method: {{4}}

Thank you for riding with us! Please rate your experience in the app. ⭐
```

### 6. New Booking (Driver) Template
**Template Name:** `new_booking_driver`
**Category:** Transactional
**Language:** English (en)

```
🚗 *New Booking Alert - RideWithUs*

New ride request available!

👤 *Customer:* {{1}}
📍 *Pickup:* {{2}}
📍 *Drop:* {{3}}
💰 *Fare:* {{4}}
📏 *Distance:* {{5}}

Accept this ride in the RideWithUs Driver app.
```

### 7. Booking Cancelled (Driver) Template
**Template Name:** `booking_cancelled_driver`
**Category:** Transactional
**Language:** English (en)

```
❌ *Booking Cancelled - RideWithUs*

The ride (ID: {{1}}) has been cancelled.

Reason: {{2}}

You're now available for new bookings. Thank you for your patience.
```

## Setup Instructions

### 1. WhatsApp Business API Setup
1. Create a WhatsApp Business Account
2. Set up WhatsApp Business API (Cloud API recommended)
3. Get your Phone Number ID and Access Token
4. Set up webhook URL for receiving messages

### 2. Template Creation
1. Go to WhatsApp Business Manager
2. Navigate to Message Templates
3. Create each template with the exact names and content above
4. Submit for approval (approval usually takes 24-48 hours)

### 3. Environment Variables
Add these to your `.env` file:

```env
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=ridewithus-webhook-token
WHATSAPP_BUSINESS_NUMBER=+911234567890
MERCHANT_UPI_ID=ridewithus@ybl
```

### 4. Webhook Configuration
Set your webhook URL to:
```
https://your-domain.com/api/whatsapp/webhook
```

Verify token: `ridewithus-webhook-token`

### 5. Testing
Use the test numbers provided by WhatsApp to test your templates before going live.

## Template Guidelines

### Best Practices
- Keep messages concise and informative
- Use clear formatting with emojis for better readability
- Include all necessary information for each notification type
- Ensure templates comply with WhatsApp Business Policy

### Variable Guidelines
- Use {{1}}, {{2}}, etc. for dynamic content
- Ensure all variables are properly mapped in the code
- Test with different content lengths to ensure formatting works

### Compliance
- All templates must be approved by WhatsApp
- Templates should provide value to users
- Avoid promotional content in transactional templates
- Follow WhatsApp's messaging guidelines

## Template Status
- [ ] booking_confirmation - Pending approval
- [ ] driver_assigned - Pending approval  
- [ ] driver_arrived - Pending approval
- [ ] trip_started - Pending approval
- [ ] trip_completed - Pending approval
- [ ] new_booking_driver - Pending approval
- [ ] booking_cancelled_driver - Pending approval

## Support
For WhatsApp Business API support, contact Meta Business Support or refer to their documentation at https://developers.facebook.com/docs/whatsapp
