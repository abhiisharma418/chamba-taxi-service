import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { 
  User, Car, Camera, Phone, Mail, MapPin, Star, Shield, 
  Edit, Save, X, Upload, FileText, Clock, Award, CheckCircle
} from 'lucide-react';

interface DriverProfile {
  personalInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    dateOfBirth: string;
    emergencyContact: string;
    profilePhoto: string;
  };
  vehicleInfo: {
    make: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
    registrationNumber: string;
    insuranceExpiry: string;
    pollutionExpiry: string;
    vehiclePhoto: string;
  };
  documents: {
    drivingLicense: { uploaded: boolean; verified: boolean; expiryDate: string };
    aadharCard: { uploaded: boolean; verified: boolean };
    panCard: { uploaded: boolean; verified: boolean };
    vehicleRC: { uploaded: boolean; verified: boolean };
    insurance: { uploaded: boolean; verified: boolean; expiryDate: string };
    pollutionCert: { uploaded: boolean; verified: boolean; expiryDate: string };
  };
  stats: {
    rating: number;
    totalRides: number;
    joinDate: string;
    badgesEarned: string[];
    verificationLevel: 'basic' | 'verified' | 'premium';
  };
}

const DriverProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'vehicle' | 'documents' | 'stats'>('personal');
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Simulate API call - in real app, this would fetch from backend
      const mockProfile: DriverProfile = {
        personalInfo: {
          name: user?.name || 'John Doe',
          phone: '+91 98765 43210',
          email: user?.email || 'john.doe@example.com',
          address: '123 Main Street, Sector 15, Chandigarh, 160015',
          dateOfBirth: '1990-05-15',
          emergencyContact: '+91 98765 43211',
          profilePhoto: ''
        },
        vehicleInfo: {
          make: 'Maruti Suzuki',
          model: 'Swift Dzire',
          year: '2020',
          color: 'White',
          licensePlate: 'CH01AB1234',
          registrationNumber: 'CH01201923456789',
          insuranceExpiry: '2025-03-15',
          pollutionExpiry: '2024-12-01',
          vehiclePhoto: ''
        },
        documents: {
          drivingLicense: { uploaded: true, verified: true, expiryDate: '2026-08-20' },
          aadharCard: { uploaded: true, verified: true },
          panCard: { uploaded: true, verified: false },
          vehicleRC: { uploaded: true, verified: true },
          insurance: { uploaded: true, verified: true, expiryDate: '2025-03-15' },
          pollutionCert: { uploaded: false, verified: false, expiryDate: '2024-12-01' }
        },
        stats: {
          rating: 4.8,
          totalRides: 1247,
          joinDate: '2023-01-15',
          badgesEarned: ['Safe Driver', 'Top Rated', 'Punctual'],
          verificationLevel: 'verified'
        }
      };
      
      setProfile(mockProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Save profile changes to backend
      setEditMode(false);
      // Show success message
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleDocumentUpload = async (documentType: string, file: File) => {
    setUploadingDocument(documentType);
    try {
      // Upload document to backend
      // Update document status
      if (profile) {
        setProfile({
          ...profile,
          documents: {
            ...profile.documents,
            [documentType]: {
              ...profile.documents[documentType as keyof typeof profile.documents],
              uploaded: true
            }
          }
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploadingDocument(null);
    }
  };

  const getVerificationStatusColor = (level: string) => {
    switch (level) {
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'verified': return 'text-green-600 bg-green-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getDocumentStatusIcon = (doc: any) => {
    if (doc.verified) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (doc.uploaded) return <Clock className="h-5 w-5 text-yellow-600" />;
    return <X className="h-5 w-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-600">Failed to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {profile.personalInfo.profilePhoto ? (
                    <img 
                      src={profile.personalInfo.profilePhoto} 
                      alt="Profile" 
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    profile.personalInfo.name.split(' ').map(n => n[0]).join('')
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.personalInfo.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="font-semibold">{profile.stats.rating}</span>
                    <span className="text-gray-600">({profile.stats.totalRides} rides)</span>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getVerificationStatusColor(profile.stats.verificationLevel)}`}>
                    <Shield className="h-4 w-4 inline mr-1" />
                    {profile.stats.verificationLevel.charAt(0).toUpperCase() + profile.stats.verificationLevel.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => editMode ? handleSave() : setEditMode(true)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                editMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {editMode ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
              <span>{editMode ? 'Save Changes' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="flex space-x-1 p-2">
            {[
              { id: 'personal', label: 'Personal Info', icon: User },
              { id: 'vehicle', label: 'Vehicle Info', icon: Car },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'stats', label: 'Statistics', icon: Award }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.personalInfo.name}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.personalInfo.phone}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profile.personalInfo.email}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={profile.personalInfo.dateOfBirth}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={profile.personalInfo.address}
                    disabled={!editMode}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                  <input
                    type="tel"
                    value={profile.personalInfo.emergencyContact}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                  <input
                    type="text"
                    value={profile.vehicleInfo.make}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input
                    type="text"
                    value={profile.vehicleInfo.model}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="text"
                    value={profile.vehicleInfo.year}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    value={profile.vehicleInfo.color}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                  <input
                    type="text"
                    value={profile.vehicleInfo.licensePlate}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={profile.vehicleInfo.registrationNumber}
                    disabled={!editMode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              {/* Vehicle Photo */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Vehicle Photo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  {profile.vehicleInfo.vehiclePhoto ? (
                    <img src={profile.vehicleInfo.vehiclePhoto} alt="Vehicle" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <div>
                      <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Upload vehicle photo</p>
                      {editMode && (
                        <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          <Upload className="h-4 w-4 inline mr-2" />
                          Choose File
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Documents & Verification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(profile.documents).map(([key, doc]) => (
                  <div key={key} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      {getDocumentStatusIcon(doc)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          doc.verified ? 'text-green-600' : 
                          doc.uploaded ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {doc.verified ? 'Verified' : doc.uploaded ? 'Under Review' : 'Not Uploaded'}
                        </span>
                      </div>
                      
                      {'expiryDate' in doc && doc.expiryDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expires:</span>
                          <span className="font-medium">{new Date(doc.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {!doc.uploaded && (
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*,application/pdf';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleDocumentUpload(key, file);
                          };
                          input.click();
                        }}
                        disabled={uploadingDocument === key}
                        className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                      >
                        {uploadingDocument === key ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Driver Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <Star className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-blue-800 mb-2">{profile.stats.rating}</div>
                  <div className="text-blue-600">Average Rating</div>
                </div>
                
                <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <Car className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-green-800 mb-2">{profile.stats.totalRides}</div>
                  <div className="text-green-600">Total Rides</div>
                </div>
                
                <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-purple-800 mb-2">
                    {Math.floor((Date.now() - new Date(profile.stats.joinDate).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-purple-600">Days Active</div>
                </div>
              </div>

              {/* Badges */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Badges Earned</h4>
                <div className="flex flex-wrap gap-3">
                  {profile.stats.badgesEarned.map((badge, index) => (
                    <div key={index} className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full font-medium flex items-center space-x-2">
                      <Award className="h-4 w-4" />
                      <span>{badge}</span>
                    </div>
                  ))}
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
