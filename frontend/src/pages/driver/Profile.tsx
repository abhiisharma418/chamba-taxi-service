import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { DriverAPI } from '../../lib/api';
import { 
  User, Camera, Phone, Mail, MapPin, Calendar, 
  Edit3, Save, X, Upload, Star, Shield, Award,
  Car, FileText, Clock, Check, AlertCircle
} from 'lucide-react';

interface DriverProfile {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  driverInfo: {
    licenseNumber: string;
    licenseExpiry: string;
    experience: string;
    languages: string[];
    rating: number;
    totalRides: number;
    joinDate: string;
    status: 'active' | 'inactive' | 'suspended';
  };
  documents: {
    profilePhoto: string;
    licensePhoto: string;
    aadharCard: string;
    panCard: string;
    medicalCertificate: string;
    policeVerification: string;
  };
  preferences: {
    notifications: {
      rides: boolean;
      earnings: boolean;
      promotions: boolean;
      maintenance: boolean;
    };
    availability: {
      workingHours: { start: string; end: string };
      workingDays: string[];
      maxDistance: number;
    };
  };
}

const DriverProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'driver' | 'documents' | 'preferences'>('personal');
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DriverProfile | null>(null);

  // Default profile data
  const getDefaultProfile = (): DriverProfile => ({
    personalInfo: {
      name: user?.name || 'John Doe',
      email: user?.email || 'john.doe@example.com',
      phone: '+91 9876543210',
      dateOfBirth: '1990-05-15',
      address: '123 Main Street, City, State - 110001',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+91 9876543211'
    },
    driverInfo: {
      licenseNumber: 'DL-1420110012345',
      licenseExpiry: '2026-05-15',
      experience: '5 years',
      languages: ['Hindi', 'English', 'Punjabi'],
      rating: 4.8,
      totalRides: 1250,
      joinDate: '2023-01-15',
      status: 'active'
    },
    documents: {
      profilePhoto: '',
      licensePhoto: '',
      aadharCard: '',
      panCard: '',
      medicalCertificate: '',
      policeVerification: ''
    },
    preferences: {
      notifications: {
        rides: true,
        earnings: true,
        promotions: false,
        maintenance: true
      },
      availability: {
        workingHours: { start: '06:00', end: '22:00' },
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        maxDistance: 25
      }
    }
  });

  // Load profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await DriverAPI.getProfile();
        if (response.success) {
          setProfile(response.data);
        } else {
          setProfile(getDefaultProfile());
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setProfile(getDefaultProfile());
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    // API call to save profile
    setIsEditing(false);
  };

  const handleFileUpload = async (documentType: keyof DriverProfile['documents'], file: File) => {
    setUploading(documentType);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProfile(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: URL.createObjectURL(file)
      }
    }));
    
    setUploading(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const DocumentUpload: React.FC<{ 
    type: keyof DriverProfile['documents']; 
    label: string; 
    current: string;
    required?: boolean;
  }> = ({ type, label, current, required = false }) => (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="font-medium text-gray-900">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {current && <Check className="h-5 w-5 text-green-600" />}
      </div>
      
      <div className="relative">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(type, file);
          }}
          className="hidden"
          id={`upload-${type}`}
        />
        
        <label
          htmlFor={`upload-${type}`}
          className={`
            flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
            ${current ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}
            ${uploading === type ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
          `}
        >
          {uploading === type ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : current ? (
            <div className="text-center">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700">Document uploaded</p>
              <p className="text-xs text-gray-500">Click to replace</p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Upload {label}</p>
              <p className="text-xs text-gray-500">PNG, JPG or PDF up to 5MB</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  {profile.documents.profilePhoto ? (
                    <img 
                      src={profile.documents.profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.personalInfo.name}</h1>
                <p className="text-gray-600">Driver ID: #{user?.id}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.driverInfo.status)}`}>
                    {profile.driverInfo.status.charAt(0).toUpperCase() + profile.driverInfo.status.slice(1)}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{profile.driverInfo.rating}</span>
                    <span className="text-gray-500">({profile.driverInfo.totalRides} rides)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-2xl">
            <nav className="flex space-x-8 px-8 pt-6">
              {[
                { id: 'personal', label: 'Personal Info', icon: User },
                { id: 'driver', label: 'Driver Details', icon: Shield },
                { id: 'documents', label: 'Documents', icon: FileText },
                { id: 'preferences', label: 'Preferences', icon: Award }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`
                    flex items-center space-x-2 pb-4 border-b-2 transition-colors
                    ${activeTab === id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.personalInfo.name}
                  disabled={!isEditing}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, name: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.personalInfo.email}
                  disabled={!isEditing}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, email: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profile.personalInfo.phone}
                  disabled={!isEditing}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, phone: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={profile.personalInfo.dateOfBirth}
                  disabled={!isEditing}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={profile.personalInfo.address}
                  disabled={!isEditing}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, address: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                <input
                  type="text"
                  value={profile.personalInfo.emergencyContact}
                  disabled={!isEditing}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, emergencyContact: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Phone</label>
                <input
                  type="tel"
                  value={profile.personalInfo.emergencyPhone}
                  disabled={!isEditing}
                  onChange={(e) => setProfile(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, emergencyPhone: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>
          )}

          {activeTab === 'driver' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    value={profile.driverInfo.licenseNumber}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry</label>
                  <input
                    type="date"
                    value={profile.driverInfo.licenseExpiry}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driving Experience</label>
                  <select
                    value={profile.driverInfo.experience}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="1-2 years">1-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-10 years">5-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Join Date</label>
                  <input
                    type="date"
                    value={profile.driverInfo.joinDate}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {['Hindi', 'English', 'Punjabi', 'Marathi', 'Tamil', 'Telugu', 'Bengali'].map(lang => (
                    <label key={lang} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={profile.driverInfo.languages.includes(lang)}
                        disabled={!isEditing}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfile(prev => ({
                              ...prev,
                              driverInfo: {
                                ...prev.driverInfo,
                                languages: [...prev.driverInfo.languages, lang]
                              }
                            }));
                          } else {
                            setProfile(prev => ({
                              ...prev,
                              driverInfo: {
                                ...prev.driverInfo,
                                languages: prev.driverInfo.languages.filter(l => l !== lang)
                              }
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Star className="h-6 w-6 text-yellow-500 fill-current" />
                    <span className="font-semibold text-gray-900">Rating</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{profile.driverInfo.rating}/5.0</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Car className="h-6 w-6 text-green-600" />
                    <span className="font-semibold text-gray-900">Total Rides</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{profile.driverInfo.totalRides}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="h-6 w-6 text-purple-600" />
                    <span className="font-semibold text-gray-900">Experience</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{profile.driverInfo.experience}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <p className="text-amber-800 font-medium">Document Requirements</p>
                </div>
                <p className="text-amber-700 text-sm mt-1">
                  Please upload clear, readable copies of all required documents. All documents must be valid and not expired.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentUpload
                  type="profilePhoto"
                  label="Profile Photo"
                  current={profile.documents.profilePhoto}
                  required
                />
                
                <DocumentUpload
                  type="licensePhoto"
                  label="Driving License"
                  current={profile.documents.licensePhoto}
                  required
                />
                
                <DocumentUpload
                  type="aadharCard"
                  label="Aadhar Card"
                  current={profile.documents.aadharCard}
                  required
                />
                
                <DocumentUpload
                  type="panCard"
                  label="PAN Card"
                  current={profile.documents.panCard}
                  required
                />
                
                <DocumentUpload
                  type="medicalCertificate"
                  label="Medical Certificate"
                  current={profile.documents.medicalCertificate}
                />
                
                <DocumentUpload
                  type="policeVerification"
                  label="Police Verification"
                  current={profile.documents.policeVerification}
                />
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8">
              {/* Notification Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  {Object.entries(profile.preferences.notifications).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <p className="text-sm text-gray-600">
                          {key === 'rides' && 'Get notified about new ride requests'}
                          {key === 'earnings' && 'Receive daily earnings summaries'}
                          {key === 'promotions' && 'Get updates about bonuses and incentives'}
                          {key === 'maintenance' && 'System maintenance and update notifications'}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={value}
                        disabled={!isEditing}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences.notifications,
                              [key]: e.target.checked
                            }
                          }
                        }))}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={profile.preferences.availability.workingHours.start}
                          disabled={!isEditing}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              availability: {
                                ...prev.preferences.availability,
                                workingHours: {
                                  ...prev.preferences.availability.workingHours,
                                  start: e.target.value
                                }
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Time</label>
                        <input
                          type="time"
                          value={profile.preferences.availability.workingHours.end}
                          disabled={!isEditing}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              availability: {
                                ...prev.preferences.availability,
                                workingHours: {
                                  ...prev.preferences.availability.workingHours,
                                  end: e.target.value
                                }
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
                    <div className="grid grid-cols-4 gap-3">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <label key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={profile.preferences.availability.workingDays.includes(day)}
                            disabled={!isEditing}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProfile(prev => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    availability: {
                                      ...prev.preferences.availability,
                                      workingDays: [...prev.preferences.availability.workingDays, day]
                                    }
                                  }
                                }));
                              } else {
                                setProfile(prev => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    availability: {
                                      ...prev.preferences.availability,
                                      workingDays: prev.preferences.availability.workingDays.filter(d => d !== day)
                                    }
                                  }
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{day.slice(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Distance (km): {profile.preferences.availability.maxDistance}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={profile.preferences.availability.maxDistance}
                      disabled={!isEditing}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          availability: {
                            ...prev.preferences.availability,
                            maxDistance: parseInt(e.target.value)
                          }
                        }
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5 km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
