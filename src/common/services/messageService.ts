import { supabase } from './supabase';
import MessageCacheService from '@/src/common/services/messageCacheService';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system' | 'score';
  metadata?: {
    score?: { team1: number; team2: number };
    [key: string]: any;
  };
  created_at: string;
  sender?: {
    full_name: string;
    avatar?: string;
  }[];
}

export interface FormattedMessage {
  id: string;
  text: string;
  timestamp: Date;
  username: string;
  userId: string;
  isMe: boolean;
  type: 'message' | 'score' | 'system';
  score?: { team1: number; team2: number };
}

class MessageService {
  /**
   * Get all messages for a conversation (with caching support)
   */
  async getConversationMessages(conversationId: string, userId: string): Promise<FormattedMessage[]> {
    try {
      // Try cache first
      const { messages: cachedMessages, lastMessageTimestamp, isCacheValid } = 
        await MessageCacheService.getCachedMessages(conversationId);

      // If cache is fresh, return cached data
      if (isCacheValid && cachedMessages.length > 0) {
        console.log(`⚡ [GAME CHAT] Cache hit: ${cachedMessages.length} messages`);
        return cachedMessages.map(msg => this.formatCachedMessage(msg, userId));
      }

      // Cache miss or stale - check for delta fetch
      if (lastMessageTimestamp && cachedMessages.length > 0) {
        console.log(`🔄 [GAME CHAT] Delta fetch since ${lastMessageTimestamp}`);
        const { data: newMessages, error } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            message_type,
            metadata,
            created_at,
            sender:users!messages_sender_id_fkey (
              full_name,
              avatar
            )
          `)
          .eq('conversation_id', conversationId)
          .gt('created_at', lastMessageTimestamp)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (newMessages && newMessages.length > 0) {
          console.log(`✅ [GAME CHAT] Found ${newMessages.length} new messages`);
          
          // Convert to standard Message format for caching
          const formattedNewMessages = newMessages.map(msg => ({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            senderName: (Array.isArray(msg.sender) ? msg.sender[0]?.full_name : msg.sender?.full_name) || 'Unknown',
            content: msg.content,
            messageType: msg.message_type as 'text' | 'image' | 'system' | 'score',
            metadata: msg.metadata,
            timestamp: new Date(msg.created_at),
            isMe: msg.sender_id === userId
          }));

          // Cache new messages (append mode)
          await MessageCacheService.cacheMessages(conversationId, formattedNewMessages, true);

          // Return all messages
          const allCached = cachedMessages.map(msg => this.formatCachedMessage(msg, userId));
          const allNew = formattedNewMessages.map(msg => this.formatCachedMessage(msg, userId));
          return [...allCached, ...allNew];
        }

        // No new messages, return cached
        console.log(`✅ [GAME CHAT] No new messages, returning ${cachedMessages.length} cached`);
        return cachedMessages.map(msg => this.formatCachedMessage(msg, userId));
      }

      // Full fetch from DB
      console.log(`📥 [GAME CHAT] Full fetch from DB`);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata,
          created_at,
          sender:users!messages_sender_id_fkey (
            full_name,
            avatar
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Convert to standard Message format
      const formattedMessages = (data || []).map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderName: (Array.isArray(msg.sender) ? msg.sender[0]?.full_name : msg.sender?.full_name) || 'Unknown',
        content: msg.content,
        messageType: msg.message_type as 'text' | 'image' | 'system' | 'score',
        metadata: msg.metadata,
        timestamp: new Date(msg.created_at),
        isMe: msg.sender_id === userId
      }));

      // Cache the results
      if (formattedMessages.length > 0) {
        await MessageCacheService.cacheMessages(conversationId, formattedMessages);
        console.log(`💾 [GAME CHAT] Cached ${formattedMessages.length} messages`);
      }

      return formattedMessages.map(msg => this.formatCachedMessage(msg, userId));
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Send a text message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: 'text'
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata,
          created_at,
          sender:users!messages_sender_id_fkey (
            full_name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      // Add to cache
      if (data) {
        const messageToCache = {
          id: data.id,
          conversationId: data.conversation_id,
          senderId: data.sender_id,
          senderName: (Array.isArray(data.sender) ? data.sender[0]?.full_name : data.sender?.full_name) || 'Unknown',
          content: data.content,
          messageType: data.message_type as 'text' | 'image' | 'system' | 'score',
          metadata: data.metadata,
          timestamp: new Date(data.created_at),
          isMe: true
        };
        await MessageCacheService.cacheMessages(conversationId, [messageToCache], true);
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Send a score update message
   */
  async sendScoreUpdate(
    conversationId: string,
    senderId: string,
    team1Score: number,
    team2Score: number
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: 'Score Update',
          message_type: 'score',
          metadata: {
            score: { team1: team1Score, team2: team2Score }
          }
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata,
          created_at,
          sender:users!messages_sender_id_fkey (
            full_name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending score update:', error);
      throw error;
    }
  }

  /**
   * Send a system message
   */
  async sendSystemMessage(
    conversationId: string,
    content: string,
    metadata?: any
  ): Promise<Message | null> {
    try {
      // System messages use a special sender_id
      const { data: systemUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'system@gameon.com')
        .single();

      if (!systemUser) {
        console.error('System user not found');
        return null;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: systemUser.id,
          content,
          message_type: 'system',
          metadata
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata,
          created_at,
          sender:users!messages_sender_id_fkey (
            full_name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    userId: string,
    onNewMessage: (message: FormattedMessage) => void
  ) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              message_type,
              metadata,
              created_at,
              sender:users!messages_sender_id_fkey (
                full_name,
                avatar
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onNewMessage(this.formatMessage(data, userId));
          }
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Unsubscribe from message updates
   */
  async unsubscribeFromMessages(channel: any) {
    await supabase.removeChannel(channel);
  }

  /**
   * Mark messages as read (debounced)
   */
  private markAsReadTimer: NodeJS.Timeout | null = null;
  private readonly MARK_AS_READ_DEBOUNCE_MS = 2000;

  async markAsRead(conversationId: string, userId: string, immediate = false): Promise<void> {
    try {
      // If immediate, clear any pending timer and execute now
      if (immediate) {
        if (this.markAsReadTimer) {
          clearTimeout(this.markAsReadTimer);
          this.markAsReadTimer = null;
        }

        const { error } = await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);

        if (error) throw error;
        return;
      }

      // Clear existing timer if any
      if (this.markAsReadTimer) {
        clearTimeout(this.markAsReadTimer);
      }

      // Set new debounced timer
      return new Promise((resolve, reject) => {
        this.markAsReadTimer = setTimeout(async () => {
          try {
            const { error } = await supabase
              .from('conversation_participants')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', userId);

            this.markAsReadTimer = null;

            if (error) throw error;
            resolve();
          } catch (error) {
            console.error('Error marking messages as read:', error);
            reject(error);
          }
        }, this.MARK_AS_READ_DEBOUNCE_MS);
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Format message for UI display
   */
  private formatMessage(msg: any, currentUserId: string): FormattedMessage {
    const senderName = Array.isArray(msg.sender) && msg.sender.length > 0 
      ? msg.sender[0].full_name 
      : 'Unknown';
    
    return {
      id: msg.id,
      text: msg.content,
      timestamp: new Date(msg.created_at),
      username: senderName,
      userId: msg.sender_id,
      isMe: msg.sender_id === currentUserId,
      type: msg.message_type === 'text' ? 'message' : msg.message_type,
      score: msg.metadata?.score
    };
  }

  /**
   * Format cached message for UI display (uses different structure)
   */
  private formatCachedMessage(msg: any, currentUserId: string): FormattedMessage {
    return {
      id: msg.id,
      text: msg.content,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
      username: msg.senderName || 'Unknown',
      userId: msg.senderId,
      isMe: msg.senderId === currentUserId,
      type: msg.messageType === 'text' ? 'message' : msg.messageType,
      score: msg.metadata?.score
    };
  }
}

export const messageService = new MessageService();
