import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, DollarSign, Check, X, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { PaymentAPI } from '../lib/api';

interface PaymentMethodProps {
  amount: number;
  onPaymentSelect: (method: any) => void;
  onPaymentComplete: (paymentData: any) => void;
}

type PaymentType = 'cod' | 'upi' | 'razorpay' | 'wallet' | 'stripe';

const PaymentMethod: React.FC<PaymentMethodProps> = ({
  amount,
  onPaymentSelect,
  onPaymentComplete
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentType>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [upiId, setUpiId] = useState('');
  const [showUpiQR, setShowUpiQR] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    // Load wallet balance
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    try {
      // This would call actual wallet API
      setWalletBalance(1500); // Mock balance
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
  };

  const paymentMethods = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: DollarSign,
      description: 'Pay to driver after ride completion',
      available: true,
      fees: 0
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: Smartphone,
      description: 'Google Pay, PhonePe, Paytm & more',
      available: true,
      fees: 0
    },
    {
      id: 'wallet',
      name: 'RideWithUs Wallet',
      icon: Wallet,
      description: `Balance: ₹${walletBalance}`,
      available: walletBalance >= amount,
      fees: 0
    },
    {
      id: 'razorpay',
      name: 'Cards & NetBanking',
      icon: CreditCard,
      description: 'Credit/Debit cards, Net banking, Wallets',
      available: true,
      fees: Math.round(amount * 0.02) // 2% fees
    },
    {
      id: 'stripe',
      name: 'International Cards',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express',
      available: true,
      fees: Math.round(amount * 0.029) // 2.9% fees
    }
  ];

  const handleMethodSelect = (method: PaymentType) => {
    setSelectedMethod(method);
    setError(null);
    onPaymentSelect({ method, fees: getFees(method) });
  };

  const getFees = (method: PaymentType) => {
    const methodData = paymentMethods.find(m => m.id === method);
    return methodData?.fees || 0;
  };

  const getTotalAmount = () => {
    return amount + getFees(selectedMethod);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      switch (selectedMethod) {
        case 'cod':
          await handleCODPayment();
          break;
        case 'upi':
          await handleUPIPayment();
          break;
        case 'wallet':
          await handleWalletPayment();
          break;
        case 'razorpay':
          await handleRazorpayPayment();
          break;
        case 'stripe':
          await handleStripePayment();
          break;
        default:
          throw new Error('Invalid payment method');
      }
    } catch (error: any) {
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCODPayment = async () => {
    // Simulate COD confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onPaymentComplete({
      method: 'cod',
      status: 'pending',
      amount: getTotalAmount(),
      transactionId: `COD_${Date.now()}`,
      message: 'Pay to driver upon delivery'
    });
  };

  const handleUPIPayment = async () => {
    if (!upiId.trim()) {
      throw new Error('Please enter your UPI ID');
    }

    // Create UPI payment intent
    const paymentIntent = await PaymentAPI.createIntent({
      provider: 'upi',
      amount: getTotalAmount(),
      currency: 'INR',
      paymentMethod: 'upi',
      upiId: upiId
    });

    if (paymentIntent.success) {
      // Generate UPI deep link
      const upiLink = `upi://pay?pa=${paymentIntent.data.merchantUPI}&pn=RideWithUs&am=${getTotalAmount()}&cu=INR&tn=RidePayment_${paymentIntent.data.paymentId}`;
      
      // Open UPI app
      window.open(upiLink, '_self');
      
      // Show QR code as fallback
      setShowUpiQR(true);
      
      // Simulate payment verification (in real app, this would be webhook-based)
      setTimeout(async () => {
        try {
          const verification = await PaymentAPI.verifyUpi({
            paymentId: paymentIntent.data.paymentId,
            status: 'success'
          });

          if (verification.success) {
            onPaymentComplete({
              method: 'upi',
              status: 'completed',
              amount: getTotalAmount(),
              transactionId: paymentIntent.data.paymentId,
              upiId: upiId
            });
          }
        } catch (error) {
          throw new Error('UPI payment verification failed');
        }
      }, 5000);
    } else {
      throw new Error('UPI payment initialization failed');
    }
  };

  const handleWalletPayment = async () => {
    if (walletBalance < getTotalAmount()) {
      throw new Error('Insufficient wallet balance');
    }

    // Simulate wallet deduction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onPaymentComplete({
      method: 'wallet',
      status: 'completed',
      amount: getTotalAmount(),
      transactionId: `WALLET_${Date.now()}`,
      balanceAfter: walletBalance - getTotalAmount()
    });
  };

  const handleRazorpayPayment = async () => {
    // Create Razorpay payment intent
    const paymentIntent = await PaymentAPI.createIntent({
      provider: 'razorpay',
      amount: getTotalAmount(),
      currency: 'INR'
    });

    if (paymentIntent.success && window.Razorpay) {
      const options = {
        key: paymentIntent.data.keyId,
        amount: getTotalAmount() * 100, // Convert to paise
        currency: 'INR',
        name: 'RideWithUs',
        description: 'Ride Payment',
        order_id: paymentIntent.data.orderId,
        handler: async (response: any) => {
          try {
            const verification = await PaymentAPI.authorize({
              provider: 'razorpay',
              providerRef: response.razorpay_payment_id
            });

            if (verification.success) {
              onPaymentComplete({
                method: 'razorpay',
                status: 'completed',
                amount: getTotalAmount(),
                transactionId: response.razorpay_payment_id
              });
            }
          } catch (error) {
            throw new Error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      throw new Error('Razorpay not loaded');
    }
  };

  const handleStripePayment = async () => {
    // Create Stripe payment intent
    const paymentIntent = await PaymentAPI.createIntent({
      provider: 'stripe',
      amount: getTotalAmount(),
      currency: 'INR'
    });

    if (paymentIntent.success) {
      // In real implementation, you'd use Stripe Elements
      // For now, simulate card payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onPaymentComplete({
        method: 'stripe',
        status: 'completed',
        amount: getTotalAmount(),
        transactionId: paymentIntent.data.paymentIntentId
      });
    } else {
      throw new Error('Stripe payment initialization failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Choose Payment Method</h3>
        
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          const isSelected = selectedMethod === method.id;
          const totalWithFees = amount + method.fees;
          
          return (
            <div
              key={method.id}
              onClick={() => method.available && handleMethodSelect(method.id as PaymentType)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : method.available
                  ? 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{method.name}</div>
                    <div className="text-sm text-slate-600">{method.description}</div>
                    {method.fees > 0 && (
                      <div className="text-xs text-amber-600 mt-1">
                        + ₹{method.fees} processing fee
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-slate-900">
                    ₹{totalWithFees}
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-600 ml-auto mt-1" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Details Form */}
      {selectedMethod === 'upi' && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-slate-900 mb-3">UPI Payment Details</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@paytm / yourname@gpay"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-slate-600">
              <p>• Payment link will open in your UPI app</p>
              <p>• Complete payment within 5 minutes</p>
            </div>
          </div>
        </div>
      )}

      {selectedMethod === 'razorpay' && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h4 className="font-medium text-slate-900 mb-3">Card Payment</h4>
          <div className="text-sm text-slate-600">
            <p>• Secure payment gateway by Razorpay</p>
            <p>• Supports all major cards and net banking</p>
            <p>• Your card details are encrypted and secure</p>
          </div>
        </div>
      )}

      {selectedMethod === 'stripe' && (
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h4 className="font-medium text-slate-900 mb-3">International Card Payment</h4>
          <div className="text-sm text-slate-600">
            <p>• Secure international payment processing</p>
            <p>• Supports Visa, Mastercard, Amex</p>
            <p>• Currency conversion handled automatically</p>
          </div>
        </div>
      )}

      {selectedMethod === 'wallet' && walletBalance < amount && (
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-medium">Insufficient Balance</span>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            Your wallet balance (₹{walletBalance}) is less than the required amount (₹{amount}).
            Please add money to your wallet or choose another payment method.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <X className="h-5 w-5 text-red-500" />
            <span className="text-red-800 font-medium">Payment Failed</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Amount Summary */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Ride Fare</span>
            <span className="text-slate-900">₹{amount}</span>
          </div>
          {getFees(selectedMethod) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Processing Fee</span>
              <span className="text-slate-900">₹{getFees(selectedMethod)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg border-t border-slate-300 pt-2">
            <span className="text-slate-900">Total Amount</span>
            <span className="text-slate-900">₹{getTotalAmount()}</span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || !paymentMethods.find(m => m.id === selectedMethod)?.available}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Pay ₹{getTotalAmount()}</span>
          </>
        )}
      </button>

      {/* QR Code Modal for UPI */}
      {showUpiQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-slate-600 text-sm mb-4">
                Scan this QR code with any UPI app to complete payment
              </p>
              <div className="bg-slate-100 p-4 rounded-lg mb-4">
                <div className="text-xs text-slate-500">QR Code would be displayed here</div>
              </div>
              <button
                onClick={() => setShowUpiQR(false)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethod;
