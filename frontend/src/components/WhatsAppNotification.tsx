import React, { useState } from 'react';
import { MessageCircle, Phone, Check, X, Info } from 'lucide-react';

interface WhatsAppNotificationProps {
  isEnabled: boolean;
  phoneNumber: string;
  onToggle: (enabled: boolean) => void;
  onPhoneUpdate: (phone: string) => void;
}

const WhatsAppNotification: React.FC<WhatsAppNotificationProps> = ({
  isEnabled,
  phoneNumber,
  onToggle,
  onPhoneUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempPhone, setTempPhone] = useState(phoneNumber);

  const handlePhoneEdit = () => {
    setIsEditing(true);
    setTempPhone(phoneNumber);
  };

  const handlePhoneSave = () => {
    if (tempPhone.trim() && tempPhone.length >= 10) {
      onPhoneUpdate(tempPhone.trim());
      setIsEditing(false);
    }
  };

  const handlePhoneCancel = () => {
    setTempPhone(phoneNumber);
    setIsEditing(false);
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add +91 if not present and length is 10
    if (cleaned.length === 10 && !cleaned.startsWith('91')) {
      return `+91 ${cleaned}`;
    }
    
    // If already has country code
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    }
    
    return phone;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempPhone(value);
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="bg-green-500 p-3 rounded-xl">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900">WhatsApp Updates</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => onToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
          
          <p className="text-slate-600 text-sm mb-4">
            Get real-time updates about your booking, driver details, and trip progress directly on WhatsApp.
          </p>
          
          {isEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  WhatsApp Number
                </label>
                
                {!isEditing ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 border border-green-200">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="text-slate-900 font-medium">
                        {phoneNumber ? formatPhoneNumber(phoneNumber) : 'No number set'}
                      </span>
                    </div>
                    <button
                      onClick={handlePhoneEdit}
                      className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={tempPhone}
                        onChange={handlePhoneChange}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      />
                    </div>
                    <button
                      onClick={handlePhoneSave}
                      disabled={!tempPhone.trim() || tempPhone.replace(/\D/g, '').length < 10}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white p-2 rounded-lg transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handlePhoneCancel}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-2 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">You'll receive updates about:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Booking confirmation with trip details</li>
                      <li>• Driver assignment with contact info</li>
                      <li>• Driver arrival and trip status updates</li>
                      <li>• Trip completion and payment receipt</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {!phoneNumber && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <p className="text-amber-800 text-sm font-medium">
                      Please add your WhatsApp number to receive updates
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!isEnabled && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-slate-500 text-sm">
                Enable WhatsApp notifications to stay informed about your ride progress and receive important updates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppNotification;
