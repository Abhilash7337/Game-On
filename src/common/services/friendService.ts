import { supabase, Friend } from '@/src/common/services/supabase';

export class FriendService {
  // Search for users by name
  static async searchUsers(query: string, limit = 10) {
    try {
      console.log('🔍 Searching for users with query:', query);
      
      // First check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.email || 'Not logged in');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .ilike('full_name', `%${query}%`)
        .limit(limit);

      console.log('📊 Search result:', { data, error });
      console.log('📈 Found users count:', data?.length || 0);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      return { success: true, users: data };
    } catch (error) {
      console.error('💥 Search users error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
    }
  }

  // Send friend request
  static async sendFriendRequest(friendId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if friendship already exists
      const { data: existingFriendship } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .single();

      if (existingFriendship) {
        throw new Error('Friendship already exists');
      }

      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, friendship: data };
    } catch (error) {
      console.error('Send friend request error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send friend request' };
    }
  }

  // Accept friend request
  static async acceptFriendRequest(friendshipId: string) {
    try {
      const { data, error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, friendship: data };
    } catch (error) {
      console.error('Accept friend request error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to accept friend request' };
    }
  }

  // Get user's friends
  static async getFriends() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get friendships where user is either user_id or friend_id
      const { data: friendships, error } = await supabase
        .from('friends')
        .select('id, user_id, friend_id, status, created_at')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      if (!friendships || friendships.length === 0) {
        return { success: true, friends: [] };
      }

      // Get friend user data
      const friendIds = friendships.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
      const { data: friendsData, error: friendsError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', friendIds);

      if (friendsError) throw friendsError;

      // Transform data to Friend interface (optimized - load basic data first, then enhance with conversation info)
      const friends: Friend[] = friendsData?.map(userData => ({
        id: userData.id,
        name: userData.full_name,
        profilePhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name)}&background=047857&color=fff`,
        isOnline: false, // Will be updated by presence
        status: 'accepted' as const,
        unreadCount: 0 // Will be updated separately for better performance
      })) || [];

      return { success: true, friends };
    } catch (error) {
      console.error('Get friends error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get friends' };
    }
  }

  // Get conversation info for a specific friend (for updating unread counts)
  static async getFriendConversationInfo(friendId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Find direct conversation between user and friend
      const { data: userConversations } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(id, type)
        `)
        .eq('user_id', user.id)
        .eq('conversations.type', 'direct');

      if (!userConversations || userConversations.length === 0) {
        return { success: true, conversationInfo: null };
      }

      for (const userConv of userConversations) {
        // Check if friend is also participant
        const { data: friendParticipant } = await supabase
          .from('conversation_participants')
          .select('id, last_read_at')
          .eq('conversation_id', userConv.conversation_id)
          .eq('user_id', friendId)
          .single();

        if (friendParticipant) {
          // Get last message
          const { data: lastMessages } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', userConv.conversation_id)
            .order('created_at', { ascending: false })
            .limit(1);

          let lastMessage = undefined;
          let lastMessageTime = undefined;
          let unreadCount = 0;

          if (lastMessages && lastMessages.length > 0) {
            const lastMsg = lastMessages[0];
            lastMessage = lastMsg.content;
            lastMessageTime = new Date(lastMsg.created_at);

            // Calculate unread count (messages after user's last read)
            const { data: userParticipant } = await supabase
              .from('conversation_participants')
              .select('last_read_at')
              .eq('conversation_id', userConv.conversation_id)
              .eq('user_id', user.id)
              .single();

            if (userParticipant?.last_read_at) {
              const { data: unreadMessages } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', userConv.conversation_id)
                .neq('sender_id', user.id)
                .gt('created_at', userParticipant.last_read_at);

              unreadCount = unreadMessages?.length || 0;
            } else {
              // If no last_read_at, count all messages from others
              const { data: unreadMessages } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', userConv.conversation_id)
                .neq('sender_id', user.id);

              unreadCount = unreadMessages?.length || 0;
            }
          }

          return {
            success: true,
            conversationInfo: {
              conversationId: userConv.conversation_id,
              lastMessage,
              lastMessageTime,
              unreadCount
            }
          };
        }
      }

      return { success: true, conversationInfo: null };
    } catch (error) {
      console.error('Get friend conversation info error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get conversation info' };
    }
  }

  // Get pending friend requests (received)
  static async getPendingRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: friendRequests, error } = await supabase
        .from('friends')
        .select('id, user_id, created_at')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      if (!friendRequests || friendRequests.length === 0) {
        return { success: true, requests: [] };
      }

      // Get user data for the requesters
      const requesterIds = friendRequests.map(req => req.user_id);
      const { data: requestersData, error: requestersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', requesterIds);

      if (requestersError) throw requestersError;

      const requests = friendRequests.map(request => {
        const requesterData = requestersData?.find(u => u.id === request.user_id);
        return {
          friendshipId: request.id,
          user: {
            id: request.user_id,
            name: requesterData?.full_name || 'Unknown User',
            email: requesterData?.email || '',
            profilePhoto: `https://ui-avatars.com/api/?name=${encodeURIComponent(requesterData?.full_name || 'Unknown User')}&background=047857&color=fff`
          },
          createdAt: new Date(request.created_at)
        };
      });

      return { success: true, requests };
    } catch (error) {
      console.error('Get pending requests error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get pending requests' };
    }
  }

  // Update user presence
  static async updatePresence(isOnline: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Update presence error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update presence' };
    }
  }

  // Subscribe to friends' presence updates
  static subscribeToFriendsPresence(onPresenceUpdate: (userId: string, isOnline: boolean, lastSeen: Date) => void) {
    return supabase
      .channel('friends-presence')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as any;
            onPresenceUpdate(
              newData.user_id,
              newData.is_online,
              new Date(newData.last_seen)
            );
          }
        }
      )
      .subscribe();
  }
}