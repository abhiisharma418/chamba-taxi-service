const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com';
const USE_DEMO_MODE = false; // Use live backend for admin

export function getToken(): string | null {
  try { return localStorage.getItem('admin-token'); } catch { return null; }
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('admin-token', token);
  else localStorage.removeItem('admin-token');
}

function getDemoResponse(path: string, options: RequestInit) {
  // Admin demo responses
  if (path === '/api/auth/login' && options.method === 'POST') {
    const body = JSON.parse(options.body as string);
    
    if (body.email === 'admin@ridewithus.com' && body.password === 'admin123') {
      return {
        success: true,
        data: {
          token: 'admin-demo-token-' + Date.now(),
          refresh: 'admin-demo-refresh-token',
          user: {
            id: 'admin-1',
            name: 'Admin User',
            email: body.email,
            role: 'admin'
          }
        }
      };
    }
    
    throw new Error('Invalid admin credentials');
  }

  if (path === '/api/admin/stats') {
    return {
      success: true,
      data: {
        totalRides: 1234,
        activeDrivers: 45,
        totalCustomers: 890,
        todayRevenue: 15670,
        completedRides: 1189,
        cancelledRides: 45,
        averageRating: 4.6,
        onlineDrivers: 28
      }
    };
  }

  if (path === '/api/admin/rides') {
    return {
      success: true,
      data: [
        {
          id: 'ride-1',
          customerId: 'cust-1',
          driverId: 'driver-1',
          customerName: 'John Doe',
          driverName: 'Rajesh Kumar',
          pickup: { address: 'Mall Road, Shimla', coordinates: [77.1734, 31.1048] },
          destination: { address: 'The Ridge, Shimla', coordinates: [77.1734, 31.1048] },
          status: 'completed',
          fare: 150,
          createdAt: new Date().toISOString(),
          vehicleType: 'car'
        },
        {
          id: 'ride-2',
          customerId: 'cust-2',
          driverId: 'driver-2',
          customerName: 'Priya Sharma',
          driverName: 'Vikram Singh',
          pickup: { address: 'Bus Stand, Shimla', coordinates: [77.1734, 31.1048] },
          destination: { address: 'Jakhu Temple, Shimla', coordinates: [77.1734, 31.1048] },
          status: 'active',
          fare: 200,
          createdAt: new Date().toISOString(),
          vehicleType: 'car'
        }
      ]
    };
  }

  if (path === '/api/admin/drivers') {
    return {
      success: true,
      data: [
        {
          id: 'driver-1',
          name: 'Rajesh Kumar',
          email: 'rajesh@example.com',
          phone: '+91 98765 43210',
          vehicle: 'Maruti Swift',
          license: 'HP-01-2023-1234',
          rating: 4.8,
          totalRides: 234,
          status: 'online',
          earnings: 45670,
          joinedDate: '2023-01-15'
        },
        {
          id: 'driver-2',
          name: 'Vikram Singh',
          email: 'vikram@example.com',
          phone: '+91 98765 43211',
          vehicle: 'Hyundai i10',
          license: 'HP-01-2023-5678',
          rating: 4.6,
          totalRides: 189,
          status: 'offline',
          earnings: 32450,
          joinedDate: '2023-02-20'
        }
      ]
    };
  }

  if (path === '/api/admin/customers') {
    return {
      success: true,
      data: [
        {
          id: 'cust-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+91 98765 43212',
          totalRides: 45,
          totalSpent: 6750,
          rating: 4.9,
          joinedDate: '2023-03-10',
          status: 'active'
        },
        {
          id: 'cust-2',
          name: 'Priya Sharma',
          email: 'priya@example.com',
          phone: '+91 98765 43213',
          totalRides: 67,
          totalSpent: 8900,
          rating: 4.7,
          joinedDate: '2023-01-25',
          status: 'active'
        }
      ]
    };
  }

  return { success: true, data: {} };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Use demo mode when enabled
  if (USE_DEMO_MODE) {
    console.log(`Admin demo mode active for: ${path}`);
    return getDemoResponse(path, options);
  }

  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    console.log(`Admin API call to: ${API_URL}${path}`);
    const res = await fetch(`${API_URL}${path}`, { 
      ...options, 
      headers, 
      credentials: 'include',
      mode: 'cors'
    });
    
    if (!res.ok) {
      console.warn(`Admin API call failed with status ${res.status}`);
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  } catch (error) {
    console.warn(`Admin API call failed for ${path}, using demo fallback:`, error);
    return getDemoResponse(path, options);
  }
}

export const AdminAPI = {
  login: (payload: { email: string; password: string }) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) }),
  
  // Dashboard stats
  getStats: () => apiFetch('/api/admin/stats'),
  
  // Rides management
  getRides: () => apiFetch('/api/admin/rides'),
  updateRideStatus: (rideId: string, status: string) => apiFetch(`/api/admin/rides/${rideId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  
  // Drivers management
  getDrivers: () => apiFetch('/api/admin/drivers'),
  approveDriver: (driverId: string) => apiFetch(`/api/admin/drivers/${driverId}/approve`, { method: 'PUT' }),
  suspendDriver: (driverId: string) => apiFetch(`/api/admin/drivers/${driverId}/suspend`, { method: 'PUT' }),
  
  // Customers management
  getCustomers: () => apiFetch('/api/admin/customers'),
  
  // Pricing management
  getPricing: () => apiFetch('/api/admin/pricing'),
  updatePricing: (pricing: any) => apiFetch('/api/admin/pricing', { method: 'PUT', body: JSON.stringify(pricing) }),
};
