import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const env =
  (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env;

const getApiBaseUrl = (): string => {
  if (env?.EXPO_PUBLIC_API_BASE_URL) {
    return env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }

  // Get the host IP address of the machine running Metro bundler (e.g. 10.147.107.168)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.developer?.tool;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000/api`;
    }
  }

  // Fallback for Android emulator (10.0.2.2 is the Android alias for host's localhost)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }

  return 'http://localhost:8000/api';
};

const BASE_URL = getApiBaseUrl();
console.log('[NCSpectra API] Connected to backend at:', BASE_URL);

const TOKEN_STORAGE_KEY = 'ncspectra_auth_token';
const REQUEST_TIMEOUT_MS = 10000;

let authToken: string | null = null;

/**
 * Cross-platform token storage. expo-secure-store has no web implementation,
 * so we fall back to localStorage there. Anywhere SecureStore throws
 * (e.g. unsupported platform) we fail soft rather than crashing auth flow.
 */
const tokenStorage = {
  async set(token: string) {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(TOKEN_STORAGE_KEY, token);
        }
        return;
      }
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    } catch (err) {
      console.warn('[NCSpectra API] Failed to persist auth token:', err);
    }
  },

  async delete() {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    } catch (err) {
      console.warn('[NCSpectra API] Failed to clear auth token:', err);
    }
  },

  async get(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(TOKEN_STORAGE_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    } catch (err) {
      console.warn('[NCSpectra API] Failed to read stored auth token:', err);
      return null;
    }
  },
};

/**
 * Sets the in-memory token immediately (so subsequent requests in this
 * session use it right away) and persists it in the background.
 * Kept synchronous so existing call sites don't need to change.
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    void tokenStorage.set(token);
  } else {
    void tokenStorage.delete();
  }
};

export const getAuthToken = () => authToken;

/**
 * Call once during app startup (before rendering the authenticated part of
 * the tree) to restore a previously persisted session. Returns the restored
 * token, or null if there wasn't one / it couldn't be read.
 */
export const loadStoredToken = async (): Promise<string | null> => {
  const token = await tokenStorage.get();
  authToken = token;
  return token;
};

export const apiClient = {
  async request(endpoint: string, method: string, data?: any, token?: string) {
    const activeToken = token || authToken;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}),
        },
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error('Request timed out. The server may be waking up — please try again.');
      }
      // Covers CORS blocks, DNS failures, offline device, etc. — the browser
      // and RN's fetch both surface these as an opaque TypeError with no
      // useful detail, so we replace it with something actionable.
      throw new Error('Unable to reach the server. Check your connection and try again.');
    } finally {
      clearTimeout(timeoutId);
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.detail || payload?.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return payload;
  },

  async get(endpoint: string, token?: string) {
    return await this.request(endpoint, 'GET', undefined, token);
  },

  async post(endpoint: string, data?: any, token?: string) {
    return await this.request(endpoint, 'POST', data, token);
  },

  async put(endpoint: string, data?: any, token?: string) {
    return await this.request(endpoint, 'PUT', data, token);
  }
};

export const authApi = {
  async login(badgeNumber: string, passcode: string) {
    const res = await apiClient.post('/auth/login', {
      badge_number: badgeNumber,
      passcode: passcode
    });
    if (res?.access_token) {
      setAuthToken(res.access_token);
    }
    return res;
  }
};

export const recordsApi = {
  async list(limit = 20) {
    return await apiClient.get(`/records/?limit=${limit}`);
  },

  async create(data: {
    reagent_name: string;
    location: string;
    live_location?: string;
    image_name?: string;
    status: string;
    compound_name: string;
    match_score: string;
    accent_color?: string;
    evidence_seal?: string;
    sha256?: string;
    lat?: number;
    lng?: number;
    location_label?: string;
  }) {
    return await apiClient.post('/records/', data);
  }
};

export const reagentsApi = {
  async list() {
    return await apiClient.get('/reagents/');
  }
};

export const dashboardApi = {
  async summary() {
    return await apiClient.get('/dashboard/summary');
  }
};