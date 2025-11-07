import { Booking } from '@/src/common/types';

interface NotificationData {
  id: string;
  type: 'booking_request' | 'booking_confirmed' | 'booking_rejected';
  title: string;
  message: string;
  bookingId: string;
  userId?: string;
  clientId?: string;
  timestamp: Date;
  read: boolean;
}

class ClientNotificationService {
  private static notifications: NotificationData[] = [];
  private static listeners: (() => void)[] = [];

  static async sendBookingRequest(clientId: string, booking: Booking): Promise<void> {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      const notificationMessage = `${(booking as any).venue} - ${(booking as any).court} on ${booking.date.toLocaleDateString()} at ${booking.time}`;
      
      // Insert into Supabase notifications table
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: clientId,
          type: 'booking_request',
          title: 'New Booking Request',
          message: notificationMessage,
          is_read: false,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [NOTIFICATION] Supabase insert error:', error);
        // Fallback to in-memory
        const notification: NotificationData = {
          id: Date.now().toString(),
          type: 'booking_request',
          title: 'New Booking Request',
          message: notificationMessage,
          bookingId: booking.id,
          clientId: clientId,
          userId: booking.userId,
          timestamp: new Date(),
          read: false,
        };
        this.notifications.push(notification);
      } else {
        console.log('✅ [NOTIFICATION] Saved to Supabase:', data.id);
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error sending booking request:', error);
    }
  }

  static async sendConfirmationNotification(userId: string, booking: Booking): Promise<void> {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      const notificationMessage = `Your booking for ${(booking as any).venue} has been confirmed.`;
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: 'booking_confirmed',
          title: 'Booking Confirmed!',
          message: notificationMessage,
          is_read: false,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [NOTIFICATION] Supabase insert error:', error);
        // Fallback to in-memory
        const notification: NotificationData = {
          id: Date.now().toString(),
          type: 'booking_confirmed',
          title: 'Booking Confirmed!',
          message: notificationMessage,
          bookingId: booking.id,
          userId: userId,
          timestamp: new Date(),
          read: false,
        };
        this.notifications.push(notification);
      } else {
        console.log('✅ [NOTIFICATION] Confirmation saved to Supabase:', data.id);
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error sending confirmation:', error);
    }
  }

  static async sendRejectionNotification(userId: string, booking: Booking, reason: string): Promise<void> {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      const notificationMessage = `Your booking for ${(booking as any).venue} was declined. Reason: ${reason}`;
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: 'booking_rejected',
          title: 'Booking Declined',
          message: notificationMessage,
          is_read: false,
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ [NOTIFICATION] Supabase insert error:', error);
        // Fallback to in-memory
        const notification: NotificationData = {
          id: Date.now().toString(),
          type: 'booking_rejected',
          title: 'Booking Declined',
          message: notificationMessage,
          bookingId: booking.id,
          userId: userId,
          timestamp: new Date(),
          read: false,
        };
        this.notifications.push(notification);
      } else {
        console.log('✅ [NOTIFICATION] Rejection saved to Supabase:', data.id);
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error sending rejection:', error);
    }
  }

  static async getClientNotifications(clientId: string): Promise<NotificationData[]> {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [NOTIFICATION] Supabase fetch error:', error);
        // Fallback to in-memory
        return this.notifications
          .filter(notification => notification.clientId === clientId)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }

      return data.map(n => ({
        id: n.id,
        type: n.type as 'booking_request' | 'booking_confirmed' | 'booking_rejected',
        title: n.title,
        message: n.message,
        bookingId: '', // Not stored in DB
        clientId: n.user_id,
        timestamp: new Date(n.created_at),
        read: n.is_read || false,
      }));
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error fetching notifications:', error);
      return [];
    }
  }

  static async getUserNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [NOTIFICATION] Supabase fetch error:', error);
        // Fallback to in-memory
        return this.notifications
          .filter(notification => notification.userId === userId)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }

      return data.map(n => ({
        id: n.id,
        type: n.type as 'booking_request' | 'booking_confirmed' | 'booking_rejected',
        title: n.title,
        message: n.message,
        bookingId: '', // Not stored in DB
        userId: n.user_id,
        timestamp: new Date(n.created_at),
        read: n.is_read || false,
      }));
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error fetching notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ [NOTIFICATION] Supabase update error:', error);
        // Fallback to in-memory
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }
      } else {
        console.log('✅ [NOTIFICATION] Marked as read in Supabase:', notificationId);
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error marking as read:', error);
    }
  }

  static async getUnreadCount(clientId?: string, userId?: string): Promise<number> {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      const targetUserId = clientId || userId;
      if (!targetUserId) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .eq('is_read', false);

      if (error) {
        console.error('❌ [NOTIFICATION] Supabase count error:', error);
        // Fallback to in-memory
        return this.notifications.filter(notification => 
          !notification.read && 
          (clientId ? notification.clientId === clientId : notification.userId === userId)
        ).length;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error getting unread count:', error);
      return 0;
    }
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export { ClientNotificationService };
export type { NotificationData };
