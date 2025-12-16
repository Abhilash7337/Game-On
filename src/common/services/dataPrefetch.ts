/**
 * Global Data Prefetch Service
 * 
 * Prefetches all heavy data during login/splash screen to enable instant screen loads.
 * Implements cache-first strategy with automatic refresh.
 */

import { ConversationService } from './conversationService'; // ✅ NEW: Supabase-based conversations
import { FriendService } from './friendService';
import { LocationCacheService } from './locationCache'; // ✅ NEW: Fast cached location
import { SportGroupService } from './sportGroupService';
import { supabase } from './supabase';
import { VenueStorageService } from './venueStorage';

interface PrefetchedData {
  // Courts screen data
  venues: any[];
  userLocation: { latitude: number; longitude: number } | null;
  
  // Social screen data
  friends: any[];
  globalSportGroups: any[]; // Includes { ...SportGroup, name: string, isMember: boolean }
  citySportGroups: any[]; // Includes { ...SportGroup, name: string, isMember: boolean }
  gameChatrooms: any[];
  
  // User context
  userCity: string;
  userId: string | null;
  
  // Metadata
  fetchedAt: Date;
}

class DataPrefetchService {
  private cache: PrefetchedData | null = null;
  private isFetching: boolean = false;
  private fetchPromise: Promise<void> | null = null;

  /**
   * Prefetch ALL data in parallel
   * Call this during login animation or splash screen
   */
  async prefetchAll(): Promise<void> {
    if (this.isFetching) {
      // Already fetching, return existing promise
      return this.fetchPromise!;
    }

    this.isFetching = true;
    this.fetchPromise = this._performPrefetch();
    
    try {
      await this.fetchPromise;
    } finally {
      this.isFetching = false;
      this.fetchPromise = null;
    }
  }

  private async _performPrefetch(): Promise<void> {
    console.log('🚀 [PREFETCH] Starting global data prefetch...');
    const startTime = Date.now();

    try {
      // Get user context first (needed for personalized queries)
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;
      const userCity = 'Hyderabad'; // TODO: Get from user profile when available

      console.log(`👤 [PREFETCH] User ID: ${userId}, City: ${userCity}`);

      // Run ALL queries in parallel (no sequential bottlenecks!)
      const [
        venuesResult,
        locationResult,
        friendsResult,
        globalGroupsResult,
        cityGroupsResult,
        chatroomsResult
      ] = await Promise.allSettled([
        // Courts screen data - USE getPublicVenues() to include sport types from courts!
        VenueStorageService.getPublicVenues(),
        LocationCacheService.getLocationFast(), // ✅ OPTIMIZED: Use cached location (instant!)
        
        // Social screen data
        FriendService.getFriends(),
        SportGroupService.getGlobalSportGroups(),
        SportGroupService.getCitySportGroups(userCity),
        userId ? ConversationService.getUserGameChats(userId) : Promise.resolve([]) // ✅ CHANGED: Use Supabase conversations
      ]);

      // Extract base data
      const globalGroups = globalGroupsResult.status === 'fulfilled' ? globalGroupsResult.value : [];
      const cityGroups = cityGroupsResult.status === 'fulfilled' ? cityGroupsResult.value : [];

      // ✅ OPTIMIZED: Batch membership check - single database query instead of N queries!
      let globalWithMembership = globalGroups;
      let cityWithMembership = cityGroups;

      if (userId && (globalGroups.length > 0 || cityGroups.length > 0)) {
        console.log(`🔍 [PREFETCH] Batch checking membership for ${globalGroups.length + cityGroups.length} sport groups...`);
        const membershipStartTime = Date.now();

        // Collect all conversation IDs
        const allConversationIds = [
          ...globalGroups.map(g => g.conversationId),
          ...cityGroups.map(g => g.conversationId)
        ];

        // Single query to check ALL memberships at once! 🚀
        const membershipSet = await SportGroupService.batchCheckMemberships(userId, allConversationIds);

        // Add membership flags in memory (no database calls!)
        globalWithMembership = globalGroups.map(group => ({
          ...group,
          name: group.displayName,
          isMember: membershipSet.has(group.conversationId)
        }));

        cityWithMembership = cityGroups.map(group => ({
          ...group,
          name: group.displayName,
          isMember: membershipSet.has(group.conversationId)
        }));

        const membershipDuration = Date.now() - membershipStartTime;
        console.log(`✅ [PREFETCH] Batch membership check completed in ${membershipDuration}ms (${membershipSet.size} memberships found)`);
      }

      // Extract successful results (failures don't break the cache)
      this.cache = {
        venues: venuesResult.status === 'fulfilled' ? venuesResult.value : [],
        userLocation: locationResult.status === 'fulfilled' ? locationResult.value : null,
        friends: friendsResult.status === 'fulfilled' && friendsResult.value.success 
          ? friendsResult.value.friends || [] 
          : [],
        globalSportGroups: globalWithMembership,
        citySportGroups: cityWithMembership,
        gameChatrooms: chatroomsResult.status === 'fulfilled' ? chatroomsResult.value : [],
        userCity,
        userId,
        fetchedAt: new Date()
      };

      const duration = Date.now() - startTime;
      console.log(`✅ [PREFETCH] Completed in ${duration}ms`);
      console.log(`📦 [PREFETCH] Cached:`, {
        venues: this.cache.venues.length,
        friends: this.cache.friends.length,
        globalGroups: this.cache.globalSportGroups.length,
        cityGroups: this.cache.citySportGroups.length,
        chatrooms: this.cache.gameChatrooms.length,
        hasLocation: !!this.cache.userLocation
      });

    } catch (error) {
      console.error('❌ [PREFETCH] Error:', error);
      // Don't throw - screens should still work without cache
      // They'll just fall back to loading fresh data
    }
  }

  /**
   * Get cached data (screens should call this first)
   * Returns null if no cache available
   */
  getCache(): PrefetchedData | null {
    return this.cache;
  }

  /**
   * Check if cached data is still fresh
   * Data is considered fresh if < 5 minutes old
   */
  isCacheFresh(): boolean {
    if (!this.cache) return false;
    
    const age = Date.now() - this.cache.fetchedAt.getTime();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    return age < maxAge;
  }

  /**
   * Get cache age in milliseconds
   */
  getCacheAge(): number {
    if (!this.cache) return Infinity;
    return Date.now() - this.cache.fetchedAt.getTime();
  }

  /**
   * Clear all cached data (call on logout)
   */
  clearCache(): void {
    console.log('🗑️ [PREFETCH] Clearing cache...');
    this.cache = null;
  }

  /**
   * Refresh specific data types without full prefetch
   */
  async refreshVenues(): Promise<void> {
    if (!this.cache) {
      console.warn('[PREFETCH] No cache to refresh');
      return;
    }

    console.log('🔄 [PREFETCH] Refreshing venues...');
    try {
      this.cache.venues = await VenueStorageService.getPublicVenues();
      this.cache.fetchedAt = new Date();
      console.log(`✅ [PREFETCH] Venues refreshed (${this.cache.venues.length} items)`);
    } catch (error) {
      console.error('❌ [PREFETCH] Venue refresh failed:', error);
    }
  }

  async refreshFriends(): Promise<void> {
    if (!this.cache) {
      console.warn('[PREFETCH] No cache to refresh');
      return;
    }

    console.log('🔄 [PREFETCH] Refreshing friends...');
    try {
      const { success, friends } = await FriendService.getFriends();
      if (success && friends) {
        this.cache.friends = friends;
        this.cache.fetchedAt = new Date();
        console.log(`✅ [PREFETCH] Friends refreshed (${friends.length} items)`);
      }
    } catch (error) {
      console.error('❌ [PREFETCH] Friends refresh failed:', error);
    }
  }

  async refreshLocation(): Promise<void> {
    if (!this.cache) {
      console.warn('[PREFETCH] No cache to refresh');
      return;
    }

    console.log('🔄 [PREFETCH] Refreshing location...');
    try {
      this.cache.userLocation = await LocationCacheService.getLocationFast();
      this.cache.fetchedAt = new Date();
      console.log('✅ [PREFETCH] Location refreshed');
    } catch (error) {
      console.error('❌ [PREFETCH] Location refresh failed:', error);
    }
  }

  /**
   * Debug: Print cache status
   */
  printCacheStatus(): void {
    if (!this.cache) {
      console.log('📊 [PREFETCH] No cache available');
      return;
    }

    const age = this.getCacheAge();
    const ageSeconds = Math.floor(age / 1000);
    const isFresh = this.isCacheFresh();

    console.log('📊 [PREFETCH] Cache Status:', {
      age: `${ageSeconds}s`,
      fresh: isFresh,
      venues: this.cache.venues.length,
      friends: this.cache.friends.length,
      location: !!this.cache.userLocation,
      userId: this.cache.userId,
      userCity: this.cache.userCity
    });
  }
}

// Export singleton instance
export const dataPrefetchService = new DataPrefetchService();
