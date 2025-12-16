import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './supabase';

interface CachedMessage extends Message {
  // Cached messages store ISO string for timestamp comparison
  timestampStr?: string;
}

interface CachedConversation {
  messages: CachedMessage[];
  lastFetchedAt: string;
  lastMessageTimestamp: string | null;
}

interface CacheMetadata {
  conversationId: string;
  messageCount: number;
  lastFetchedAt: string;
  lastMessageTimestamp: string | null;
}

class MessageCacheService {
  private static readonly CACHE_PREFIX = '@message_cache_';
  private static readonly METADATA_KEY = '@message_cache_metadata';
  private static readonly CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
  private static readonly MAX_MESSAGES_PER_CONVERSATION = 50;

  // In-memory cache for currently active conversation (instant access)
  private inMemoryCache: Map<string, CachedConversation> = new Map();

  /**
   * Get cache key for a conversation
   */
  private getCacheKey(conversationId: string): string {
    return `${MessageCacheService.CACHE_PREFIX}${conversationId}`;
  }

  /**
   * Get messages from cache (checks in-memory first, then AsyncStorage)
   */
  async getCachedMessages(conversationId: string): Promise<{
    messages: Message[];
    lastMessageTimestamp: string | null;
    isCacheValid: boolean;
  }> {
    try {
      // Check in-memory cache first (instant)
      const memoryCache = this.inMemoryCache.get(conversationId);
      if (memoryCache) {
        const isFresh = this.isCacheFresh(memoryCache.lastFetchedAt);
        console.log(`💾 [CACHE] In-memory hit for ${conversationId}: ${memoryCache.messages.length} messages, fresh: ${isFresh}`);
        return {
          messages: memoryCache.messages,
          lastMessageTimestamp: memoryCache.lastMessageTimestamp,
          isCacheValid: isFresh
        };
      }

      // Check AsyncStorage
      const cacheKey = this.getCacheKey(conversationId);
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (!cachedData) {
        console.log(`📭 [CACHE] No cache for ${conversationId}`);
        return { messages: [], lastMessageTimestamp: null, isCacheValid: false };
      }

      const cached: CachedConversation = JSON.parse(cachedData);
      const isFresh = this.isCacheFresh(cached.lastFetchedAt);

      // Load into in-memory cache for next access
      this.inMemoryCache.set(conversationId, cached);

      console.log(`💾 [CACHE] AsyncStorage hit for ${conversationId}: ${cached.messages.length} messages, fresh: ${isFresh}`);
      return {
        messages: cached.messages,
        lastMessageTimestamp: cached.lastMessageTimestamp,
        isCacheValid: isFresh
      };
    } catch (error) {
      console.error('❌ [CACHE] Error reading cache:', error);
      return { messages: [], lastMessageTimestamp: null, isCacheValid: false };
    }
  }

  /**
   * Save messages to cache (both in-memory and AsyncStorage)
   */
  async cacheMessages(
    conversationId: string,
    messages: Message[],
    append: boolean = false
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Sort messages by timestamp (newest last)
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let finalMessages = sortedMessages;

      // If appending, merge with existing cache
      if (append) {
        const existing = await this.getCachedMessages(conversationId);
        if (existing.messages.length > 0) {
          // Merge and deduplicate by message ID
          const messageMap = new Map<string, Message>();
          
          // Add existing messages
          existing.messages.forEach(msg => messageMap.set(msg.id, msg));
          
          // Add new messages (overwrites if same ID)
          sortedMessages.forEach(msg => messageMap.set(msg.id, msg));
          
          // Convert back to array and sort
          finalMessages = Array.from(messageMap.values()).sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        }
      }

      // Keep only last N messages (most recent)
      if (finalMessages.length > MessageCacheService.MAX_MESSAGES_PER_CONVERSATION) {
        finalMessages = finalMessages.slice(-MessageCacheService.MAX_MESSAGES_PER_CONVERSATION);
      }

      const lastMessageTimestamp = finalMessages.length > 0 
        ? finalMessages[finalMessages.length - 1].timestamp.toISOString()
        : null;

      const cacheData: CachedConversation = {
        messages: finalMessages,
        lastFetchedAt: now,
        lastMessageTimestamp
      };

      // Save to in-memory cache
      this.inMemoryCache.set(conversationId, cacheData);

      // Save to AsyncStorage
      const cacheKey = this.getCacheKey(conversationId);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

      // Update metadata
      await this.updateMetadata(conversationId, finalMessages.length, now, lastMessageTimestamp);

      console.log(`✅ [CACHE] Saved ${finalMessages.length} messages for ${conversationId}`);
    } catch (error) {
      console.error('❌ [CACHE] Error saving cache:', error);
    }
  }

  /**
   * Check if cache is fresh (within TTL)
   */
  private isCacheFresh(lastFetchedAt: string): boolean {
    const fetchedTime = new Date(lastFetchedAt).getTime();
    const now = Date.now();
    return (now - fetchedTime) < MessageCacheService.CACHE_TTL_MS;
  }

  /**
   * Update cache metadata (for cleanup and monitoring)
   */
  private async updateMetadata(
    conversationId: string,
    messageCount: number,
    lastFetchedAt: string,
    lastMessageTimestamp: string | null
  ): Promise<void> {
    try {
      const metadataStr = await AsyncStorage.getItem(MessageCacheService.METADATA_KEY);
      const metadata: Record<string, CacheMetadata> = metadataStr ? JSON.parse(metadataStr) : {};

      metadata[conversationId] = {
        conversationId,
        messageCount,
        lastFetchedAt,
        lastMessageTimestamp
      };

      await AsyncStorage.setItem(MessageCacheService.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('❌ [CACHE] Error updating metadata:', error);
    }
  }

  /**
   * Clear cache for specific conversation
   */
  async clearConversationCache(conversationId: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(conversationId);
      await AsyncStorage.removeItem(cacheKey);
      this.inMemoryCache.delete(conversationId);
      console.log(`🗑️ [CACHE] Cleared cache for ${conversationId}`);
    } catch (error) {
      console.error('❌ [CACHE] Error clearing cache:', error);
    }
  }

  /**
   * Clear all message caches (call on logout)
   */
  async clearAllCache(): Promise<void> {
    try {
      console.log('🗑️ [CACHE] Clearing all message caches...');
      
      // Get all cache keys
      const metadataStr = await AsyncStorage.getItem(MessageCacheService.METADATA_KEY);
      if (metadataStr) {
        const metadata: Record<string, CacheMetadata> = JSON.parse(metadataStr);
        const keys = Object.keys(metadata).map(id => this.getCacheKey(id));
        keys.push(MessageCacheService.METADATA_KEY);
        
        await AsyncStorage.multiRemove(keys);
      }

      // Clear in-memory cache
      this.inMemoryCache.clear();
      
      console.log('✅ [CACHE] All message caches cleared');
    } catch (error) {
      console.error('❌ [CACHE] Error clearing all caches:', error);
    }
  }

  /**
   * Clean up stale caches (older than TTL)
   */
  async cleanupStaleCaches(): Promise<void> {
    try {
      const metadataStr = await AsyncStorage.getItem(MessageCacheService.METADATA_KEY);
      if (!metadataStr) return;

      const metadata: Record<string, CacheMetadata> = JSON.parse(metadataStr);
      const now = Date.now();
      const keysToRemove: string[] = [];
      const updatedMetadata: Record<string, CacheMetadata> = {};

      for (const [conversationId, meta] of Object.entries(metadata)) {
        const fetchedTime = new Date(meta.lastFetchedAt).getTime();
        const age = now - fetchedTime;

        if (age > MessageCacheService.CACHE_TTL_MS) {
          // Stale - mark for removal
          keysToRemove.push(this.getCacheKey(conversationId));
          this.inMemoryCache.delete(conversationId);
        } else {
          // Still fresh - keep
          updatedMetadata[conversationId] = meta;
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        await AsyncStorage.setItem(MessageCacheService.METADATA_KEY, JSON.stringify(updatedMetadata));
        console.log(`🧹 [CACHE] Cleaned up ${keysToRemove.length} stale caches`);
      }
    } catch (error) {
      console.error('❌ [CACHE] Error cleaning up stale caches:', error);
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  async getCacheStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    inMemoryCount: number;
    oldestCache: string | null;
    newestCache: string | null;
  }> {
    try {
      const metadataStr = await AsyncStorage.getItem(MessageCacheService.METADATA_KEY);
      if (!metadataStr) {
        return {
          totalConversations: 0,
          totalMessages: 0,
          inMemoryCount: this.inMemoryCache.size,
          oldestCache: null,
          newestCache: null
        };
      }

      const metadata: Record<string, CacheMetadata> = JSON.parse(metadataStr);
      const timestamps = Object.values(metadata).map(m => new Date(m.lastFetchedAt).getTime());

      return {
        totalConversations: Object.keys(metadata).length,
        totalMessages: Object.values(metadata).reduce((sum, m) => sum + m.messageCount, 0),
        inMemoryCount: this.inMemoryCache.size,
        oldestCache: timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : null,
        newestCache: timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null
      };
    } catch (error) {
      console.error('❌ [CACHE] Error getting cache stats:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        inMemoryCount: 0,
        oldestCache: null,
        newestCache: null
      };
    }
  }

  /**
   * Preload conversation cache into memory (call when navigating to chat)
   */
  async preloadIntoMemory(conversationId: string): Promise<void> {
    // This will load from AsyncStorage into memory if not already there
    await this.getCachedMessages(conversationId);
  }

  /**
   * Remove conversation from in-memory cache (call when leaving chat screen)
   */
  unloadFromMemory(conversationId: string): void {
    this.inMemoryCache.delete(conversationId);
  }
}

// Export singleton instance
export default new MessageCacheService();
