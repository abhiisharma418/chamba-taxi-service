import React, { useState, useEffect } from 'react';
import { emergencyService, EmergencySettings, EmergencyContact, MedicalInfo, EmergencyPreferences } from '../services/emergencyService';
import { useAuth } from '../contexts/AuthContext';

const EmergencySettingsComponent: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<EmergencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: '',
    phoneNumber: '',
    relationship: 'family',
    isPrimary: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await emergencyService.getEmergencySettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load emergency settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings: Partial<EmergencySettings>) => {
    setSaving(true);
    try {
      const response = await emergencyService.updateEmergencySettings(updatedSettings);
      setSettings(response.data);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phoneNumber) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await emergencyService.addEmergencyContact(newContact as Omit<EmergencyContact, '_id'>);
      setNewContact({ name: '', phoneNumber: '', relationship: 'family', isPrimary: false });
      setShowAddContact(false);
      await loadSettings();
      alert('Emergency contact added successfully!');
    } catch (error) {
      console.error('Failed to add contact:', error);
      alert('Failed to add contact. Please try again.');
    }
  };

  const removeContact = async (contactId: string) => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) {
      return;
    }

    try {
      await emergencyService.removeEmergencyContact(contactId);
      await loadSettings();
      alert('Emergency contact removed successfully!');
    } catch (error) {
      console.error('Failed to remove contact:', error);
      alert('Failed to remove contact. Please try again.');
    }
  };

  const updateMedicalInfo = (field: keyof MedicalInfo, value: any) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      medicalInfo: {
        ...settings.medicalInfo,
        [field]: value
      }
    };
    setSettings(updatedSettings);
  };

  const updatePreferences = (field: keyof EmergencyPreferences, value: any) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      preferences: {
        ...settings.preferences,
        [field]: value
      }
    };
    setSettings(updatedSettings);
  };

  const addAllergy = () => {
    const allergen = prompt('Enter allergen name:');
    const severity = prompt('Enter severity (mild, moderate, severe):') as 'mild' | 'moderate' | 'severe';
    
    if (allergen && severity && ['mild', 'moderate', 'severe'].includes(severity)) {
      updateMedicalInfo('allergies', [
        ...(settings?.medicalInfo?.allergies || []),
        { allergen, severity }
      ]);
    }
  };

  const removeAllergy = (index: number) => {
    const allergies = [...(settings?.medicalInfo?.allergies || [])];
    allergies.splice(index, 1);
    updateMedicalInfo('allergies', allergies);
  };

  const addMedication = () => {
    const medication = prompt('Enter medication name:');
    if (medication) {
      updateMedicalInfo('medications', [
        ...(settings?.medicalInfo?.medications || []),
        medication
      ]);
    }
  };

  const removeMedication = (index: number) => {
    const medications = [...(settings?.medicalInfo?.medications || [])];
    medications.splice(index, 1);
    updateMedicalInfo('medications', medications);
  };

  const addMedicalCondition = () => {
    const condition = prompt('Enter medical condition:');
    if (condition) {
      updateMedicalInfo('medicalConditions', [
        ...(settings?.medicalInfo?.medicalConditions || []),
        condition
      ]);
    }
  };

  const removeMedicalCondition = (index: number) => {
    const conditions = [...(settings?.medicalInfo?.medicalConditions || [])];
    conditions.splice(index, 1);
    updateMedicalInfo('medicalConditions', conditions);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 text-white">
            <div className="animate-pulse">
              <div className="h-8 bg-white bg-opacity-20 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-white bg-opacity-20 rounded w-3/4"></div>
                <div className="h-4 bg-white bg-opacity-20 rounded w-1/2"></div>
                <div className="h-4 bg-white bg-opacity-20 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Emergency Settings
            </h1>
            <button
              onClick={() => saveSettings(settings!)}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="flex space-x-1 mb-8">
            {[
              { id: 'contacts', label: 'Emergency Contacts' },
              { id: 'medical', label: 'Medical Info' },
              { id: 'preferences', label: 'Preferences' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white bg-opacity-20 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'contacts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Emergency Contacts</h2>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Add Contact
                </button>
              </div>

              {showAddContact && (
                <div className="bg-white bg-opacity-10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Add New Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newContact.phoneNumber}
                      onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:border-blue-400"
                    />
                    <select
                      value={newContact.relationship}
                      onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value as EmergencyContact['relationship'] })}
                      className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="family">Family</option>
                      <option value="friend">Friend</option>
                      <option value="colleague">Colleague</option>
                      <option value="other">Other</option>
                    </select>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newContact.isPrimary}
                        onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>Primary Contact</span>
                    </label>
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={addContact}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Add Contact
                    </button>
                    <button
                      onClick={() => setShowAddContact(false)}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {settings?.emergencyContacts?.map((contact, index) => (
                  <div key={contact._id || index} className="bg-white bg-opacity-10 rounded-xl p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center">
                          {contact.name}
                          {contact.isPrimary && (
                            <span className="ml-2 px-2 py-1 bg-blue-600 text-xs rounded-full">Primary</span>
                          )}
                        </h3>
                        <p className="text-gray-300">{contact.phoneNumber}</p>
                        <p className="text-gray-400 capitalize">{contact.relationship}</p>
                      </div>
                      <button
                        onClick={() => removeContact(contact._id!)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                {(!settings?.emergencyContacts || settings.emergencyContacts.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    No emergency contacts added yet. Add your first emergency contact to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Medical Information</h2>
              
              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Basic Medical Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Blood Type</label>
                    <select
                      value={settings?.medicalInfo?.bloodType || 'unknown'}
                      onChange={(e) => updateMedicalInfo('bloodType', e.target.value)}
                      className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="unknown">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Emergency Medical Info</label>
                    <textarea
                      value={settings?.medicalInfo?.emergencyMedicalInfo || ''}
                      onChange={(e) => updateMedicalInfo('emergencyMedicalInfo', e.target.value)}
                      placeholder="Important medical information for emergencies..."
                      className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:border-blue-400 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Allergies</h3>
                  <button
                    onClick={addAllergy}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add Allergy
                  </button>
                </div>
                <div className="space-y-2">
                  {settings?.medicalInfo?.allergies?.map((allergy, index) => (
                    <div key={index} className="flex justify-between items-center bg-white bg-opacity-10 rounded-lg p-3">
                      <span>{allergy.allergen} ({allergy.severity})</span>
                      <button
                        onClick={() => removeAllergy(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Current Medications</h3>
                  <button
                    onClick={addMedication}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add Medication
                  </button>
                </div>
                <div className="space-y-2">
                  {settings?.medicalInfo?.medications?.map((medication, index) => (
                    <div key={index} className="flex justify-between items-center bg-white bg-opacity-10 rounded-lg p-3">
                      <span>{medication}</span>
                      <button
                        onClick={() => removeMedication(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Medical Conditions</h3>
                  <button
                    onClick={addMedicalCondition}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add Condition
                  </button>
                </div>
                <div className="space-y-2">
                  {settings?.medicalInfo?.medicalConditions?.map((condition, index) => (
                    <div key={index} className="flex justify-between items-center bg-white bg-opacity-10 rounded-lg p-3">
                      <span>{condition}</span>
                      <button
                        onClick={() => removeMedicalCondition(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Emergency Preferences</h2>
              
              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Automatic Notifications</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span>Automatically notify police for serious incidents</span>
                    <input
                      type="checkbox"
                      checked={settings?.preferences?.autoCallPolice || false}
                      onChange={(e) => updatePreferences('autoCallPolice', e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Automatically notify ambulance for medical emergencies</span>
                    <input
                      type="checkbox"
                      checked={settings?.preferences?.autoCallAmbulance || false}
                      onChange={(e) => updatePreferences('autoCallAmbulance', e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Share location with emergency contacts</span>
                    <input
                      type="checkbox"
                      checked={settings?.preferences?.shareLocationWithContacts !== false}
                      onChange={(e) => updatePreferences('shareLocationWithContacts', e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Record audio during emergency</span>
                    <input
                      type="checkbox"
                      checked={settings?.preferences?.recordAudio || false}
                      onChange={(e) => updatePreferences('recordAudio', e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Enable fake call feature</span>
                    <input
                      type="checkbox"
                      checked={settings?.preferences?.enableFakeCall !== false}
                      onChange={(e) => updatePreferences('enableFakeCall', e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">SOS Trigger Method</h3>
                <div className="space-y-2">
                  {[
                    { value: 'app_button', label: 'App SOS Button' },
                    { value: 'volume_buttons', label: 'Volume Buttons (rapid press)' },
                    { value: 'power_button', label: 'Power Button (rapid press)' },
                    { value: 'shake_device', label: 'Shake Device' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="sosShortcut"
                        value={option.value}
                        checked={settings?.preferences?.sosShortcut === option.value}
                        onChange={(e) => updatePreferences('sosShortcut', e.target.value)}
                        className="w-4 h-4 text-blue-600 bg-white bg-opacity-10 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white bg-opacity-10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Notification Methods</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span>SMS Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings?.notifications?.smsEnabled !== false}
                      onChange={(e) => setSettings(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, smsEnabled: e.target.checked }
                      } : prev)}
                      className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>Phone Call Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings?.notifications?.callEnabled !== false}
                      onChange={(e) => setSettings(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, callEnabled: e.target.checked }
                      } : prev)}
                      className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>App Notifications</span>
                    <input
                      type="checkbox"
                      checked={settings?.notifications?.appNotifications !== false}
                      onChange={(e) => setSettings(prev => prev ? {
                        ...prev,
                        notifications: { ...prev.notifications, appNotifications: e.target.checked }
                      } : prev)}
                      className="w-5 h-5 text-blue-600 bg-white bg-opacity-10 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencySettingsComponent;
