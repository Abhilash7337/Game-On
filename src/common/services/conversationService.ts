/**
 * ✅ PRODUCTION-READY Conversation Service
 * Fetches game chats from Supabase conversations table
 * Real-time sync, multi-device support, auto-created by database trigger
 */

export interface GameConversation {
  id: string;
  type: 'game_chat';
  name: string;
  created_by: string;
  booking_id: string;
  created_at: string;
  updated_at: string;
  metadata: {
    booking_id: string;
    venue: string;
    court: string;
    date: string;
    time: string;
    duration: number; // hours
    sport: string;
    booking_type: 'open' | 'private';
    is_open_game: boolean;
  };
  participant_count?: number;
  is_participant?: boolean;
}

export interface GameConversationDisplay {
  id: string;
  conversationId: string;
  bookingId: string;
  venue: string;
  court: string;
  sport: string;
  date: string; // Formatted: "Today", "Tomorrow", or "Nov 6"
  time: string;
  duration: string; // e.g., "3 hours"
  isHost: boolean;
  isOpenGame: boolean;
  participants: number;
  createdAt: Date;
}

class ConversationServiceClass {
  /**
   * Get all game chat conversations for the current user
   */
  async getUserGameChats(userId: string): Promise<GameConversationDisplay[]> {
    try {
      const { supabase } = await import('./supabase');

      // Fetch all game_chat conversations where user is a participant
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id, is_active)
        `)
        .eq('type', 'game_chat')
        .eq('conversation_participants.user_id', userId)
        .eq('conversation_participants.is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [CONVERSATIONS] Error fetching game chats:', error);
        return [];
      }

      if (!conversations || conversations.length === 0) {
        console.log('💬 [CONVERSATIONS] No game chats found for user');
        return [];
      }

      // Get participant counts for each conversation
      const conversationIds = conversations.map(c => c.id);
      const { data: participantCounts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds)
        .eq('is_active', true);

      const countMap = new Map<string, number>();
      participantCounts?.forEach(p => {
        countMap.set(p.conversation_id, (countMap.get(p.conversation_id) || 0) + 1);
      });

      const formatted = conversations.map(conv => 
        this.formatConversationForDisplay(conv, userId, countMap.get(conv.id) || 1)
      );

      console.log(`💬 [CONVERSATIONS] Loaded ${formatted.length} game chats for user`);
      return formatted;
    } catch (error) {
      console.error('❌ [CONVERSATIONS] Error in getUserGameChats:', error);
      return [];
    }
  }

  /**
   * Get a specific game chat conversation by booking ID
   */
  async getConversationByBookingId(bookingId: string, userId: string): Promise<GameConversationDisplay | null> {
    try {
      const { supabase } = await import('./supabase');

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id, is_active)
        `)
        .eq('type', 'game_chat')
        .eq('booking_id', bookingId)
        .eq('conversation_participants.user_id', userId)
        .eq('conversation_participants.is_active', true)
        .single();

      if (error || !data) {
        console.log('💬 [CONVERSATIONS] No conversation found for booking:', bookingId);
        return null;
      }

      // Get participant count
      const { count } = await supabase
        .from('conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', data.id)
        .eq('is_active', true);

      return this.formatConversationForDisplay(data, userId, count || 1);
    } catch (error) {
      console.error('❌ [CONVERSATIONS] Error in getConversationByBookingId:', error);
      return null;
    }
  }

  /**
   * Join an open game conversation
   */
  async joinConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { supabase } = await import('./supabase');

      // Check if conversation is an open game
      const { data: conversation } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .eq('type', 'game_chat')
        .single();

      if (!conversation?.metadata?.is_open_game) {
        console.warn('⚠️ [CONVERSATIONS] Cannot join: not an open game');
        return false;
      }

      // Add user as participant
      const { error } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          joined_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        // Check if user already joined (unique constraint violation)
        if (error.code === '23505') {
          console.log('ℹ️ [CONVERSATIONS] User already in conversation');
          return true;
        }
        console.error('❌ [CONVERSATIONS] Error joining conversation:', error);
        return false;
      }

      console.log('✅ [CONVERSATIONS] User joined conversation:', conversationId);
      return true;
    } catch (error) {
      console.error('❌ [CONVERSATIONS] Error in joinConversation:', error);
      return false;
    }
  }

  /**
   * Leave a conversation
   */
  async leaveConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { supabase } = await import('./supabase');

      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_active: false, last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ [CONVERSATIONS] Error leaving conversation:', error);
        return false;
      }

      console.log('✅ [CONVERSATIONS] User left conversation:', conversationId);
      return true;
    } catch (error) {
      console.error('❌ [CONVERSATIONS] Error in leaveConversation:', error);
      return false;
    }
  }

  /**
   * Format conversation for display in UI
   */
  private formatConversationForDisplay(
    conversation: any,
    currentUserId: string,
    participantCount: number
  ): GameConversationDisplay {
    const metadata = conversation.metadata || {};
    const gameDate = new Date(metadata.date);
    
    return {
      id: conversation.id,
      conversationId: conversation.id,
      bookingId: conversation.booking_id || metadata.booking_id,
      venue: metadata.venue || 'Unknown Venue',
      court: metadata.court || 'Unknown Court',
      sport: metadata.sport || 'Badminton',
      date: this.formatDate(gameDate),
      time: this.formatTime(metadata.time),
      duration: `${metadata.duration || 1} hour${metadata.duration !== 1 ? 's' : ''}`,
      isHost: conversation.created_by === currentUserId,
      isOpenGame: metadata.is_open_game || false,
      participants: participantCount,
      createdAt: new Date(conversation.created_at)
    };
  }

  /**
   * Format date for display (Today, Tomorrow, or "Nov 6")
   */
  private formatDate(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateStr = date.toDateString();
    
    if (dateStr === today.toDateString()) {
      return 'Today';
    } else if (dateStr === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  /**
   * Format time from "HH:MM:SS" to "H:MM AM/PM"
   */
  private formatTime(timeStr: string): string {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}

export const ConversationService = new ConversationServiceClass();
