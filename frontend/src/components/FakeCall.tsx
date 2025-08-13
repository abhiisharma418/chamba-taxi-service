import React, { useState, useEffect, useRef } from 'react';
import { emergencyService } from '../services/emergencyService';

interface FakeCallProps {
  onCallEnd?: () => void;
  className?: string;
}

const FakeCall: React.FC<FakeCallProps> = ({ onCallEnd, className = '' }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callerName, setCallerName] = useState('Mom');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [isConnecting, setIsConnecting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startFakeCall = async () => {
    setIsConnecting(true);
    
    try {
      await emergencyService.triggerFakeCall({
        contactName: callerName,
        duration: selectedDuration
      });

      setIsCallActive(true);
      setCallDuration(0);
      setIsConnecting(false);

      intervalRef.current = setInterval(() => {
        setCallDuration(prev => {
          if (prev >= selectedDuration) {
            endCall();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Request wake lock to keep screen on during fake call
      if ('wakeLock' in navigator) {
        try {
          await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.log('Wake lock failed:', err);
        }
      }

    } catch (error) {
      console.error('Failed to start fake call:', error);
      setIsConnecting(false);
      alert('Failed to start fake call. Please try again.');
    }
  };

  const endCall = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsCallActive(false);
    setCallDuration(0);
    
    if (onCallEnd) {
      onCallEnd();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isCallActive) {
    return (
      <div className={`fixed inset-0 bg-black z-50 flex flex-col ${className}`}>
        {/* Status bar simulation */}
        <div className="flex justify-between items-center p-4 text-white text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <div className="w-4 h-2 bg-white rounded-sm"></div>
            <span className="ml-2">Carrier</span>
          </div>
          <div className="text-center font-medium">
            {formatTime(callDuration)}
          </div>
          <div className="flex items-center space-x-1">
            <span>100%</span>
            <div className="w-6 h-3 border border-white rounded-sm">
              <div className="w-full h-full bg-green-500 rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* Call interface */}
        <div className="flex-1 flex flex-col justify-center items-center text-white p-8">
          <div className="text-center mb-8">
            <div className="w-32 h-32 bg-gray-600 rounded-full mb-6 flex items-center justify-center text-4xl font-bold">
              {callerName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-semibold mb-2">{callerName}</h2>
            <p className="text-gray-300">Mobile</p>
          </div>

          <div className="text-center mb-8">
            <p className="text-lg text-gray-300">Call in progress</p>
            <p className="text-3xl font-light">{formatTime(callDuration)}</p>
          </div>

          {/* Call controls */}
          <div className="flex justify-center space-x-8">
            <button className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </button>

            <button 
              onClick={endCall}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M4 8l2-2m0 0l2-2M6 6l-2 2m2-2l2 2" />
              </svg>
            </button>

            <button className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom area with additional options */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            <button className="p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm">Message</div>
            </button>
            <button className="p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl mb-2">📞</div>
              <div className="text-sm">Add Call</div>
            </button>
            <button className="p-4 bg-gray-800 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm">Contacts</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 text-white ${className}`}>
      <h3 className="text-xl font-semibold mb-6 flex items-center">
        📞 Fake Emergency Call
      </h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Caller Name</label>
          <input
            type="text"
            value={callerName}
            onChange={(e) => setCallerName(e.target.value)}
            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
            placeholder="Who's calling?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Call Duration</label>
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:border-blue-400"
          >
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={120}>2 minutes</option>
            <option value={300}>5 minutes</option>
          </select>
        </div>

        <div className="bg-blue-500 bg-opacity-20 rounded-xl p-4">
          <h4 className="font-semibold mb-2">💡 How it works</h4>
          <p className="text-sm text-gray-300">
            This feature simulates an incoming call to help you safely exit uncomfortable situations. 
            The fake call will appear realistic with a full-screen interface and can be ended at any time.
          </p>
        </div>

        <button
          onClick={startFakeCall}
          disabled={isConnecting}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
        >
          {isConnecting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Starting Call...
            </div>
          ) : (
            `Start Fake Call from ${callerName}`
          )}
        </button>

        <div className="text-xs text-gray-400 text-center">
          This is a safety feature. Use responsibly and only when needed.
        </div>
      </div>
    </div>
  );
};

export default FakeCall;
