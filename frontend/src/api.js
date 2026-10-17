const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const TOKEN_KEY = 'rb_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check that the backend is running.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

// The list endpoint returns camelCase; the search endpoint returns raw ES documents (snake_case).
export const normalizeEmail = (r) => ({
  id: r.id,
  to: r.to ?? r.to_email,
  subject: r.subject,
  body: r.body ?? '',
  from: r.from ?? null,
  status: r.status,
  scheduledAt: r.scheduledAt ?? r.scheduled_at,
  sentAt: r.sentAt ?? r.sent_at,
  previewUrl: r.previewUrl ?? r.preview_url ?? null,
  error: r.error ?? null,
});

export const fetchEmails = async (status, q) => {
  const path = q
    ? `/api/emails/search?status=${status}&q=${encodeURIComponent(q)}`
    : `/api/emails?status=${status}&limit=100`;
  const data = await api(path);
  return data.items.map(normalizeEmail);
};

export const scheduleEmails = (payload) => api('/api/emails/schedule', { method: 'POST', body: payload });

export const fetchCounts = () => api('/api/emails/counts');
