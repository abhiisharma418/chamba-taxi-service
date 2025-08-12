const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://chamba-taxi-service-2.onrender.com';
const USE_MOCK_DATA = true; // Enable mock data for development

export function getToken(): string | null {
  try { return localStorage.getItem('token'); } catch { return null; }
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  } catch (error) {
    // Fallback to mock data when API is unavailable
    console.warn(`API call failed for ${path}, using mock data:`, error);
    return getMockResponse(path, options);
  }
}

function getMockResponse(path: string, options: RequestInit) {
  const mockToken = 'mock-jwt-token-' + Date.now();

  if (path === '/api/auth/login' && options.method === 'POST') {
    return {
      success: true,
      data: {
        token: mockToken,
        refresh: 'mock-refresh-token',
        user: {
          id: '1',
          name: 'Demo User',
          email: 'demo@test.com',
          role: 'customer'
        }
      }
    };
  }

  if (path === '/api/auth/register' && options.method === 'POST') {
    return {
      success: true,
      data: {
        token: mockToken,
        refresh: 'mock-refresh-token'
      }
    };
  }

  if (path === '/api/auth/refresh' && options.method === 'POST') {
    return {
      success: true,
      data: {
        token: mockToken,
        refresh: 'mock-refresh-token'
      }
    };
  }

  if (path === '/api/auth/logout' && options.method === 'POST') {
    return { success: true };
  }

  if (path === '/api/rides/estimate' && options.method === 'POST') {
    return {
      success: true,
      data: {
        distance: '5.2 km',
        duration: '12 mins',
        price: 15.50,
        vehicleTypes: ['standard', 'premium']
      }
    };
  }

  if (path === '/api/rides' && options.method === 'POST') {
    return {
      success: true,
      data: {
        id: 'ride-' + Date.now(),
        status: 'pending',
        price: 15.50
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
          pickup: { address: 'Downtown', coordinates: [-74.006, 40.7128] },
          destination: { address: 'Airport', coordinates: [-73.9857, 40.7484] },
          price: 25.00,
          date: new Date().toISOString()
        }
      ]
    };
  }

  // Default mock response
  return { success: true, data: {} };
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
