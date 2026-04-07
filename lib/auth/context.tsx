/**
 * Authentication context and provider
 * Manages authentication state using React Context API with smart caching
 */

'use client';

import React, { createContext, useContext, useCallback, useEffect, useState, useRef } from 'react';
import type { AuthContextValue, AuthState, LoginCredentials, RegisterData, User } from './types';
import { authApi } from './api';
import { logger } from './logger';
import { getCachedUser, setCachedUser, clearCachedUser, isCacheValid } from './cache';

// Create the authentication context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication provider component
 * Wraps the app and provides authentication state and methods
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false, // Start with loading false to avoid hydration issues
    error: null,
  });

  // Track if we've already fetched user to prevent redundant calls
  const hasFetchedRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Fetch current user from API with smart caching
   */
  const refreshUser = useCallback(async (forceRefresh = false): Promise<void> => {
    try {
      // Don't run during server-side rendering
      if (typeof window === 'undefined') {
        logger.debug('Skipping user fetch during SSR');
        return;
      }

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedUser = getCachedUser();
        if (cachedUser) {
          logger.debug('Using cached user', { userId: cachedUser.id });
          setState(prev => ({ ...prev, user: cachedUser, error: null }));
          return;
        }
      }

      // Only fetch if we haven't already fetched or if forcing refresh
      if (!hasFetchedRef.current || forceRefresh) {
        logger.debug('Fetching current user from API');
        const user = await authApi.getCurrentUser();

        // Update state and cache
        setState(prev => ({ ...prev, user, error: null }));
        setCachedUser(user);
        hasFetchedRef.current = true;

        logger.debug('User fetched successfully', { userId: user.id });
      } else {
        logger.debug('Skipping user fetch - already fetched');
      }
    } catch (error) {
      logger.debug('Failed to fetch user', error);
      setState(prev => ({ ...prev, user: null, error: null }));
      clearCachedUser();
      hasFetchedRef.current = true;
    }
  }, []);

  /**
   * Handle component mount - defer auth initialization to prevent hydration issues
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Initialize auth state on mount with smart caching
   */
  useEffect(() => {
    if (!isMounted) return;

    const initializeAuth = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));

        // Check if we have valid cache first
        if (isCacheValid()) {
          logger.debug('Cache is valid, skipping initial fetch');
          await refreshUser(); // This will use cache
        } else {
          logger.debug('No valid cache, fetching user');
          await refreshUser(); // This will fetch from API
        }
      } catch (error) {
        logger.debug('Auth initialization failed', error);
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initializeAuth();
  }, [refreshUser, isMounted]);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logger.info('Attempting login', { email: credentials.email });

      await authApi.login(credentials);
      hasFetchedRef.current = false; // Reset fetch flag to force refresh after login
      await refreshUser(); // This will fetch fresh user data and cache it

      logger.info('Login successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      logger.error('Login failed', error);
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [refreshUser]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterData): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logger.info('Attempting registration', { email: data.email });

      await authApi.register(data);
      hasFetchedRef.current = false; // Reset fetch flag to force refresh after registration
      await refreshUser(); // This will fetch fresh user data and cache it

      logger.info('Registration successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      logger.error('Registration failed', error);
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [refreshUser]);

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      logger.info('Attempting logout');

      await authApi.logout();
      setState(prev => ({ ...prev, user: null }));
      clearCachedUser(); // Clear cache on logout
      hasFetchedRef.current = false; // Reset fetch flag

      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout failed', error);
      // Still clear user state even if API call fails
      setState(prev => ({ ...prev, user: null }));
      clearCachedUser(); // Clear cache even on error
      hasFetchedRef.current = false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const contextValue: AuthContextValue = {
    ...state,
    isAuthenticated: !!state.user,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}