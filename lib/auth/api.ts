import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

/**
 * Generic API request handler with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Logout user (clears server-side cookies)
   */
  async logout(): Promise<void> {
    await apiRequest<void>('/api/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return apiRequest<User>('/api/auth/me', {
      method: 'GET',
    });
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_at: number }> {
    return apiRequest<{ access_token: string; expires_at: number }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
} as const;

export type AuthApi = typeof authApi;