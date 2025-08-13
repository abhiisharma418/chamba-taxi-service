import { apiFetch } from '../lib/api';

export interface EmergencyContact {
  _id?: string;
  name: string;
  phoneNumber: string;
  relationship: 'family' | 'friend' | 'colleague' | 'other';
  isPrimary: boolean;
}

export interface MedicalInfo {
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
  allergies: Array<{
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe';
  }>;
  medications: string[];
  medicalConditions: string[];
  emergencyMedicalInfo: string;
}

export interface EmergencyPreferences {
  autoCallPolice: boolean;
  autoCallAmbulance: boolean;
  shareLocationWithContacts: boolean;
  recordAudio: boolean;
  enableFakeCall: boolean;
  sosShortcut: 'volume_buttons' | 'power_button' | 'shake_device' | 'app_button';
}

export interface EmergencySettings {
  _id?: string;
  userId: string;
  emergencyContacts: EmergencyContact[];
  medicalInfo: MedicalInfo;
  preferences: EmergencyPreferences;
  notifications: {
    smsEnabled: boolean;
    callEnabled: boolean;
    appNotifications: boolean;
  };
}

export interface EmergencyIncident {
  _id: string;
  incidentId: string;
  userId: string;
  userType: 'customer' | 'driver';
  rideId?: string;
  incidentType: 'medical' | 'accident' | 'harassment' | 'theft' | 'other' | 'panic' | 'vehicle_breakdown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
  };
  description?: string;
  status: 'active' | 'resolved' | 'false_alarm' | 'escalated';
  responseTeam?: {
    assignedOperator?: string;
    responseTime?: string;
    notes?: string;
  };
  contactsNotified: Array<{
    contactId: string;
    contactName: string;
    contactPhone: string;
    notificationTime: string;
    notificationMethod: 'sms' | 'call' | 'app';
    deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  }>;
  emergencyServices: {
    policeNotified: boolean;
    ambulanceNotified: boolean;
    fireServiceNotified: boolean;
    notificationTime?: string;
    referenceNumber?: string;
  };
  timeline: Array<{
    timestamp: string;
    action: string;
    performedBy: string;
    performedByModel: 'User' | 'AdminUser' | 'System';
    details: string;
  }>;
  media: Array<{
    type: 'image' | 'audio' | 'video';
    url: string;
    timestamp: string;
    uploadedBy: string;
  }>;
  resolution?: {
    resolvedAt?: string;
    resolvedBy?: string;
    resolution?: string;
    followUpRequired: boolean;
    followUpDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SOSRequest {
  incidentType: EmergencyIncident['incidentType'];
  severity?: EmergencyIncident['severity'];
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
  };
  description?: string;
  rideId?: string;
  media?: Array<{
    type: 'image' | 'audio' | 'video';
    url: string;
  }>;
  deviceInfo?: {
    platform: string;
    version: string;
    batteryLevel?: number;
  };
  networkInfo?: {
    connectionType: string;
    signalStrength?: number;
  };
}

export interface EmergencyStats {
  totalIncidents: number;
  avgResponseTime: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  incidentsByStatus: Record<string, number>;
  timeframe: string;
}

class EmergencyService {
  async triggerSOS(sosData: SOSRequest) {
    try {
      const response = await api.post('/emergency/sos', sosData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to trigger SOS');
    }
  }

  async getIncident(incidentId: string) {
    try {
      const response = await api.get(`/emergency/incident/${incidentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch incident');
    }
  }

  async getUserIncidents(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await api.get(`/emergency/incidents?${queryParams}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch incidents');
    }
  }

  async updateIncidentStatus(incidentId: string, data: {
    status: EmergencyIncident['status'];
    resolution?: string;
    notes?: string;
  }) {
    try {
      const response = await api.patch(`/emergency/incident/${incidentId}/status`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update incident status');
    }
  }

  async getEmergencySettings(): Promise<{ success: boolean; data: EmergencySettings }> {
    try {
      const response = await api.get('/emergency/settings');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch emergency settings');
    }
  }

  async updateEmergencySettings(settings: Partial<EmergencySettings>) {
    try {
      const response = await api.put('/emergency/settings', settings);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update emergency settings');
    }
  }

  async addEmergencyContact(contact: Omit<EmergencyContact, '_id'>) {
    try {
      const response = await api.post('/emergency/contacts', contact);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add emergency contact');
    }
  }

  async removeEmergencyContact(contactId: string) {
    try {
      const response = await api.delete(`/emergency/contacts/${contactId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove emergency contact');
    }
  }

  async triggerFakeCall(data?: {
    contactName?: string;
    duration?: number;
  }) {
    try {
      const response = await api.post('/emergency/fake-call', data || {});
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to trigger fake call');
    }
  }

  async getEmergencyStats(timeframe: '7d' | '30d' | '90d' = '30d'): Promise<{ success: boolean; data: EmergencyStats }> {
    try {
      const response = await api.get(`/emergency/stats?timeframe=${timeframe}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch emergency stats');
    }
  }

  getCurrentLocation(): Promise<{ latitude: number; longitude: number; address?: string }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const address = await this.reverseGeocode(latitude, longitude);
            resolve({ latitude, longitude, address });
          } catch (error) {
            resolve({ latitude, longitude });
          }
        },
        (error) => {
          reject(new Error(`Failed to get location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  private async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        return data.results[0].formatted_address;
      }
      
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  getDeviceInfo() {
    return {
      platform: navigator.platform || 'unknown',
      version: navigator.appVersion || 'unknown',
      batteryLevel: (navigator as any).getBattery ? undefined : undefined
    };
  }

  getNetworkInfo() {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      connectionType: connection?.effectiveType || 'unknown',
      signalStrength: connection?.downlink || undefined
    };
  }

  setupShakeDetection(callback: () => void, sensitivity: number = 15) {
    if (!window.DeviceMotionEvent) {
      console.warn('Device motion not supported');
      return null;
    }

    let lastTime = 0;
    let lastX = 0, lastY = 0, lastZ = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const currentTime = Date.now();
      
      if (currentTime - lastTime > 100) {
        const deltaTime = currentTime - lastTime;
        const { x = 0, y = 0, z = 0 } = event.accelerationIncludingGravity || {};
        
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);
        
        const speed = (deltaX + deltaY + deltaZ) / deltaTime * 10000;
        
        if (speed > sensitivity) {
          callback();
        }
        
        lastTime = currentTime;
        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state === 'granted';
      }
      
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        );
      });
    } catch (error) {
      return false;
    }
  }
}

export const emergencyService = new EmergencyService();
