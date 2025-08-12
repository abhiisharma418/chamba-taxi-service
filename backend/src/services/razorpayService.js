import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
});

export async function createRazorpayOrder(amount, currency = 'INR') {
  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency: currency,
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error('Failed to create Razorpay order');
  }
}

export async function verifyRazorpayPayment(paymentId, signature, orderId) {
  try {
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret')
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === signature;

    if (isSignatureValid) {
      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(paymentId);
      
      return {
        isValid: true,
        data: {
          paymentId: payment.id,
          amount: payment.amount / 100, // Convert from paise
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          bank: payment.bank,
          wallet: payment.wallet,
          vpa: payment.vpa,
          email: payment.email,
          contact: payment.contact,
          fee: payment.fee / 100,
          tax: payment.tax / 100,
          createdAt: new Date(payment.created_at * 1000)
        }
      };
    } else {
      return {
        isValid: false,
        error: 'Invalid payment signature'
      };
    }
  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    return {
      isValid: false,
      error: 'Payment verification failed'
    };
  }
}

export async function captureRazorpayPayment(paymentId, amount) {
  try {
    const payment = await razorpay.payments.capture(paymentId, amount * 100);
    return {
      success: true,
      data: {
        paymentId: payment.id,
        amount: payment.amount / 100,
        status: payment.status,
        capturedAt: new Date(payment.captured_at * 1000)
      }
    };
  } catch (error) {
    console.error('Razorpay payment capture error:', error);
    return {
      success: false,
      error: 'Payment capture failed'
    };
  }
}

export async function processRazorpayRefund(paymentId, amount) {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Convert to paise
      speed: 'optimum'
    });

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      estimatedSettlement: refund.speed_processed
    };
  } catch (error) {
    console.error('Razorpay refund error:', error);
    return {
      success: false,
      error: 'Refund processing failed'
    };
  }
}

export async function getRazorpayPaymentDetails(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        description: payment.description,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        email: payment.email,
        contact: payment.contact,
        fee: payment.fee / 100,
        tax: payment.tax / 100,
        error_code: payment.error_code,
        error_description: payment.error_description,
        createdAt: new Date(payment.created_at * 1000)
      }
    };
  } catch (error) {
    console.error('Error fetching Razorpay payment details:', error);
    return {
      success: false,
      error: 'Failed to fetch payment details'
    };
  }
}

export async function createRazorpayContact(customerData) {
  try {
    const contact = await razorpay.contacts.create({
      name: customerData.name,
      email: customerData.email,
      contact: customerData.phone,
      type: 'customer',
      reference_id: customerData.userId
    });

    return {
      success: true,
      contactId: contact.id
    };
  } catch (error) {
    console.error('Razorpay contact creation error:', error);
    return {
      success: false,
      error: 'Failed to create contact'
    };
  }
}

export async function createRazorpayFundAccount(contactId, accountDetails) {
  try {
    const fundAccount = await razorpay.fundAccount.create({
      contact_id: contactId,
      account_type: accountDetails.type, // 'bank_account' or 'vpa'
      [accountDetails.type]: accountDetails.details
    });

    return {
      success: true,
      fundAccountId: fundAccount.id
    };
  } catch (error) {
    console.error('Razorpay fund account creation error:', error);
    return {
      success: false,
      error: 'Failed to create fund account'
    };
  }
}

export async function createRazorpayPayout(fundAccountId, amount, purpose = 'payout') {
  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      mode: 'IMPS',
      purpose: purpose,
      queue_if_low_balance: true,
      reference_id: `payout_${Date.now()}`
    });

    return {
      success: true,
      payoutId: payout.id,
      amount: payout.amount / 100,
      status: payout.status,
      utr: payout.utr
    };
  } catch (error) {
    console.error('Razorpay payout error:', error);
    return {
      success: false,
      error: 'Payout processing failed'
    };
  }
}

// Webhook signature verification
export function verifyRazorpayWebhook(body, signature) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret')
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

// Get settlement details
export async function getRazorpaySettlements(from, to) {
  try {
    const settlements = await razorpay.settlements.all({
      from: from,
      to: to
    });

    return {
      success: true,
      data: settlements.items.map(settlement => ({
        id: settlement.id,
        amount: settlement.amount / 100,
        fees: settlement.fees / 100,
        tax: settlement.tax / 100,
        status: settlement.status,
        createdAt: new Date(settlement.created_at * 1000),
        settledAt: settlement.settled_at ? new Date(settlement.settled_at * 1000) : null
      }))
    };
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return {
      success: false,
      error: 'Failed to fetch settlements'
    };
  }
}
