import { supabase } from './supabase';

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
   * Get all messages for a conversation
   */
  async getConversationMessages(conversationId: string, userId: string): Promise<FormattedMessage[]> {
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
          sender:users!messages_sender_id_fkey (
            full_name,
            avatar
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(msg => this.formatMessage(msg, userId));
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
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;
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
}

export const messageService = new MessageService();
