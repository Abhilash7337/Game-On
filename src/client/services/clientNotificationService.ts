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
    const notification: NotificationData = {
      id: Date.now().toString(),
      type: 'booking_request',
      title: 'New Booking Request',
      message: `${(booking as any).venue} - ${(booking as any).court} on ${booking.date.toLocaleDateString()} at ${booking.time}`,
      bookingId: booking.id,
      clientId: clientId,
      userId: booking.userId,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.push(notification);
    this.notifyListeners();
    
    // In real app, send push notification or email
    // Production: Use proper push notification service
  }

  static async sendConfirmationNotification(userId: string, booking: Booking): Promise<void> {
    const notification: NotificationData = {
      id: Date.now().toString(),
      type: 'booking_confirmed',
      title: 'Booking Confirmed!',
      message: `Your booking for ${(booking as any).venue} has been confirmed.`,
      bookingId: booking.id,
      userId: userId,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.push(notification);
    this.notifyListeners();
    
    // Production: Use proper push notification service
  }

  static async sendRejectionNotification(userId: string, booking: Booking, reason: string): Promise<void> {
    const notification: NotificationData = {
      id: Date.now().toString(),
      type: 'booking_rejected',
      title: 'Booking Declined',
      message: `Your booking for ${(booking as any).venue} was declined. Reason: ${reason}`,
      bookingId: booking.id,
      userId: userId,
      timestamp: new Date(),
      read: false,
    };

    this.notifications.push(notification);
    this.notifyListeners();
    
    // Production: Use proper push notification service
  }

  static async getClientNotifications(clientId: string): Promise<NotificationData[]> {
    return this.notifications
      .filter(notification => notification.clientId === clientId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static async getUserNotifications(userId: string): Promise<NotificationData[]> {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  static async getUnreadCount(clientId?: string, userId?: string): Promise<number> {
    return this.notifications.filter(notification => 
      !notification.read && 
      (clientId ? notification.clientId === clientId : notification.userId === userId)
    ).length;
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
