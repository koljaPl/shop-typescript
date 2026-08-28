// Schlanker API-Client mit automatischer Token- und Cookie-Unterstützung und detaillierten Fehlern
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as any),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    let errorMsg = json.message || 'Anfrage fehlgeschlagen';
    if (json.errors && Array.isArray(json.errors) && json.errors.length > 0) {
      const details = json.errors
        .map((e: any) => `${e.path?.join('.') || 'Feld'}: ${e.message}`)
        .join('; ');
      errorMsg = `${json.message || 'Validierungsfehler'}: ${details}`;
    }
    throw new Error(errorMsg);
  }
  return json;
}

export const api = {
  get: <T>(url: string) => req<T>(url, { method: 'GET' }),
  post: <T>(url: string, body: any) => req<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) => req<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: any) => req<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => req<T>(url, { method: 'DELETE' }),
};
