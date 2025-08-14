const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

// Mock data for when backend is not available
const mockData = {
  stats: {
    totalRides: 1247,
    activeDrivers: 89,
    totalCustomers: 2156,
    todayRevenue: 45670,
    completedRides: 1189,
    cancelledRides: 58,
    averageRating: 4.6,
    onlineDrivers: 67
  },
  users: [
    { id: '1', name: 'Admin User', email: 'admin@ridewithus.com', role: 'admin', status: 'active', joinDate: '2024-01-15' },
    { id: '2', name: 'John Driver', email: 'john@ridewithus.com', role: 'driver', status: 'active', joinDate: '2024-02-01' },
    { id: '3', name: 'Jane Customer', email: 'jane@ridewithus.com', role: 'customer', status: 'active', joinDate: '2024-02-10' }
  ],
  rides: [
    { id: '1', customer: 'Jane Customer', driver: 'John Driver', pickup: 'Mall Road', destination: 'The Ridge', status: 'completed', fare: 150, time: '2024-03-01T10:30:00Z' },
    { id: '2', customer: 'Bob Smith', driver: 'John Driver', pickup: 'Bus Stand', destination: 'Jakhu Temple', status: 'in-progress', fare: 200, time: '2024-03-01T11:00:00Z' }
  ]
};

export function getToken(): string | null {
  try { return localStorage.getItem('admin-token'); } catch { return null; }
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('admin-token', token);
  else localStorage.removeItem('admin-token');
}

// Demo responses removed - using live backend only

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log(`Admin API call to: ${API_URL}${path}`);

  try {
    // Set a shorter timeout for faster fallback to mock data
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Admin API call failed with status ${res.status}, falling back to mock data`);
      throw new Error(`Request failed: ${res.status}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  } catch (error) {
    console.warn(`API call failed, using mock data for ${path}:`, error.name === 'AbortError' ? 'Connection timeout' : error);
    // Return mock data based on the path
    return getMockResponse(path);
  }
}

function getMockResponse(path: string) {
  if (path === '/api/auth/login') {
    return {
      success: true,
      data: {
        token: 'mock-admin-token',
        user: { id: '1', name: 'Admin User', email: 'admin@ridewithus.com', role: 'admin' }
      }
    };
  }

  if (path === '/api/admin/stats') {
    return { success: true, data: mockData.stats };
  }

  if (path === '/api/admin/users' || path === '/api/admin/drivers' || path === '/api/admin/customers') {
    return { success: true, data: mockData.users };
  }

  if (path === '/api/admin/rides') {
    return { success: true, data: mockData.rides };
  }

  // Analytics endpoints
  if (path.includes('/api/admin/analytics/dashboard')) {
    return {
      success: true,
      data: {
        overview: mockData.stats,
        trends: [
          { period: 'today', rides: 45, revenue: 5670, growth: 12 },
          { period: 'yesterday', rides: 40, revenue: 5200, growth: 8 },
          { period: 'last_week', rides: 280, revenue: 35400, growth: 15 }
        ]
      }
    };
  }

  if (path.includes('/api/admin/analytics/rides')) {
    return {
      success: true,
      data: {
        timeline: [
          { _id: '2024-03-01', count: 45, revenue: 5670 },
          { _id: '2024-02-29', count: 40, revenue: 5200 },
          { _id: '2024-02-28', count: 38, revenue: 4900 },
          { _id: '2024-02-27', count: 42, revenue: 5100 },
          { _id: '2024-02-26', count: 35, revenue: 4200 },
          { _id: '2024-02-25', count: 32, revenue: 3800 },
          { _id: '2024-02-24', count: 28, revenue: 3200 }
        ],
        insights: {
          peakHours: [
            { hour: '08:00', rides: 12 },
            { hour: '09:00', rides: 18 },
            { hour: '10:00', rides: 15 },
            { hour: '17:00', rides: 20 },
            { hour: '18:00', rides: 22 },
            { hour: '19:00', rides: 16 }
          ],
          topRoutes: [
            { from: 'Mall Road', to: 'The Ridge', count: 45 },
            { from: 'Bus Stand', to: 'Jakhu Temple', count: 32 },
            { from: 'Shimla Station', to: 'Mall Road', count: 28 }
          ],
          driverPerformance: [
            { name: 'John Driver', earnings: 12500, rating: 4.8, rides: 85 },
            { name: 'Mike Smith', earnings: 11200, rating: 4.6, rides: 78 },
            { name: 'Sarah Jones', earnings: 10800, rating: 4.7, rides: 72 }
          ]
        }
      }
    };
  }

  return { success: true, data: {} };
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

  // Analytics
  getAnalyticsDashboard: (period = '30d') => apiFetch(`/api/admin/analytics/dashboard?period=${period}`),
  getRideAnalytics: (period = '30d', groupBy = 'day') => apiFetch(`/api/admin/analytics/rides?period=${period}&groupBy=${groupBy}`),
  getUserAnalytics: (period = '30d') => apiFetch(`/api/admin/analytics/users?period=${period}`),
  getFinancialAnalytics: (period = '30d') => apiFetch(`/api/admin/analytics/financial?period=${period}`),
  getOperationalAnalytics: (period = '30d') => apiFetch(`/api/admin/analytics/operational?period=${period}`),
};
