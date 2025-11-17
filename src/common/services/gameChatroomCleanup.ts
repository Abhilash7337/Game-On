/**
 * Game Chatroom Cleanup Service
 * 
 * Client-side backup cleanup for expired game chatrooms.
 * Primary cleanup happens via database scheduled job (pg_cron),
 * but this provides immediate cleanup when user opens the app.
 */

import { supabase } from './supabase';

export class GameChatroomCleanupService {
  /**
   * Manually trigger cleanup of expired chatrooms
   * Calls the database function that does the actual deletion
   * 
   * @returns Stats about what was deleted
   */
  static async cleanupExpiredChatrooms(): Promise<{
    success: boolean;
    conversationsDeleted: number;
    messagesDeleted: number;
    participantsDeleted: number;
    error?: string;
  }> {
    try {
      console.log('🧹 [CLEANUP] Checking for expired game chatrooms...');

      // Call the database function that does the cleanup
      const { data, error } = await supabase.rpc('delete_expired_game_chatrooms');

      if (error) {
        console.error('❌ [CLEANUP] Error:', error);
        return {
          success: false,
          conversationsDeleted: 0,
          messagesDeleted: 0,
          participantsDeleted: 0,
          error: error.message
        };
      }

      // data is an array with one row: {deleted_conversations, deleted_messages, deleted_participants}
      const result = data[0];
      
      if (result.deleted_conversations > 0) {
        console.log(`✅ [CLEANUP] Deleted ${result.deleted_conversations} expired chatrooms`);
        console.log(`   - ${result.deleted_messages} messages removed`);
        console.log(`   - ${result.deleted_participants} participants removed`);
      } else {
        console.log('✨ [CLEANUP] No expired chatrooms found');
      }

      return {
        success: true,
        conversationsDeleted: result.deleted_conversations || 0,
        messagesDeleted: result.deleted_messages || 0,
        participantsDeleted: result.deleted_participants || 0
      };
    } catch (error) {
      console.error('❌ [CLEANUP] Unexpected error:', error);
      return {
        success: false,
        conversationsDeleted: 0,
        messagesDeleted: 0,
        participantsDeleted: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get list of chatrooms that will expire soon
   * Useful for UI warnings ("This chat will be deleted in 30 minutes")
   * 
   * @param userId - Current user ID to filter their chatrooms
   * @returns List of expiring chatrooms with time remaining
   */
  static async getExpiringChatrooms(userId: string): Promise<Array<{
    conversationId: string;
    name: string;
    expiresAt: Date;
    minutesUntilDeletion: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          name,
          expires_at,
          conversation_participants!inner(user_id)
        `)
        .eq('type', 'game_chat')
        .eq('conversation_participants.user_id', userId)
        .not('expires_at', 'is', null)
        .gt('expires_at', new Date().toISOString()) // Only future expirations
        .order('expires_at', { ascending: true });

      if (error) {
        console.error('❌ [CLEANUP] Error fetching expiring chatrooms:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(chat => {
        const expiresAt = new Date(chat.expires_at);
        const now = new Date();
        const minutesUntilDeletion = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));

        return {
          conversationId: chat.id,
          name: chat.name,
          expiresAt,
          minutesUntilDeletion
        };
      });
    } catch (error) {
      console.error('❌ [CLEANUP] Error in getExpiringChatrooms:', error);
      return [];
    }
  }

  /**
   * Check if a specific chatroom is expired
   * 
   * @param conversationId - Conversation ID to check
   * @returns true if expired, false otherwise
   */
  static async isExpired(conversationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('expires_at')
        .eq('id', conversationId)
        .single();

      if (error || !data) {
        return false;
      }

      if (!data.expires_at) {
        return false; // No expiry set (shouldn't happen for game chats)
      }

      const expiresAt = new Date(data.expires_at);
      const now = new Date();

      return now > expiresAt;
    } catch (error) {
      console.error('❌ [CLEANUP] Error checking expiry:', error);
      return false;
    }
  }

  /**
   * Manually delete a specific chatroom (for admin/testing)
   * WARNING: This permanently deletes all messages and data!
   * 
   * @param conversationId - Conversation ID to delete
   */
  static async manuallyDeleteChatroom(conversationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log(`🗑️ [CLEANUP] Manually deleting chatroom ${conversationId}...`);

      const { error } = await supabase.rpc('cleanup_game_chatroom', {
        p_conversation_id: conversationId
      });

      if (error) {
        console.error('❌ [CLEANUP] Manual delete error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [CLEANUP] Chatroom deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ [CLEANUP] Unexpected error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Auto-cleanup on app startup
   * Call this from your root component or when social tab is opened
   * 
   * @param silent - If true, suppress console logs (for background cleanup)
   */
  static async autoCleanup(silent: boolean = false): Promise<void> {
    try {
      if (!silent) {
        console.log('🔄 [CLEANUP] Running auto-cleanup on app startup...');
      }

      const result = await this.cleanupExpiredChatrooms();

      if (!silent && result.conversationsDeleted > 0) {
        console.log(`✨ [CLEANUP] Auto-cleanup complete: ${result.conversationsDeleted} chatrooms removed`);
      }
    } catch (error) {
      if (!silent) {
        console.error('❌ [CLEANUP] Auto-cleanup failed:', error);
      }
    }
  }
}
