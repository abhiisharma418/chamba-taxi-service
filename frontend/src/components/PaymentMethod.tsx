import React, { useState } from 'react';
import { CreditCard, Wallet, Smartphone, Building2, QrCode, IndianRupee } from 'lucide-react';

interface PaymentMethodProps {
  amount: number;
  onPaymentSelect: (method: PaymentOption) => void;
  onPaymentComplete: (paymentData: PaymentResult) => void;
}

interface PaymentOption {
  id: string;
  name: string;
  type: 'upi' | 'cod' | 'card';
  icon: React.ReactNode;
  description: string;
  redirectUrl?: string;
}

interface PaymentResult {
  method: string;
  transactionId?: string;
  status: 'success' | 'pending' | 'failed';
  amount: number;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ 
  amount, 
  onPaymentSelect, 
  onPaymentComplete 
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentOption | null>(null);
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpiInput, setShowUpiInput] = useState(false);

  const paymentMethods: PaymentOption[] = [
    {
      id: 'cod',
      name: 'Cash on Delivery',
      type: 'cod',
      icon: <IndianRupee className="w-6 h-6" />,
      description: 'Pay cash when your ride arrives'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      type: 'upi',
      icon: <Smartphone className="w-6 h-6 text-purple-600" />,
      description: 'Pay using PhonePe app',
      redirectUrl: 'phonepe://pay'
    },
    {
      id: 'googlepay',
      name: 'Google Pay',
      type: 'upi',
      icon: <Wallet className="w-6 h-6 text-blue-600" />,
      description: 'Pay using Google Pay',
      redirectUrl: 'tez://upi/pay'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      type: 'upi',
      icon: <CreditCard className="w-6 h-6 text-blue-500" />,
      description: 'Pay using Paytm wallet',
      redirectUrl: 'paytmmp://pay'
    },
    {
      id: 'upi',
      name: 'UPI ID',
      type: 'upi',
      icon: <QrCode className="w-6 h-6 text-green-600" />,
      description: 'Enter your UPI ID'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      type: 'card',
      icon: <Building2 className="w-6 h-6 text-orange-600" />,
      description: 'Pay using card via Razorpay'
    }
  ];

  const handleMethodSelect = (method: PaymentOption) => {
    setSelectedMethod(method);
    onPaymentSelect(method);
    
    if (method.id === 'upi') {
      setShowUpiInput(true);
    } else {
      setShowUpiInput(false);
    }
  };

  const generateUpiUrl = (method: PaymentOption, upiId?: string) => {
    const merchantUPI = 'ridewithus@ybl'; // Your business UPI ID
    const merchantName = 'RideWithUs';
    const transactionNote = `Ride booking payment - ${Date.now()}`;
    
    if (method.id === 'upi' && upiId) {
      return `upi://pay?pa=${merchantUPI}&pn=${merchantName}&am=${amount}&tn=${transactionNote}&cu=INR`;
    }
    
    // Generate specific app URLs
    switch (method.id) {
      case 'phonepe':
        return `phonepe://pay?pa=${merchantUPI}&pn=${merchantName}&am=${amount}&tn=${transactionNote}&cu=INR`;
      case 'googlepay':
        return `tez://upi/pay?pa=${merchantUPI}&pn=${merchantName}&am=${amount}&tn=${transactionNote}&cu=INR`;
      case 'paytm':
        return `paytmmp://pay?pa=${merchantUPI}&pn=${merchantName}&am=${amount}&tn=${transactionNote}&cu=INR`;
      default:
        return `upi://pay?pa=${merchantUPI}&pn=${merchantName}&am=${amount}&tn=${transactionNote}&cu=INR`;
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;
    
    setIsProcessing(true);
    
    try {
      if (selectedMethod.type === 'cod') {
        // Handle COD payment
        onPaymentComplete({
          method: 'cod',
          status: 'pending',
          amount,
          transactionId: `COD_${Date.now()}`
        });
      } else if (selectedMethod.type === 'upi') {
        // Handle UPI payment
        const upiUrl = generateUpiUrl(selectedMethod, upiId);
        
        // Try to open UPI app
        const isAppOpened = await tryOpenUpiApp(upiUrl);
        
        if (isAppOpened) {
          // Simulate payment processing (in real app, this would be handled by backend)
          setTimeout(() => {
            onPaymentComplete({
              method: selectedMethod.id,
              status: 'success',
              amount,
              transactionId: `UPI_${Date.now()}`
            });
          }, 3000);
        } else {
          // Fallback: show QR code or manual UPI option
          showQRCodeFallback(upiUrl);
        }
      } else if (selectedMethod.type === 'card') {
        // Handle card payment via Razorpay
        await initiateRazorpayPayment();
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentComplete({
        method: selectedMethod.id,
        status: 'failed',
        amount
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tryOpenUpiApp = (upiUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Try to open the app
      window.location.href = upiUrl;
      
      // Check if app opened (user left the page)
      const checkAppOpened = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed > 2000) {
          resolve(true); // Assume app opened if user was away for more than 2 seconds
        } else {
          resolve(false); // App likely not installed
        }
      };
      
      setTimeout(checkAppOpened, 2500);
    });
  };

  const showQRCodeFallback = (upiUrl: string) => {
    // In a real implementation, you would generate and show a QR code
    alert(`UPI app not found. Please scan QR code or use manual payment.\nUPI URL: ${upiUrl}`);
  };

  const initiateRazorpayPayment = async () => {
    // This would integrate with Razorpay
    // For now, simulate success
    setTimeout(() => {
      onPaymentComplete({
        method: 'card',
        status: 'success',
        amount,
        transactionId: `CARD_${Date.now()}`
      });
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Choose Payment Method</h3>
        <div className="text-2xl font-bold text-blue-600">₹{amount}</div>
      </div>

      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => handleMethodSelect(method)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedMethod?.id === method.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {method.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-800">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                selectedMethod?.id === method.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedMethod?.id === method.id && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUpiInput && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <label htmlFor="upi-id" className="block text-sm font-medium text-gray-700 mb-2">
            Enter UPI ID
          </label>
          <input
            type="text"
            id="upi-id"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@paytm, yourname@ybl, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {selectedMethod && (
        <div className="mt-6">
          <button
            onClick={handlePayment}
            disabled={isProcessing || (selectedMethod.id === 'upi' && !upiId.trim())}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
              isProcessing || (selectedMethod.id === 'upi' && !upiId.trim())
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Pay ₹${amount} via ${selectedMethod.name}`
            )}
          </button>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          🔒 Your payment is secured with end-to-end encryption
        </p>
      </div>
    </div>
  );
};

export default PaymentMethod;
