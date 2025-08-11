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
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
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

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};