const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

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
  const res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const AuthAPI = {
  login: (payload: { email: string; password: string; userType: 'customer'|'driver'|'admin' }) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: payload.email, password: payload.password }) }) as Promise<{ success: boolean; data: { token: string; refresh: string; user: { id: string; name: string; role: string; email: string } } }>,
  register: (payload: { name: string; email: string; phone: string; role: 'customer'|'driver'|'admin'; password: string }) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: { token: string; refresh: string } }>,
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
};