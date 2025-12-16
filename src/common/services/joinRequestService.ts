import { supabase } from './supabase';

export interface JoinRequest {
  id: string;
  booking_id: string;
  requester_id: string;
  host_id: string;
  conversation_id?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
  responded_at?: string;
  
  // Populated fields
  requester?: {
    id: string;
    full_name: string;
    avatar?: string;
    email?: string;
    rating?: number;
  };
  host?: {
    id: string;
    full_name: string;
    avatar?: string;
    email?: string;
  };
  booking?: {
    id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    venue_name?: string;
    court_name?: string;
    skill_level?: string;
  };
}

export class JoinRequestService {
  /**
   * Send a join request to join an open game
   */
  static async sendJoinRequest(
    bookingId: string,
    hostId: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if already requested
      const { data: existingRequest } = await supabase
        .from('join_requests')
        .select('id, status')
        .eq('booking_id', bookingId)
        .eq('requester_id', user.id)
        .single();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return { success: false, error: 'Join request already sent' };
        }
        if (existingRequest.status === 'rejected') {
          return { success: false, error: 'Your previous request was rejected' };
        }
        if (existingRequest.status === 'accepted') {
          return { success: false, error: 'You have already joined this game' };
        }
      }

      // Check if already a participant
      const { data: participant } = await supabase
        .from('booking_participants')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('user_id', user.id)
        .single();

      if (participant) {
        return { success: false, error: 'You are already part of this game' };
      }

      // Check if user is the host
      const { data: booking } = await supabase
        .from('bookings')
        .select('user_id, player_count')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      if (booking.user_id === user.id) {
        return { success: false, error: 'You cannot join your own game' };
      }

      if (booking.player_count <= 0) {
        return { success: false, error: 'This game is already full' };
      }

      // Create join request
      const { data: joinRequest, error: requestError } = await supabase
        .from('join_requests')
        .insert({
          booking_id: bookingId,
          requester_id: user.id,
          host_id: hostId,
          status: 'pending'
        })
        .select('id')
        .single();

      if (requestError) {
        console.error('Error creating join request:', requestError);
        return { success: false, error: 'Failed to send join request' };
      }

      // Create notification for host
      await supabase.from('notifications').insert({
        user_id: hostId,
        type: 'join_request_received',
        title: 'New Join Request',
        message: 'Someone wants to join your game!'
      });

      // ✅ NEW: Auto-send message to host
      try {
        const { ChatService } = await import('./chatService');
        
        // Get or create conversation with host
        const conversationResult = await ChatService.getOrCreateDirectConversation(hostId);
        
        if (conversationResult.success && conversationResult.conversation) {
          // Send automatic message
          await ChatService.sendMessage(
            conversationResult.conversation.id,
            "Hey there! I wanna join your game.",
            'text'
          );
          console.log('✅ Auto-message sent to host');
        } else {
          console.warn('⚠️ Failed to create conversation for auto-message:', conversationResult.error);
        }
      } catch (messageError) {
        // Non-critical error - join request still succeeds even if message fails
        console.error('⚠️ Error sending auto-message:', messageError);
      }

      console.log('✅ Join request sent successfully:', joinRequest.id);
      return { success: true, requestId: joinRequest.id };
    } catch (error) {
      console.error('Error sending join request:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Accept a join request
   */
  static async acceptJoinRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
        .eq('status', 'pending'); // Only accept pending requests

      if (error) {
        console.error('Error accepting join request:', error);
        return { success: false, error: 'Failed to accept request' };
      }

      console.log('✅ Join request accepted:', requestId);
      return { success: true };
    } catch (error) {
      console.error('Error accepting join request:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Reject a join request
   */
  static async rejectJoinRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('status', 'pending'); // Only reject pending requests

      if (error) {
        console.error('Error rejecting join request:', error);
        return { success: false, error: 'Failed to reject request' };
      }

      console.log('✅ Join request rejected:', requestId);
      return { success: true };
    } catch (error) {
      console.error('Error rejecting join request:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Cancel own join request
   */
  static async cancelJoinRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('join_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error cancelling join request:', error);
        return { success: false, error: 'Failed to cancel request' };
      }

      console.log('✅ Join request cancelled:', requestId);
      return { success: true };
    } catch (error) {
      console.error('Error cancelling join request:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get join requests for a booking (host view)
   */
  static async getJoinRequestsForBooking(bookingId: string): Promise<JoinRequest[]> {
    try {
      const { data, error } = await supabase
        .from('join_requests')
        .select(`
          *,
          requester:users!join_requests_requester_id_fkey(id, full_name, avatar, email, rating)
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching join requests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching join requests:', error);
      return [];
    }
  }

  /**
   * Get all pending join requests for current user as host
   */
  static async getMyPendingRequests(): Promise<JoinRequest[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('join_requests')
        .select(`
          *,
          requester:users!join_requests_requester_id_fkey(id, full_name, avatar, email, rating),
          booking:bookings!join_requests_booking_id_fkey(
            id,
            booking_date,
            start_time,
            end_time,
            skill_level,
            venues!inner(name),
            courts!inner(name)
          )
        `)
        .eq('host_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my pending requests:', error);
        return [];
      }

      // Format the response
      return (data || []).map((req: any) => ({
        ...req,
        booking: {
          ...req.booking,
          venue_name: req.booking?.venues?.name,
          court_name: req.booking?.courts?.name
        }
      }));
    } catch (error) {
      console.error('Error fetching my pending requests:', error);
      return [];
    }
  }

  /**
   * Get join request status for a booking by current user
   */
  static async getMyRequestStatus(bookingId: string): Promise<JoinRequest | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('join_requests')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('requester_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching request status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching request status:', error);
      return null;
    }
  }

  /**
   * Get join requests where current user is the host
   */
  static async getMyReceivedRequests(): Promise<JoinRequest[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ [JOIN REQUEST] No user found');
        return [];
      }

      console.log('🔍 [JOIN REQUEST] Fetching received requests for host:', user.id);

      const { data, error } = await supabase
        .from('join_requests')
        .select(`
          *,
          requester:requester_id (
            id,
            full_name,
            avatar,
            email,
            rating
          ),
          booking:booking_id (
            id,
            booking_date,
            start_time,
            end_time,
            skill_level,
            player_count,
            venue:venue_id (
              name
            ),
            court:court_id (
              name
            )
          )
        `)
        .eq('host_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [JOIN REQUEST] Error fetching received requests:', error);
        return [];
      }

      console.log('✅ [JOIN REQUEST] Fetched received requests:', data?.length || 0, data);
      return data || [];
    } catch (error) {
      console.error('❌ [JOIN REQUEST] Unexpected error:', error);
      return [];
    }
  }

  /**
   * Get pending requests count for current user as host
   */
  static async getPendingRequestsCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching pending requests count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
      return 0;
    }
  }

  /**
   * Subscribe to join requests changes for current user
   */
  static subscribeToJoinRequests(
    callback: (payload: any) => void
  ): { unsubscribe: () => void } {
    const channel = supabase
      .channel('join_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'join_requests'
        },
        callback
      )
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      }
    };
  }
}
