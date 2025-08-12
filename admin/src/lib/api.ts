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
