import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const LOCATION_CACHE_KEY = 'user_location_cache';
const LOCATION_MAX_AGE = 5 * 60 * 1000; // 5 minutes
const LOCATION_REFRESH_THRESHOLD = 3 * 60 * 1000; // 3 minutes - trigger background refresh

interface CachedLocation {
  coords: { latitude: number; longitude: number };
  timestamp: number;
}

/**
 * Location Cache Service
 * 
 * Provides instant location access by caching the user's location for 5 minutes.
 * This eliminates the 1.5-7 second delay from GPS + permission requests.
 * 
 * Usage:
 *   const location = await LocationCacheService.getLocationFast();
 */
export class LocationCacheService {
  /**
   * Get location instantly from cache, refresh in background if needed
   * 
   * @returns User's coordinates or null if unavailable
   */
  static async getLocationFast(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // 1. Try cache first (instant!)
      const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const { coords, timestamp }: CachedLocation = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Use cached location if less than 5 minutes old
        if (age < LOCATION_MAX_AGE) {
          console.log(`⚡ [LOCATION] Using cached location (${Math.floor(age/1000)}s old)`);
          
          // Refresh in background if older than 3 minutes
          if (age > LOCATION_REFRESH_THRESHOLD) {
            console.log('🔄 [LOCATION] Triggering background refresh...');
            this.refreshLocationBackground();
          }
          
          return coords;
        } else {
          console.log(`⏱️ [LOCATION] Cache expired (${Math.floor(age/1000)}s old), fetching fresh...`);
        }
      } else {
        console.log('📍 [LOCATION] No cache found, fetching location...');
      }

      // 2. No cache or too old - get fresh location
      return await this.getAndCacheLocation();
    } catch (error) {
      console.error('❌ [LOCATION] Cache error:', error);
      return null;
    }
  }

  /**
   * Get fresh location from GPS and cache it
   */
  private static async getAndCacheLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      console.log('📍 [LOCATION] Requesting permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ [LOCATION] Permission denied');
        return null;
      }

      console.log('📡 [LOCATION] Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low, // Faster, less accurate is fine for venue lists
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      console.log('✅ [LOCATION] Location obtained:', coords);

      // Cache for next time
      await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
        coords,
        timestamp: Date.now()
      } as CachedLocation));

      console.log('💾 [LOCATION] Location cached successfully');

      return coords;
    } catch (error) {
      console.error('❌ [LOCATION] Get location error:', error);
      return null;
    }
  }

  /**
   * Refresh location in background (fire and forget)
   * Does not block the caller
   */
  private static refreshLocationBackground(): void {
    // Fire and forget - don't block anything
    this.getAndCacheLocation().catch((error) => {
      console.error('❌ [LOCATION] Background refresh failed:', error);
    });
  }

  /**
   * Clear cached location (useful for testing or logout)
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
      console.log('🗑️ [LOCATION] Cache cleared');
    } catch (error) {
      console.error('❌ [LOCATION] Clear cache error:', error);
    }
  }

  /**
   * Get cache age in milliseconds
   * Returns Infinity if no cache exists
   */
  static async getCacheAge(): Promise<number> {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const { timestamp }: CachedLocation = JSON.parse(cached);
        return Date.now() - timestamp;
      }
      return Infinity;
    } catch (error) {
      console.error('❌ [LOCATION] Get cache age error:', error);
      return Infinity;
    }
  }
}
