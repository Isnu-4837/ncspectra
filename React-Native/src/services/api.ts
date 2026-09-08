const API_BASE_URL = 'https://ncspectra.onrender.com';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

const fetchWithConfig = async (endpoint: string, options: RequestOptions = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.detail || data?.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${options.method || 'GET'} ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  get: (endpoint: string, headers?: Record<string, string>) => 
    fetchWithConfig(endpoint, { method: 'GET', headers }),

  post: (endpoint: string, body: any, headers?: Record<string, string>) => 
    fetchWithConfig(endpoint, { method: 'POST', body, headers }),

  put: (endpoint: string, body: any, headers?: Record<string, string>) => 
    fetchWithConfig(endpoint, { method: 'PUT', body, headers }),

  delete: (endpoint: string, headers?: Record<string, string>) => 
    fetchWithConfig(endpoint, { method: 'DELETE', headers }),

  // Specific sync route for offline records
  syncRecords: async (encryptedLogs: any[]) => {
    return fetchWithConfig('/api/records/sync', {
      method: 'POST',
      body: { records: encryptedLogs }
    });
  }
};