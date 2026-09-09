import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const apiClient = {
  async request(endpoint: string, method: string, data?: any, token?: string) {
    const activeToken = token || authToken;
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}),
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });

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
