const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

export function getToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };
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

export const PricingAPI = {
  list: () => apiFetch('/api/pricing') as Promise<{ success: boolean; data: any[] }>,
  create: (payload: any) => apiFetch('/api/pricing', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  update: (id: string, payload: any) => apiFetch(`/api/pricing/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  remove: (id: string) => apiFetch(`/api/pricing/${id}`, { method: 'DELETE' }) as Promise<{ success: boolean }>,
};

export const ZonesAPI = {
  list: () => apiFetch('/api/zones') as Promise<{ success: boolean; data: any[] }>,
  create: (payload: any) => apiFetch('/api/zones', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  update: (id: string, payload: any) => apiFetch(`/api/zones/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  remove: (id: string) => apiFetch(`/api/zones/${id}`, { method: 'DELETE' }) as Promise<{ success: boolean }>,
};

export const AdminAPI = {
  stats: () => apiFetch('/api/admin/stats') as Promise<{ success: boolean; data: { users: number; rides: number; vehicles: number } }>,
  users: () => apiFetch('/api/admin/users') as Promise<{ success: boolean; data: any[] }>,
  updateUser: (id: string, payload: any) => apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
};

export const DriverAPI = {
  setVerification: (id: string, status: 'pending'|'approved'|'rejected') => apiFetch(`/api/driver/${id}/verification`, { method: 'PATCH', body: JSON.stringify({ status }) }) as Promise<{ success: boolean; data: any }>,
};

export const PaymentsAPI = {
  intent: (payload: any) => apiFetch('/api/payments/intent', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  authorize: (payload: any) => apiFetch('/api/payments/authorize', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  capture: (payload: any) => apiFetch('/api/payments/capture', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  refund: (payload: any) => apiFetch('/api/payments/refund', { method: 'POST', body: JSON.stringify(payload) }) as Promise<{ success: boolean; data: any }>,
  receiptUrl: (paymentId: string) => `${API_URL}/api/payments/receipt/${paymentId}.pdf`,
};

export const DispatchAPI = {
  search: (pickup: { lng: number; lat: number }, radiusKm: number) => apiFetch('/api/live/dispatch/search', { method: 'POST', body: JSON.stringify({ pickup: { coordinates: [pickup.lng, pickup.lat] }, radiusKm }) }) as Promise<{ success: boolean; data: any[] }>,
  start: (rideId: string, pickup: { lng: number; lat: number }, radiusKm = 10) => apiFetch('/api/live/dispatch/start', { method: 'POST', body: JSON.stringify({ rideId, pickup: { coordinates: [pickup.lng, pickup.lat] }, radiusKm }) }) as Promise<{ success: boolean; data: any }>,
};

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};