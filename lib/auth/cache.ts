/**
 * Authentication caching utilities
 * Implements smart caching to reduce redundant API calls
 */

import type { User } from './types';
import { logger } from './logger';

const CACHE_KEY = 'auth:user';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface CachedUser {
  user: User | null;
  timestamp: number;
}

/**
 * Get cached user data
 */
export function getCachedUser(): User | null {
  try {
    if (typeof window === 'undefined') return null;

    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { user, timestamp }: CachedUser = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp < CACHE_TTL) {
      logger.debug('User loaded from cache', { userId: user?.id });
      return user;
    }

    // Cache expired, remove it
    logger.debug('Cache expired, clearing');
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    logger.error('Error loading cached user', error);
    // Clear potentially corrupted cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  }
}

/**
 * Cache user data
 */
export function setCachedUser(user: User | null): void {
  try {
    if (typeof window === 'undefined') return;

    const cacheData: CachedUser = {
      user,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    logger.debug('User cached', { userId: user?.id });
  } catch (error) {
    logger.error('Error caching user', error);
  }
}

/**
 * Clear cached user data
 */
export function clearCachedUser(): void {
  try {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(CACHE_KEY);
    logger.debug('User cache cleared');
  } catch (error) {
    logger.error('Error clearing cached user', error);
  }
}

/**
 * Check if cache is still valid (without loading data)
 */
export function isCacheValid(): boolean {
  try {
    if (typeof window === 'undefined') return false;

    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const { timestamp }: { timestamp: number } = JSON.parse(cached);
    const now = Date.now();

    return now - timestamp < CACHE_TTL;
  } catch {
    return false;
  }
}