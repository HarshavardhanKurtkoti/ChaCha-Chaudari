/**
 * Centralized API & Service Configuration
 *
 * Provides normalized base URLs and endpoint helpers so no components
 * hardcode localhost, 127.0.0.1, or static ports.
 */

const getEnv = (key, fallback = '') => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // Ignore in non-Vite environments
  }
  return fallback;
};

// Normalize by removing trailing slashes
const trimTrailingSlash = (url) => (url ? url.replace(/\/+$/, '') : '');

// In Vite development, requests to /api are proxied to Flask (port 5000).
// In production or custom environments, VITE_API_BASE_URL can override this.
const rawApiBase = getEnv('VITE_API_BASE_URL', '');
export const API_BASE_URL = trimTrailingSlash(
  rawApiBase || (typeof window !== 'undefined' && window.location.origin ? '' : 'http://127.0.0.1:5000')
);

// TTS microservice (port 6001 default)
export const TTS_BASE_URL = trimTrailingSlash(
  getEnv('VITE_TTS_BASE_URL', 'http://127.0.0.1:6001')
);

// Helper to construct fully-qualified API URLs
export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    // Use relative path (proxied by Vite in dev or served together in prod)
    return cleanEndpoint;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
};

// Helper to construct TTS URLs
export const getTtsUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${TTS_BASE_URL}${cleanEndpoint}`;
};

export default {
  API_BASE_URL,
  TTS_BASE_URL,
  getApiUrl,
  getTtsUrl,
};

