// Frontend authentication utilities for Go backend JWT authentication
import { useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  username?: string;
  family_name?: string;
  given_name?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  family_name?: string;
  given_name?: string;
}

// Simple logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Auth] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Auth] ${message}`, error ? error : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Auth] ${message}`, data ? data : '');
    }
  }
};

// Auth state management
class AuthManager {
  private static instance: AuthManager;
  private currentUser: User | null = null;
  private tokens: AuthTokens | null = null;
  private authListeners: Array<(user: User | null) => void> = [];

  private constructor() {
    // Don't load state immediately - let components handle it
    this.currentUser = null;
    this.tokens = null;
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Load auth state from cookies (HTTP-only cookies are handled automatically)
  private async loadAuthState(): Promise<void> {
    try {
      logger.debug('Loading auth state from cookies');

      // Try to fetch current user from API using cookies
      const user = await this.fetchCurrentUser();
      if (user) {
        this.currentUser = user;
        logger.info('User loaded from API', { userId: user.id });
      } else {
        this.currentUser = null;
        this.tokens = null;
      }
    } catch (error) {
      logger.error('Error loading auth state', error);
      this.currentUser = null;
      this.tokens = null;
    }
  }

  // Save auth state - no-op since we use HTTP-only cookies
  private saveAuthState(): void {
    // No need to save anything - cookies are handled automatically by the browser
    logger.debug('Auth state saved via HTTP-only cookies');
  }

  // Clear auth state
  private async clearAuthState(): Promise<void> {
    logger.info('Clearing auth state');
    this.currentUser = null;
    this.tokens = null;

    // Call logout to clear server-side cookies
    try {
      await this.logout();
    } catch (error) {
      logger.error('Error during logout', error);
    }
  }

  // Notify auth listeners
  private notifyListeners(): void {
    logger.debug('Notifying auth listeners', { user: this.currentUser?.email });
    this.authListeners.forEach(listener => listener(this.currentUser));
  }

  // Subscribe to auth changes
  subscribe(listener: (user: User | null) => void): () => void {
    this.authListeners.push(listener);
    logger.debug('Auth listener subscribed', { totalListeners: this.authListeners.length });
    return () => {
      this.authListeners = this.authListeners.filter(l => l !== listener);
      logger.debug('Auth listener unsubscribed', { totalListeners: this.authListeners.length });
    };
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get auth tokens
  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const authenticated = this.currentUser !== null && this.tokens !== null;
    logger.debug('Checking authentication status', { authenticated });
    return authenticated;
  }

  // Check if access token is expired
  isTokenExpired(): boolean {
    if (!this.tokens) {
      logger.debug('No tokens available, considering expired');
      return true;
    }
    const expired = Date.now() >= this.tokens.expires_at * 1000;
    logger.debug('Checking token expiration', { expired, expiresAt: new Date(this.tokens.expires_at * 1000) });
    return expired;
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    logger.info('Attempting user registration', { email: data.email });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Registration failed', error);
      throw new Error(error.error || 'Registration failed');
    }

    const authData: AuthResponse = await response.json();
    logger.info('Registration successful', { userId: authData.user.id });

    // Update auth state - user data only (tokens in HTTP-only cookies)
    this.currentUser = authData.user;
    this.tokens = {
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      expires_at: authData.expires_at,
    };

    // Don't save to localStorage - use HTTP-only cookies
    this.notifyListeners();

    return authData;
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    logger.info('Attempting user login', { email: credentials.email });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Login failed', error);
      throw new Error(error.error || 'Login failed');
    }

    const authData: AuthResponse = await response.json();
    logger.info('Login successful', { userId: authData.user.id });

    // Update auth state - user data only (tokens in HTTP-only cookies)
    this.currentUser = authData.user;
    this.tokens = {
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      expires_at: authData.expires_at,
    };

    // Don't save to localStorage - use HTTP-only cookies
    this.notifyListeners();

    return authData;
  }

  // Refresh access token
  async refreshToken(): Promise<AuthTokens> {
    logger.debug('Attempting token refresh');

    if (!this.tokens) {
      logger.error('No refresh token available');
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: this.tokens.refresh_token,
      }),
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      logger.error('Token refresh failed', { status: response.status });
      // If refresh fails, clear auth state
      this.logout();
      throw new Error('Token refresh failed');
    }

    const newTokens: AuthTokens = await response.json();
    logger.info('Token refresh successful');

    // Update tokens
    this.tokens = newTokens;
    this.saveAuthState();

    return newTokens;
  }

  // Logout user
  async logout(): Promise<void> {
    logger.info('Attempting user logout');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        logger.error('Logout API call failed', { status: response.status });
      } else {
        logger.info('Logout API call successful');
      }
    } catch (error) {
      logger.error('Logout API call error', error);
    } finally {
      // Clear local auth state regardless of API response
      logger.info('Clearing auth state');
      this.currentUser = null;
      this.tokens = null;
      this.notifyListeners();
    }
  }

  // Get current user from API
  async fetchCurrentUser(): Promise<User> {
    logger.debug('Fetching current user from API');

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      logger.error('Failed to fetch current user', { status: response.status });
      // If unauthorized, clear auth state
      if (response.status === 401) {
        this.logout();
      }
      throw new Error('Failed to fetch current user');
    }

    const user: User = await response.json();
    logger.info('Current user fetched successfully', { userId: user.id });

    this.currentUser = user;
    this.saveAuthState();
    this.notifyListeners();

    return user;
  }

  // Get auth headers for API requests
  getAuthHeaders(): Record<string, string> {
    if (!this.tokens) {
      logger.debug('No tokens available for auth headers');
      return {};
    }

    logger.debug('Generating auth headers');
    return {
      'Authorization': `Bearer ${this.tokens.access_token}`,
    };
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();

// Convenience functions
export const register = (data: RegisterData) => authManager.register(data);
export const login = (credentials: LoginCredentials) => authManager.login(credentials);
export const logout = () => authManager.logout();
export const refreshToken = () => authManager.refreshToken();
export const fetchCurrentUser = () => authManager.fetchCurrentUser();
export const getCurrentUser = () => authManager.getCurrentUser();
export const isAuthenticated = () => authManager.isAuthenticated();
export const getAuthHeaders = () => authManager.getAuthHeaders();
export const subscribe = (listener: (user: User | null) => void) => authManager.subscribe(listener);

// React Hook for authentication
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        setLoading(true);
        // Try to fetch current user from API using cookies
        const currentUser = await authManager.fetchCurrentUser();
        setUser(currentUser);
      } catch (error) {
        logger.error('Failed to load auth state', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();

    // Subscribe to auth changes
    const unsubscribe = authManager.subscribe((newUser) => {
      logger.debug('Auth state changed', { user: newUser?.email });
      setUser(newUser);
    });

    return unsubscribe;
  }, []);

  const loginUser = async (credentials: LoginCredentials) => {
    logger.info('User attempting login');
    setLoading(true);
    try {
      await authManager.login(credentials);
      logger.info('User login successful');
    } catch (error) {
      logger.error('User login failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (data: RegisterData) => {
    logger.info('User attempting registration');
    setLoading(true);
    try {
      await authManager.register(data);
      logger.info('User registration successful');
    } catch (error) {
      logger.error('User registration failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    logger.info('User attempting logout');
    setLoading(true);
    try {
      await authManager.logout();
      logger.info('User logout successful');
    } catch (error) {
      logger.error('User logout failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
  };
}