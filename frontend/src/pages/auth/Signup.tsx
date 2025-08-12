import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/Logo';
import { Eye, EyeOff, Mail, Lock, User, Phone, Car, Shield, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer' as 'customer' | 'driver',
    licenseNumber: '',
    vehicleModel: '',
    vehicleNumber: '',
    agreeTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < 3) {
      // Validation for each step
      if (currentStep === 1) {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
          setError('Please fill all required fields');
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address');
          return;
        }
      }
      
      if (currentStep === 2) {
        if (!formData.password || !formData.confirmPassword) {
          setError('Please fill all password fields');
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
      }
      
      setCurrentStep(currentStep + 1);
      setError('');
      return;
    }

    // Final submission
    if (!formData.agreeTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    if (formData.role === 'driver' && (!formData.licenseNumber || !formData.vehicleModel || !formData.vehicleNumber)) {
      setError('Please fill all driver details');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          ...(formData.role === 'driver' && {
            licenseNumber: formData.licenseNumber,
            vehicleModel: formData.vehicleModel,
            vehicleNumber: formData.vehicleNumber
          })
        })
      });

      const data = await response.json();

      if (data.success) {
        await login(data.user, data.token);
        
        if (formData.role === 'driver') {
          navigate('/driver/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors">
            <Logo size="sm" />
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-1 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
            <p className="text-slate-600">
              {currentStep === 1 && "Let's start with your basic information"}
              {currentStep === 2 && "Create a secure password"}
              {currentStep === 3 && "Choose your role and finish up"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="First name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Password */}
            {currentStep === 2 && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-sm text-slate-600">
                  <p className="mb-2">Password must contain:</p>
                  <ul className="space-y-1">
                    <li className={formData.password.length >= 6 ? 'text-green-600' : 'text-slate-400'}>
                      ✓ At least 6 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                      ✓ One uppercase letter (recommended)
                    </li>
                    <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-slate-400'}>
                      ✓ One number (recommended)
                    </li>
                  </ul>
                </div>
              </>
            )}

            {/* Step 3: Role Selection */}
            {currentStep === 3 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">
                    I want to join as:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.role === 'customer' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="role"
                        value="customer"
                        checked={formData.role === 'customer'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <User className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <div className="font-medium">Customer</div>
                        <div className="text-sm text-slate-600">Book rides</div>
                      </div>
                    </label>
                    <label className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.role === 'driver' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        name="role"
                        value="driver"
                        checked={formData.role === 'driver'}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <Car className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <div className="font-medium">Driver</div>
                        <div className="text-sm text-slate-600">Provide rides</div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.role === 'driver' && (
                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Driver Information
                    </h4>
                    <div>
                      <label htmlFor="licenseNumber" className="block text-sm font-medium text-slate-700 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="DL1234567890123"
                      />
                    </div>
                    <div>
                      <label htmlFor="vehicleModel" className="block text-sm font-medium text-slate-700 mb-2">
                        Vehicle Model
                      </label>
                      <input
                        type="text"
                        id="vehicleModel"
                        name="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Maruti Swift Dzire"
                      />
                    </div>
                    <div>
                      <label htmlFor="vehicleNumber" className="block text-sm font-medium text-slate-700 mb-2">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        id="vehicleNumber"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="DL 01 AB 1234"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mt-1"
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>{currentStep === 3 ? 'Create Account' : 'Continue'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
