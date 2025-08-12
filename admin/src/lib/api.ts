const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com';
// Removed demo mode - using live backend only

export function getToken(): string | null {
  try { return localStorage.getItem('admin-token'); } catch { return null; }
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('admin-token', token);
  else localStorage.removeItem('admin-token');
}

// Demo responses removed - using live backend only

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
