import { Conversation, Message, supabase } from '@/src/common/services/supabase';
import MessageCacheService from '@/src/common/services/messageCacheService';

export class ChatService {
  // Get or create a direct conversation between two users
  static async getOrCreateDirectConversation(friendId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if conversation already exists
      const { data: userConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (userConversations && userConversations.length > 0) {
        // Check if any of these conversations also include the friend and are direct type
        for (const userConv of userConversations) {
          // Check if this conversation is direct type
          const { data: convData } = await supabase
            .from('conversations')
            .select('id, type, created_by, created_at')
            .eq('id', userConv.conversation_id)
            .eq('type', 'direct')
            .single();

          if (convData) {
            // Check if friend is also participant
            const { data: friendParticipant } = await supabase
              .from('conversation_participants')
              .select('id')
              .eq('conversation_id', convData.id)
              .eq('user_id', friendId)
              .single();

            if (friendParticipant) {
              return { 
                success: true, 
                conversation: {
                  id: convData.id,
                  type: 'direct' as const,
                  createdBy: convData.created_by,
                  participants: [user.id, friendId],
                  unreadCount: 0,
                  createdAt: new Date(convData.created_at)
                }
              };
            }
          }
        }
      }

      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConversation.id, user_id: user.id },
          { conversation_id: newConversation.id, user_id: friendId }
        ]);

      if (participantsError) throw participantsError;

      return { 
        success: true, 
        conversation: {
          id: newConversation.id,
          type: 'direct' as const,
          createdBy: newConversation.created_by,
          participants: [user.id, friendId],
          unreadCount: 0,
          createdAt: new Date(newConversation.created_at)
        }
      };
    } catch (error) {
      console.error('Get or create conversation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create conversation' };
    }
  }

  // Get messages for a conversation (optimized with cache + delta fetch)
  static async getMessages(conversationId: string, limit = 50, offset = 0) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Validate conversation ID
      if (!conversationId || conversationId.trim() === '') {
        return { success: true, messages: [] };
      }

      // For pagination (offset > 0), always fetch from DB
      if (offset > 0) {
        return this.fetchMessagesFromDB(conversationId, user.id, limit, offset);
      }

      // Try to get from cache first
      const { messages: cachedMessages, lastMessageTimestamp, isCacheValid } = 
        await MessageCacheService.getCachedMessages(conversationId);

      // If cache is fresh and has messages, return cached data
      if (isCacheValid && cachedMessages.length > 0) {
        console.log(`⚡ [CHAT] Returning ${cachedMessages.length} cached messages for ${conversationId}`);
        
        // Ensure timestamps are Date objects (they might be strings from AsyncStorage)
        const messagesWithDateObjects = cachedMessages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
        }));
        
        return { success: true, messages: messagesWithDateObjects, fromCache: true };
      }

      // Cache miss or stale - fetch from DB
      // If we have cached messages, do delta fetch (only new messages)
      if (lastMessageTimestamp && cachedMessages.length > 0) {
        console.log(`🔄 [CHAT] Delta fetch: getting messages newer than ${lastMessageTimestamp}`);
        const deltaResult = await this.fetchDeltaMessages(
          conversationId, 
          user.id, 
          lastMessageTimestamp
        );

        if (deltaResult.success && deltaResult.newMessages && deltaResult.newMessages.length > 0) {
          console.log(`✅ [CHAT] Delta fetch: found ${deltaResult.newMessages.length} new messages`);
          
          // Cache the new messages (append mode)
          await MessageCacheService.cacheMessages(conversationId, deltaResult.newMessages, true);

          // Return all messages (cached + new) - ensure timestamps are Date objects
          const allMessages = [...cachedMessages, ...deltaResult.newMessages].map(msg => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
          }));

          return { success: true, messages: allMessages, fromCache: false, deltaFetch: true };
        }

        // No new messages, return cached (even if stale) - ensure timestamps are Date objects
        console.log(`✅ [CHAT] Delta fetch: no new messages, returning ${cachedMessages.length} cached`);
        const messagesWithDateObjects = cachedMessages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
        }));
        return { success: true, messages: messagesWithDateObjects, fromCache: true };
      }

      // Full fetch from DB and cache
      console.log(`📥 [CHAT] Full fetch from DB for ${conversationId}`);
      return this.fetchMessagesFromDB(conversationId, user.id, limit, offset, true);
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get messages' };
    }
  }

  // Fetch messages from database
  private static async fetchMessagesFromDB(
    conversationId: string, 
    userId: string, 
    limit: number, 
    offset: number,
    shouldCache = false
  ) {
    try {
      // Use JOIN to get messages with sender names in a single query
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
          users!messages_sender_id_fkey(id, full_name, email)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Transform data to Message objects
      const messages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderName: (Array.isArray(msg.users) ? msg.users[0]?.full_name : msg.users?.full_name) || 'Unknown User',
        content: msg.content,
        messageType: msg.message_type,
        metadata: msg.metadata,
        timestamp: new Date(msg.created_at),
        isMe: msg.sender_id === userId
      }));

      // Reverse to show oldest first (for chat display)
      messages.reverse();

      // Cache if requested and it's the initial fetch
      if (shouldCache && offset === 0 && messages.length > 0) {
        await MessageCacheService.cacheMessages(conversationId, messages);
        console.log(`💾 [CHAT] Cached ${messages.length} messages for ${conversationId}`);
      }

      return { success: true, messages, fromCache: false };
    } catch (error) {
      console.error('Fetch messages from DB error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch messages' };
    }
  }

  // Fetch only new messages since last cache timestamp (delta fetch)
  private static async fetchDeltaMessages(
    conversationId: string,
    userId: string,
    lastFetchedAt: string
  ) {
    try {
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
          users!messages_sender_id_fkey(id, full_name, email)
        `)
        .eq('conversation_id', conversationId)
        .gt('created_at', lastFetchedAt)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const newMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderName: (Array.isArray(msg.users) ? msg.users[0]?.full_name : msg.users?.full_name) || 'Unknown User',
        content: msg.content,
        messageType: msg.message_type,
        metadata: msg.metadata,
        timestamp: new Date(msg.created_at),
        isMe: msg.sender_id === userId
      }));

      return { success: true, newMessages };
    } catch (error) {
      console.error('Fetch delta messages error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch delta messages' };
    }
  }

  // Send a message
  static async sendMessage(conversationId: string, content: string, messageType: 'text' | 'image' | 'system' | 'score' = 'text', metadata?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
          metadata
        })
        .select('id, conversation_id, sender_id, content, message_type, metadata, created_at')
        .single();

      if (error) throw error;

      // Get sender name
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const message: Message = {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        senderName: userData?.full_name || 'Unknown User',
        content: data.content,
        messageType: data.message_type,
        metadata: data.metadata,
        timestamp: new Date(data.created_at),
        isMe: true
      };

      // Add to cache (append mode)
      await MessageCacheService.cacheMessages(conversationId, [message], true);

      return { success: true, message };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
    }
  }

  // Get user's conversations
  static async getConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userParticipations, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      const conversations: Conversation[] = [];

      for (const participation of userParticipations || []) {
        // Get conversation details
        const { data: convData } = await supabase
          .from('conversations')
          .select('id, type, name, created_by, created_at')
          .eq('id', participation.conversation_id)
          .single();

        if (!convData) continue;

        // Get participants
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', participation.conversation_id)
          .eq('is_active', true);

        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('id, content, message_type, created_at, sender_id')
          .eq('conversation_id', participation.conversation_id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = lastMessages?.[0];
        let lastMessageFormatted = undefined;

        if (lastMessage) {
          // Get sender name for last message
          const { data: senderData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', lastMessage.sender_id)
            .single();

          lastMessageFormatted = {
            id: lastMessage.id,
            conversationId: participation.conversation_id,
            senderId: lastMessage.sender_id,
            senderName: senderData?.full_name || 'Unknown User',
            content: lastMessage.content,
            messageType: lastMessage.message_type,
            timestamp: new Date(lastMessage.created_at),
            isMe: lastMessage.sender_id === user.id
          };
        }

        conversations.push({
          id: participation.conversation_id,
          type: convData.type,
          name: convData.name || undefined,
          createdBy: convData.created_by,
          participants: participants?.map(p => p.user_id) || [],
          lastMessage: lastMessageFormatted,
          unreadCount: 0, // TODO: Calculate unread count based on last_read_at
          createdAt: new Date(convData.created_at)
        });
      }

      return { success: true, conversations };
    } catch (error) {
      console.error('Get conversations error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get conversations' };
    }
  }

  // Subscribe to new messages in a conversation
  static subscribeToMessages(conversationId: string, onNewMessage: (message: Message) => void) {
    return supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            
            // Get current user FIRST before any async operations
            const { data: { user } } = await supabase.auth.getUser();
            const currentUserId = user?.id;
            
            // Get sender name
            const { data: userData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', newData.sender_id)
              .single();
            
            const message: Message = {
              id: newData.id,
              conversationId: newData.conversation_id,
              senderId: newData.sender_id,
              senderName: userData?.full_name || 'Unknown User',
              content: newData.content,
              messageType: newData.message_type,
              metadata: newData.metadata,
              timestamp: new Date(newData.created_at),
              isMe: newData.sender_id === currentUserId // Use captured user ID
            };

            onNewMessage(message);
          }
        }
      )
      .subscribe();
  }

  // Create a game conversation
  static async createGameConversation(gameId: string, gameName: string, participants: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create conversation
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type: 'game',
          name: gameName,
          created_by: user.id,
          game_id: gameId
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participantData = participants.map(participantId => ({
        conversation_id: newConversation.id,
        user_id: participantId
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participantData);

      if (participantsError) throw participantsError;

      // Send welcome message
      await this.sendMessage(
        newConversation.id,
        'Game chat created',
        'system'
      );

      return { 
        success: true, 
        conversation: {
          id: newConversation.id,
          type: 'game' as const,
          name: gameName,
          createdBy: newConversation.created_by,
          participants,
          unreadCount: 0,
          createdAt: new Date(newConversation.created_at)
        }
      };
    } catch (error) {
      console.error('Create game conversation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create game conversation' };
    }
  }

  // Mark messages as read
  static async markAsRead(conversationId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark as read' };
    }
  }
}

