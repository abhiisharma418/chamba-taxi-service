import React, { useState, useEffect } from 'react';
import { X, Gift, Tag, Clock, Copy, Search } from 'lucide-react';
import { promoCodeService, PromoCode } from '../services/promoCodeService';

interface PromoCodeInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  orderAmount?: number;
  vehicleType?: string;
  city?: string;
  onPromoSelected?: (promo: PromoCode) => void;
  selectedPromo?: PromoCode | null;
}

const PromoCodeInterface: React.FC<PromoCodeInterfaceProps> = ({
  isOpen,
  onClose,
  orderAmount,
  vehicleType,
  city,
  onPromoSelected,
  selectedPromo
}) => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [userType, setUserType] = useState<string>('');
  const [isFirstRide, setIsFirstRide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailablePromoCodes();
    }
  }, [isOpen, orderAmount, vehicleType, city]);

  const loadAvailablePromoCodes = async () => {
    setIsLoading(true);
    try {
      const response = await promoCodeService.getAvailablePromoCodes({
        orderAmount,
        vehicleType,
        city
      });

      if (response.success && response.data) {
        setPromoCodes(response.data.promoCodes);
        setUserType(response.data.userType);
        setIsFirstRide(response.data.isFirstRide);
      }
    } catch (error) {
      console.error('Error loading promo codes:', error);
    }
    setIsLoading(false);
  };

  const handleValidatePromoCode = async () => {
    if (!promoCodeInput.trim() || !orderAmount) return;

    setValidatingPromo(true);
    try {
      const response = await promoCodeService.validatePromoCode({
        code: promoCodeInput.trim(),
        orderAmount,
        vehicleType,
        city
      });

      if (response.success && response.data) {
        const promoWithDiscount: PromoCode = {
          ...response.data.promoCode,
          discount: response.data.discount
        };
        
        if (onPromoSelected) {
          onPromoSelected(promoWithDiscount);
        }
        setPromoCodeInput('');
        onClose();
      } else {
        alert(response.message || 'Invalid promo code');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      alert('Failed to validate promo code');
    }
    setValidatingPromo(false);
  };

  const handleSelectPromo = (promo: PromoCode) => {
    if (onPromoSelected) {
      onPromoSelected(promo);
    }
    onClose();
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const formatDiscount = (promo: PromoCode): string => {
    return promoCodeService.formatDiscount(promo);
  };

  const getDiscountColor = (type: string): string => {
    return promoCodeService.getPromoCodeColor(type);
  };

  const formatExpiryDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-t-3xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Promo Codes</h2>
              <p className="text-sm text-gray-500">Choose a discount for your ride</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Manual Promo Code Entry */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                maxLength={20}
              />
            </div>
            <button
              onClick={handleValidatePromoCode}
              disabled={!promoCodeInput.trim() || validatingPromo}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {validatingPromo ? 'Checking...' : 'Apply'}
            </button>
          </div>
        </div>

        {/* Current Selection */}
        {selectedPromo && (
          <div className="p-6 bg-green-50 border-b border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Applied Promo Code</p>
                <p className="text-lg font-bold text-green-900">{selectedPromo.code}</p>
                <p className="text-sm text-green-700">{formatDiscount(selectedPromo)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">You save</p>
                <p className="text-xl font-bold text-green-800">
                  ₹{selectedPromo.discount?.savings || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Available Promo Codes */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No promo codes available</h3>
              <p className="text-gray-500">Check back later for new offers and discounts</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-blue-800">
                  <Tag className="h-4 w-4" />
                  <span>
                    {isFirstRide ? 'First-time rider' : 'Valued customer'} • 
                    {promoCodes.length} offer{promoCodes.length !== 1 ? 's' : ''} available
                  </span>
                </div>
              </div>

              {/* Promo Code List */}
              {promoCodes.map((promo) => {
                const isSelected = selectedPromo?.id === promo.id;
                const isExpiringSoon = promoCodeService.isPromoCodeExpiringSoon(promo.validUntil);
                
                return (
                  <div
                    key={promo.id}
                    onClick={() => handleSelectPromo(promo)}
                    className={`relative bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-orange-300 hover:shadow-md'
                    }`}
                  >
                    {/* Promo Code Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`px-3 py-1 bg-gradient-to-r ${getDiscountColor(promo.type)} text-white rounded-full text-sm font-bold`}>
                        {formatDiscount(promo)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPromoCode(promo.code);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Promo Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-gray-900">{promo.code}</span>
                        {promo.discount && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">You save</p>
                            <p className="font-bold text-green-600">₹{promo.discount.savings}</p>
                          </div>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-gray-900">{promo.name}</h4>
                      
                      {promo.description && (
                        <p className="text-sm text-gray-600">{promo.description}</p>
                      )}

                      {/* Constraints */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {promo.minOrderAmount > 0 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            Min ₹{promo.minOrderAmount}
                          </span>
                        )}
                        {promo.isFirstRideOnly && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                            First ride only
                          </span>
                        )}
                        {isExpiringSoon && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full">
                            Expiring soon
                          </span>
                        )}
                      </div>

                      {/* Expiry */}
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Valid until {formatExpiryDate(promo.validUntil)}</span>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/50">
          <p className="text-xs text-gray-500 text-center">
            Promo codes are subject to terms and conditions. Only one promo code can be used per ride.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromoCodeInterface;
