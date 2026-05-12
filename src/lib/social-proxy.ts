/**
 * social-proxy.ts — Transparent proxy from Olympus MC to social-app service.
 *
 * All social-app API calls from the browser hit Olympus MC routes (/api/social/*)
 * which forward to http://127.0.0.1:3848/api/social/*.
 * No business logic here — just proxy + auth token injection.
 */

const SOCIAL_APP_BASE = 'http://127.0.0.1:3848/api/social';
const SOCIAL_APP_TOKEN = process.env.SOCIAL_APP_TOKEN || '';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

export interface ProxyOptions {
  method?: RequestMethod;
  body?: unknown;
  params?: Record<string, string>;
}

/**
 * Forward a request to the social-app service.
 * Injects the service auth token server-side.
 */
export async function proxyToSocialApp(
  path: string,
  options: ProxyOptions = {}
): Promise<Response> {
  const { method = 'GET', body, params } = options;

  let url = `${SOCIAL_APP_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (SOCIAL_APP_TOKEN) {
    headers['Authorization'] = `Bearer ${SOCIAL_APP_TOKEN}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  return fetch(url, fetchOptions);
}

/**
 * Helper: proxy and return parsed JSON.
 * Throws on non-2xx responses.
 */
export async function proxySocialJson<T = unknown>(
  path: string,
  options: ProxyOptions = {}
): Promise<T> {
  const response = await proxyToSocialApp(path, options);
  const data = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(data?.error || 'Social app error'), {
      status: response.status,
      data,
    });
  }
  return data as T;
}
