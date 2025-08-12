import React, { useState } from 'react';
import { IndianRupee, Check, X, CreditCard, AlertCircle } from 'lucide-react';
import { PaymentAPI } from '../lib/api';

interface CodPaymentConfirmationProps {
  rideId: string;
  paymentId: string;
  amount: number;
  customerName: string;
  driverId: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const CodPaymentConfirmation: React.FC<CodPaymentConfirmationProps> = ({
  rideId,
  paymentId,
  amount,
  customerName,
  driverId,
  onConfirm,
  onCancel
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    setError(null);

    try {
      const response = await PaymentAPI.confirmCod({
        paymentId,
        driverId,
        amount: amount * 100 // Convert to paise
      });

      if (response.success) {
        onConfirm();
      } else {
        setError('Failed to confirm payment. Please try again.');
      }
    } catch (error) {
      console.error('COD confirmation error:', error);
      setError('Payment confirmation failed. Please contact support.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-orange-100 p-3 rounded-full">
          <IndianRupee className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cash Payment Confirmation</h3>
          <p className="text-sm text-gray-600">Confirm cash payment received from customer</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Customer</span>
            <p className="font-medium text-gray-900">{customerName}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Ride ID</span>
            <p className="font-medium text-gray-900">{rideId.slice(-8)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Payment Method</span>
            <p className="font-medium text-gray-900">Cash on Delivery</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Amount</span>
            <p className="text-xl font-bold text-green-600">₹{amount}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">Payment Instructions</p>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Collect ₹{amount} in cash from the customer</li>
              <li>• Ensure the amount is correct before confirming</li>
              <li>• Click "Confirm Payment" only after receiving cash</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleConfirmPayment}
          disabled={isConfirming}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isConfirming
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isConfirming ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              <span>Confirm Payment Received</span>
            </>
          )}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          🔒 This confirmation will complete the ride and mark payment as received
        </p>
      </div>
    </div>
  );
};

export default CodPaymentConfirmation;
