import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileAPI } from '../../lib/api';
import Navigation from '../../components/Navigation';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Camera,
  Shield,
  Settings,
  History,
  CreditCard,
  Bell
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

const CustomerProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Fetch profile from API
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await ProfileAPI.getProfile();
      console.log('ProfileAPI.getProfile:', response);

      // Fix: response me direct user object aa raha hai
      const apiData = response.data || response; // agar response.data nahi hai to response hi use karo

  if (apiData && apiData._id) {
  const mappedProfile: UserProfile = {
    id: apiData._id,
    name: apiData.name,
    email: apiData.email,
    phone: apiData.phone,
    role: apiData.role,
    isActive: apiData.isActive,
    locale: apiData.locale,
    createdAt: apiData.createdAt,
    updatedAt: apiData.updatedAt,
  };
  setProfile(mappedProfile);
  setEditForm(mappedProfile);
} else {
  setProfile(null);
}
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  fetchProfile();
}, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditForm(profile || {});
    setIsEditing(false);
  };

const handleSave = async () => {
  if (!editForm) return;

  setIsSaving(true);
  try {
    const response = await ProfileAPI.updateProfile({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
    });

    if (response.success) {
      setProfile({ ...profile!, ...editForm });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } else {
      alert('Failed to update profile. Please try again.');
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
    alert('Failed to update profile. Please try again.');
  } finally {
    setIsSaving(false);
  }
};

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-surface">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-surface">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Failed to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark-surface">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account information</p>
            </div>
            
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12" />
                  </div>
                  {isEditing && (
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white text-gray-600 rounded-full shadow-lg hover:bg-gray-50 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="opacity-90">{profile.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">Role:</span>
                      <span className="font-semibold">{profile.role}</span>
                    </div>
                 
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{profile.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{profile.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900 dark:text-white">{profile.phone}</span>
                      </div>
                    )}
                  </div>

                
                </div>

                {/* Contact & Preferences */}
               
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">Payment Methods</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your cards</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update preferences</p>
              </div>
            </button>

            <button className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">Privacy Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Control your data</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
