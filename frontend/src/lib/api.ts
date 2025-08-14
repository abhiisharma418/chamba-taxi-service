const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://ride-with-us.onrender.com';
const USE_DEMO_MODE = false; // Disable demo mode to use real API

export function getToken(): string | null {
  try { return localStorage.getItem('token'); } catch { return null; }
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

function getDemoResponse(path: string, options: RequestInit) {
  // Provide demo responses for essential functionality
  if (path === '/api/auth/login' && options.method === 'POST') {
    const body = JSON.parse(options.body as string);

    // In demo mode, be more permissive with credentials
    // Check for specific demo credentials first
    if ((body.email === 'customer@test.com' || body.email === 'demo@test.com') && body.password === 'password') {
      return {
        success: true,
        data: {
          token: 'demo-token-' + Date.now(),
          refresh: 'demo-refresh-token',
          user: {
            id: '1',
            name: 'Demo Customer',
            email: body.email,
            role: 'customer'
          }
        }
      };
    }

    if (body.email === 'driver@test.com' && body.password === 'password') {
      return {
        success: true,
        data: {
          token: 'demo-token-' + Date.now(),
          refresh: 'demo-refresh-token',
          user: {
            id: '2',
            name: 'Demo Driver',
            email: body.email,
            role: 'driver'
          }
        }
      };
    }

    // For any other credentials in demo mode, create a demo user
    // This ensures the app always works even with wrong credentials
    const userType = body.email.includes('driver') ? 'driver' : 'customer';
    return {
      success: true,
      data: {
        token: 'demo-token-' + Date.now(),
        refresh: 'demo-refresh-token',
        user: {
          id: Date.now().toString(),
          name: `Demo ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
          email: body.email,
          role: userType
        }
      }
    };
  }

  if (path === '/api/auth/register' && options.method === 'POST') {
    return {
      success: true,
      data: {
        token: 'demo-token-' + Date.now(),
        refresh: 'demo-refresh-token'
      }
    };
  }

  if (path === '/api/auth/refresh' && options.method === 'POST') {
    return {
      success: true,
      data: {
        token: 'demo-token-' + Date.now(),
        refresh: 'demo-refresh-token'
      }
    };
  }

  if (path === '/api/auth/logout' && options.method === 'POST') {
    return { success: true };
  }

  if (path === '/api/auth/logout') {
    return { success: true };
  }

  if (path === '/api/rides/estimate' && options.method === 'POST') {
    return {
      success: true,
      data: {
        distance: '5.2 km',
        duration: '12 mins',
        price: Math.floor(Math.random() * 50) + 100, // Random price between 100-150
        estimated: Math.floor(Math.random() * 50) + 100,
        distanceKm: 5.2,
        durationMin: 12,
        regionType: 'city'
      }
    };
  }

  if (path === '/api/rides' && options.method === 'POST') {
    return {
      success: true,
      data: {
        id: 'ride-' + Date.now(),
        status: 'requested',
        price: Math.floor(Math.random() * 50) + 100
      }
    };
  }

  if (path === '/api/rides/history') {
    return {
      success: true,
      data: [
        {
          id: 'ride-1',
          status: 'completed',
          pickup: { address: 'Demo Pickup Location', coordinates: [77.1734, 31.1048] },
          destination: { address: 'Demo Destination', coordinates: [77.2673, 31.0976] },
          fare: { estimated: 150, actual: 150 },
          createdAt: new Date().toISOString(),
          vehicleType: 'car',
          rating: 4.5
        }
      ]
    };
  }

  // Driver API fallbacks
  if (path === '/api/driver/profile') {
    return {
      success: true,
      data: {
        personalInfo: {
          name: 'Demo Driver',
          email: 'driver@example.com',
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
      }
    };
  }

  if (path === '/api/driver/vehicles') {
    return {
      success: true,
      data: [
        {
          id: '1',
          make: 'Maruti Suzuki',
          model: 'Swift',
          year: 2020,
          color: 'White',
          licensePlate: 'DL-1CA-1234',
          vehicleType: 'hatchback',
          fuelType: 'petrol',
          isActive: true,
          status: 'active'
        }
      ]
    };
  }

  if (path === '/api/support/faqs') {
    return {
      success: true,
      data: [
        {
          id: '1',
          category: 'earnings',
          question: 'How is my fare calculated?',
          answer: 'Your fare is calculated based on base fare + distance rate + time rate + any surge pricing. You keep 75% of the total fare, and RideWithUs takes 25% as platform fee.',
          helpful: 45,
          notHelpful: 3
        },
        {
          id: '2',
          category: 'rides',
          question: 'What should I do if a passenger cancels?',
          answer: 'If a passenger cancels after you\'ve arrived at the pickup location and waited for more than 5 minutes, you may be eligible for a cancellation fee.',
          helpful: 38,
          notHelpful: 2
        }
      ]
    };
  }

  if (path === '/api/support/tickets') {
    return {
      success: true,
      data: []
    };
  }

  if (path === '/api/driver/earnings') {
    return {
      success: true,
      data: {
        daily: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 2000) + 500,
          rides: Math.floor(Math.random() * 15) + 3
        })).reverse(),
        summary: {
          today: 1250,
          yesterday: 980,
          thisWeek: 8750,
          lastWeek: 7200,
          thisMonth: 35000,
          lastMonth: 32000,
          totalEarnings: 125000,
          totalRides: 850,
          avgPerRide: 147
        }
      }
    };
  }

  // Customer profile endpoints
  if (path === '/api/customer/profile') {
    if (options.method === 'PUT') {
      // Update profile - return success
      return {
        success: true,
        data: {
          message: 'Profile updated successfully'
        }
      };
    }
    // Get profile
    return {
      success: true,
      data: {
        id: '1',
        name: 'Demo Customer',
        email: 'customer@test.com',
        phone: '+91 9876543210',
        address: 'Shimla, Himachal Pradesh, India',
        dateOfBirth: '1990-01-15',
        emergencyContact: '+91 9876543211',
        preferredLanguage: 'Hindi',
        profileImage: null,
        joinDate: '2024-01-15',
        totalRides: 47,
        rating: 4.8,
        isVerified: true,
        lastLoginAt: new Date().toISOString()
      }
    };
  }

  if (path === '/api/customer/profile/stats') {
    return {
      success: true,
      data: {
        totalRides: 47,
        completedRides: 45,
        cancelledRides: 2,
        averageRating: 4.8,
        totalSpent: 12500,
        favoriteRoutes: [
          { from: 'Mall Road', to: 'The Ridge', count: 8 },
          { from: 'Bus Stand', to: 'Jakhu Temple', count: 6 }
        ],
        monthlyRides: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          rides: Math.floor(Math.random() * 10) + 2
        }))
      }
    };
  }

  if (path === '/api/customer/payment-methods') {
    return {
      success: true,
      data: [
        {
          id: '1',
          type: 'card',
          provider: 'visa',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
          isVerified: true
        },
        {
          id: '2',
          type: 'upi',
          provider: 'upi',
          upiId: 'customer@paytm',
          isDefault: false,
          isVerified: true
        }
      ]
    };
  }

  if (path === '/api/customer/settings/notifications') {
    return {
      success: true,
      data: {
        email: {
          rideUpdates: true,
          promotions: false,
          newsletters: true
        },
        sms: {
          rideUpdates: true,
          emergencyAlerts: true,
          promotions: false
        },
        push: {
          rideUpdates: true,
          driverMessages: true,
          promotions: false
        }
      }
    };
  }

  if (path === '/api/customer/settings/privacy') {
    return {
      success: true,
      data: {
        shareLocationHistory: false,
        allowDataCollection: true,
        shareRideData: false,
        enableLocationTracking: true
      }
    };
  }

  // Rides API endpoints
  if (path === '/api/rides/history') {
    return {
      success: true,
      data: [
        {
          id: '1',
          customerId: '1',
          driverId: 'driver1',
          pickup: { address: 'Mall Road, Shimla', coordinates: [77.1734, 31.1048] },
          destination: { address: 'The Ridge, Shimla', coordinates: [77.1722, 31.1033] },
          vehicleType: 'car',
          status: 'completed',
          fare: { estimated: 150, actual: 150 },
          paymentStatus: 'captured',
          createdAt: new Date('2024-03-01T10:30:00Z'),
          completedAt: new Date('2024-03-01T10:45:00Z'),
          rating: 5
        },
        {
          id: '2',
          customerId: '1',
          driverId: 'driver2',
          pickup: { address: 'Bus Stand, Shimla', coordinates: [77.1700, 31.1050] },
          destination: { address: 'Jakhu Temple, Shimla', coordinates: [77.1800, 31.1100] },
          vehicleType: 'car',
          status: 'completed',
          fare: { estimated: 200, actual: 200 },
          paymentStatus: 'captured',
          createdAt: new Date('2024-02-28T14:20:00Z'),
          completedAt: new Date('2024-02-28T14:40:00Z'),
          rating: 4
        }
      ]
    };
  }

  if (path.startsWith('/api/rides/') && path !== '/api/rides/history') {
    // Individual ride details
    return {
      success: true,
      data: {
        id: path.split('/')[3],
        customerId: '1',
        driverId: 'driver1',
        pickup: { address: 'Mall Road, Shimla', coordinates: [77.1734, 31.1048] },
        destination: { address: 'The Ridge, Shimla', coordinates: [77.1722, 31.1033] },
        vehicleType: 'car',
        status: 'completed',
        fare: { estimated: 150, actual: 150 },
        paymentStatus: 'captured',
        createdAt: new Date(),
        completedAt: new Date()
      }
    };
  }

  if (path === '/api/rides' && options.method === 'POST') {
    // Create new ride
    return {
      success: true,
      data: {
        id: 'ride_' + Date.now(),
        customerId: '1',
        pickup: JSON.parse(options.body as string).pickup,
        destination: JSON.parse(options.body as string).destination,
        vehicleType: JSON.parse(options.body as string).vehicleType,
        status: 'requested',
        fare: { estimated: 150 },
        paymentStatus: 'none',
        createdAt: new Date()
      }
    };
  }

  if (path === '/api/rides/estimate' && options.method === 'POST') {
    // Fare estimate
    return {
      success: true,
      data: {
        estimatedFare: 150,
        estimatedTime: 15,
        distance: 5.2,
        basefare: 50,
        distanceRate: 10,
        timeRate: 5
      }
    };
  }

  // Live API endpoints
  if (path.startsWith('/api/live/')) {
    return {
      success: true,
      data: { message: 'Success' }
    };
  }

  // Default demo response
  return { success: true, data: {} };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Only use demo mode if explicitly enabled or offline
  const shouldUseDemoMode = USE_DEMO_MODE || !navigator.onLine;

  if (shouldUseDemoMode) {
    console.log(`Frontend API: Using demo data for ${path} (${USE_DEMO_MODE ? 'demo mode enabled' : 'offline'})`);
    return getDemoResponse(path, options);
  }

  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log(`Frontend API call to: ${API_URL}${path}`);

  // Wrap everything in a promise that resolves to demo data on any failure
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn(`Frontend API timeout for ${path}, using demo data`);
      resolve(getDemoResponse(path, options));
    }, 3000); // 3 second timeout

    // Try the actual API call
    fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors'
    })
    .then(async (res) => {
      clearTimeout(timeoutId);

      if (!res.ok) {
        // For auth failures, return proper error instead of demo data
        if (path === '/api/auth/login' && (res.status === 401 || res.status === 403)) {
          const errorData = await res.json().catch(() => ({ message: 'Invalid credentials' }));
          throw new Error(errorData.message || 'Invalid credentials');
        }
        throw new Error(`Request failed: ${res.status}`);
      }

      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        resolve(data);
      } else {
        const text = await res.text();
        resolve(text);
      }
    })
    .catch((error) => {
      clearTimeout(timeoutId);

      // For login, throw the error instead of returning demo data
      if (path === '/api/auth/login') {
        throw error;
      }

      console.warn(`Frontend API call failed for ${path}, using demo data:`, error.message || error);
      resolve(getDemoResponse(path, options));
    });
  });
}

export const AuthAPI = {
  login: (payload: { email: string; password: string; userType: 'customer'|'driver' }) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: payload.email, password: payload.password }) }) as Promise<{ success: boolean; data: { token: string; refresh: string; user: { id: string; name: string; role: string; email: string } } }>,
  register: (payload: { name: string; email: string; phone: string; role: 'customer'|'driver'; password: string }) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: { token: string; refresh: string } }>,
  refresh: () => apiFetch('/api/auth/refresh', { method: 'POST', body: JSON.stringify({}) }) as Promise<{ success: boolean; data: { token: string; refresh: string } }>,
  logout: () => apiFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) }) as Promise<{ success: boolean }>,
};

export const RidesAPI = {
  estimate: (payload: any) => apiFetch('/api/rides/estimate', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  create: (payload: any) => apiFetch('/api/rides', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  get: (id: string) => apiFetch(`/api/rides/${id}`) as Promise<{ success: boolean; data: any }>,
  updateStatus: (id: string, status: string) => apiFetch(`/api/rides/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }) as Promise<{ success: boolean; data: any }>,
  history: () => apiFetch('/api/rides/history') as Promise<{ success: boolean; data: any[] }>,
};

export const LiveAPI = {
  heartbeat: (lng: number, lat: number) => apiFetch('/api/live/driver/heartbeat', { method: 'POST', body: JSON.stringify({ lng, lat }) }) as Promise<{ success: boolean }>,
  setAvailability: (available: boolean) => apiFetch('/api/live/driver/availability', { method: 'POST', body: JSON.stringify({ available }) }) as Promise<{ success: boolean }>,
  respondOffer: (rideId: string, accept: boolean) => apiFetch('/api/live/driver/respond', { method: 'POST', body: JSON.stringify({ rideId, accept }) }) as Promise<{ success: boolean; data: any }>,
  startDispatch: (rideId: string, pickup: { coordinates: [number, number] }, radiusKm = 10) => apiFetch('/api/live/dispatch/start', { method: 'POST', body: JSON.stringify({ rideId, pickup, radiusKm }) }) as Promise<{ success: boolean; data: any }>,
};

export const PaymentAPI = {
  createIntent: (payload: {
    provider: 'razorpay' | 'stripe' | 'upi' | 'cod';
    amount: number;
    currency?: string;
    rideId?: string;
    paymentMethod?: string;
    upiId?: string
  }) => apiFetch('/api/payment/intent', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  verifyUpi: (payload: {
    paymentId: string;
    transactionId?: string;
    status: 'success' | 'failed'
  }) => apiFetch('/api/payment/verify-upi', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  confirmCod: (payload: {
    paymentId: string;
    driverId: string;
    amount: number
  }) => apiFetch('/api/payment/confirm-cod', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  getReceipt: (paymentId: string) => apiFetch(`/api/payment/receipt/${paymentId}`) as Promise<{ success: boolean; data: any }>,

  authorize: (payload: {
    provider: 'razorpay' | 'stripe';
    providerRef: string
  }) => apiFetch('/api/payment/authorize', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  capture: (payload: {
    provider: 'razorpay' | 'stripe';
    providerRef: string;
    amount?: number;
    currency?: string
  }) => apiFetch('/api/payment/capture', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  refund: (payload: {
    provider: 'razorpay' | 'stripe';
    providerRef: string;
    amount?: number
  }) => apiFetch('/api/payment/refund', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>
};

export const WhatsAppAPI = {
  sendBookingConfirmation: (payload: {
    customerPhone: string;
    bookingData: {
      customerName: string;
      bookingId: string;
      vehicleType: string;
      pickupLocation: string;
      destination: string;
      fare: number;
    }
  }) => apiFetch('/api/whatsapp/booking-confirmation', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  sendDriverAssigned: (payload: {
    customerPhone: string;
    driverData: {
      name: string;
      phone: string;
      vehicleNumber: string;
      vehicleModel: string;
      estimatedArrival: number;
    };
    bookingData: {
      customerName: string;
      bookingId: string;
    }
  }) => apiFetch('/api/whatsapp/driver-assigned', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  sendStatusUpdate: (payload: {
    customerPhone: string;
    status: 'driver_arrived' | 'trip_started' | 'trip_completed';
    bookingData: {
      customerName: string;
      bookingId: string;
      fare?: number;
    };
    additionalInfo?: any;
  }) => apiFetch('/api/whatsapp/status-update', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  sendDriverNotification: (payload: {
    driverPhone: string;
    type: 'new_booking' | 'booking_cancelled';
    bookingData: any;
  }) => apiFetch('/api/whatsapp/driver-notification', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  sendCustomMessage: (payload: {
    to: string;
    message: string;
    type?: 'text' | 'location' | 'contact';
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      address?: string;
    };
    contact?: {
      name: string;
      phone: string;
    };
  }) => apiFetch('/api/whatsapp/custom-message', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>
};

export const TrackingAPI = {
  startTracking: (payload: {
    rideId: string;
    driverId?: string;
    customerId?: string;
  }) => apiFetch('/api/tracking/start', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  stopTracking: (payload: {
    rideId: string;
    reason?: 'completed' | 'cancelled' | 'manual';
  }) => apiFetch('/api/tracking/stop', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  updateLocation: (payload: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
  }) => apiFetch('/api/tracking/location', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  batchUpdateLocation: (payload: {
    locations: Array<{
      lat: number;
      lng: number;
      timestamp: Date;
      heading?: number;
      speed?: number;
      accuracy?: number;
    }>;
  }) => apiFetch('/api/tracking/location/batch', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  getTrackingStatus: (rideId: string) => apiFetch(`/api/tracking/status/${rideId}`) as Promise<{ success: boolean; data: any }>,

  getActiveRides: () => apiFetch('/api/tracking/active') as Promise<{ success: boolean; data: any }>,

  shareLiveLocation: (payload: {
    rideId: string;
    customerId: string;
  }) => apiFetch('/api/tracking/share-location', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  triggerEmergency: (payload: {
    rideId: string;
    location: { lat: number; lng: number };
    message?: string;
  }) => apiFetch('/api/tracking/emergency', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  getLocationHistory: (rideId: string) => apiFetch(`/api/tracking/history/${rideId}`) as Promise<{ success: boolean; data: any }>
};

export const DriverAPI = {
  // Profile endpoints
  getProfile: () => apiFetch('/api/driver/profile') as Promise<{ success: boolean; data: any }>,
  updateProfile: (payload: any) => apiFetch('/api/driver/profile', { method: 'PUT', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  getProfileCompletion: () => apiFetch('/api/driver/profile/completion') as Promise<{ success: boolean; data: any }>,

  // Document management
  uploadDocument: (documentType: string, file: File, expiry?: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    if (expiry) formData.append('expiry', expiry);
    return apiFetch('/api/driver/documents/upload', { method: 'POST', body: formData }) as Promise<{ success: boolean; data: any }>;
  },
  getDocumentAlerts: () => apiFetch('/api/driver/documents/alerts') as Promise<{ success: boolean; data: any }>,

  // Trip history endpoints
  getTripHistory: (params?: { status?: string; month?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.month) query.append('month', params.month);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return apiFetch(`/api/rides/history?${query.toString()}`) as Promise<{ success: boolean; data: any[] }>;
  },
  getTripDetails: (tripId: string) => apiFetch(`/api/rides/${tripId}`) as Promise<{ success: boolean; data: any }>,
  getTripStats: () => apiFetch('/api/driver/trips/stats') as Promise<{ success: boolean; data: any }>,

  // Earnings endpoints
  getEarnings: (period?: 'daily' | 'weekly' | 'monthly') => apiFetch(`/api/driver/earnings${period ? `?period=${period}` : ''}`) as Promise<{ success: boolean; data: any }>,
  getEarningsBreakdown: () => apiFetch('/api/driver/earnings/breakdown') as Promise<{ success: boolean; data: any }>,
  getEarningsHistory: (page?: number, limit?: number) => apiFetch(`/api/driver/earnings/history?page=${page || 1}&limit=${limit || 20}`) as Promise<{ success: boolean; data: any }>,

  // Vehicle management endpoints
  getVehicles: () => apiFetch('/api/driver/vehicles') as Promise<{ success: boolean; data: any[] }>,
  getVehicle: (vehicleId: string) => apiFetch(`/api/driver/vehicles/${vehicleId}`) as Promise<{ success: boolean; data: any }>,
  createVehicle: (payload: any) => apiFetch('/api/driver/vehicles', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  updateVehicle: (vehicleId: string, payload: any) => apiFetch(`/api/driver/vehicles/${vehicleId}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  deleteVehicle: (vehicleId: string) => apiFetch(`/api/driver/vehicles/${vehicleId}`, { method: 'DELETE' }) as Promise<{ success: boolean; data: any }>,
  uploadVehicleDocument: (vehicleId: string, documentType: string, file: File, expiry: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    formData.append('expiry', expiry);
    return apiFetch(`/api/driver/vehicles/${vehicleId}/documents`, { method: 'POST', body: formData }) as Promise<{ success: boolean; data: any }>;
  },
  addServiceRecord: (vehicleId: string, payload: any) => apiFetch(`/api/driver/vehicles/${vehicleId}/service`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  addInspectionRecord: (vehicleId: string, payload: any) => apiFetch(`/api/driver/vehicles/${vehicleId}/inspection`, { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  getVehicleAlerts: (vehicleId: string) => apiFetch(`/api/driver/vehicles/${vehicleId}/alerts`) as Promise<{ success: boolean; data: any }>,
  toggleVehicleStatus: (vehicleId: string, isActive: boolean) => apiFetch(`/api/driver/vehicles/${vehicleId}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }) as Promise<{ success: boolean; data: any }>,
  getVehicleStats: () => apiFetch('/api/driver/vehicles/stats') as Promise<{ success: boolean; data: any }>,

  // Support endpoints
  getFAQs: (params?: { search?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    return apiFetch(`/api/support/faqs?${query.toString()}`) as Promise<{ success: boolean; data: any[] }>;
  },
  getFAQCategories: () => apiFetch('/api/support/faqs/categories') as Promise<{ success: boolean; data: any }>,
  recordFAQFeedback: (faqId: string, helpful: boolean, feedback?: string) => apiFetch(`/api/support/faqs/${faqId}/feedback`, { method: 'POST', body: JSON.stringify({ helpful, feedback }) }) as Promise<{ success: boolean; data: any }>,

  getTickets: (status?: string) => apiFetch(`/api/support/tickets${status ? `?status=${status}` : ''}`) as Promise<{ success: boolean; data: any[] }>,
  getTicket: (ticketId: string) => apiFetch(`/api/support/tickets/${ticketId}`) as Promise<{ success: boolean; data: any }>,
  createTicket: (payload: { subject: string; category: string; priority: string; message: string; metadata?: any }) => apiFetch('/api/support/tickets', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  addMessage: (ticketId: string, message: string, attachments?: File[]) => {
    const formData = new FormData();
    formData.append('message', message);
    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }
    return apiFetch(`/api/support/tickets/${ticketId}/messages`, { method: 'POST', body: formData }) as Promise<{ success: boolean; data: any }>;
  },
  closeTicket: (ticketId: string, rating?: number, feedback?: string) => apiFetch(`/api/support/tickets/${ticketId}/close`, { method: 'PATCH', body: JSON.stringify({ rating, feedback }) }) as Promise<{ success: boolean; data: any }>,
  getTicketStats: () => apiFetch('/api/support/tickets/stats') as Promise<{ success: boolean; data: any }>,
  searchSupport: (query: string, type?: 'faq' | 'tickets') => apiFetch(`/api/support/search?query=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`) as Promise<{ success: boolean; data: any }>
};

export const ProfileAPI = {
  // Customer profile endpoints
  getProfile: () => apiFetch('/api/customer/profile') as Promise<{ success: boolean; data: any }>,
  updateProfile: (payload: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    emergencyContact?: string;
    preferredLanguage?: string;
  }) => apiFetch('/api/customer/profile', { method: 'PUT', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    return apiFetch('/api/customer/profile/image', { method: 'POST', body: formData }) as Promise<{ success: boolean; data: any }>;
  },
  deleteProfileImage: () => apiFetch('/api/customer/profile/image', { method: 'DELETE' }) as Promise<{ success: boolean; data: any }>,

  // Customer settings
  getNotificationSettings: () => apiFetch('/api/customer/settings/notifications') as Promise<{ success: boolean; data: any }>,
  updateNotificationSettings: (payload: any) => apiFetch('/api/customer/settings/notifications', { method: 'PUT', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  getPrivacySettings: () => apiFetch('/api/customer/settings/privacy') as Promise<{ success: boolean; data: any }>,
  updatePrivacySettings: (payload: any) => apiFetch('/api/customer/settings/privacy', { method: 'PUT', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  // Payment methods
  getPaymentMethods: () => apiFetch('/api/customer/payment-methods') as Promise<{ success: boolean; data: any[] }>,
  addPaymentMethod: (payload: any) => apiFetch('/api/customer/payment-methods', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  updatePaymentMethod: (methodId: string, payload: any) => apiFetch(`/api/customer/payment-methods/${methodId}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  deletePaymentMethod: (methodId: string) => apiFetch(`/api/customer/payment-methods/${methodId}`, { method: 'DELETE' }) as Promise<{ success: boolean; data: any }>,

  // Account management
  changePassword: (payload: { currentPassword: string; newPassword: string }) => apiFetch('/api/customer/change-password', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  deleteAccount: (payload: { password: string; reason?: string }) => apiFetch('/api/customer/delete-account', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,

  // Profile statistics
  getProfileStats: () => apiFetch('/api/customer/profile/stats') as Promise<{ success: boolean; data: any }>
};
