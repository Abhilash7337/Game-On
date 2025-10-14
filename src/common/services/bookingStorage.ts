import { Booking } from '@/src/common/types';

interface BookingRequest {
  userId: string;
  venueId: string;
  venueName: string;
  ownerId: string;
  court: string;
  date: Date;
  time: string;
  duration: string;
  bookingType: 'Open Game' | 'Private Game';
  skillLevel?: string;
  players?: string;
  price: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

interface BookingWithNotification extends Booking {
  notificationSent?: boolean;
  venue?: string; // venue name for display
  court?: string; // court name for display  
  ownerId?: string; // venue owner ID
  bookingStatus?: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
}

class BookingStorageService {
  private static bookings: BookingWithNotification[] = [];
  private static listeners: (() => void)[] = [];
  private static initialized = false;

  static async createBooking(bookingData: BookingRequest): Promise<Booking> {
    const booking: BookingWithNotification = {
      id: Date.now().toString(),
      userId: bookingData.userId,
      venueId: bookingData.venueId,
      courtId: `${bookingData.venueId}-${bookingData.court}`,
      date: bookingData.date,
      time: bookingData.time,
      duration: bookingData.duration,
      bookingType: bookingData.bookingType,
      skillLevel: bookingData.skillLevel,
      players: bookingData.players,
      price: bookingData.price,
      status: 'upcoming', // We'll use 'upcoming' for confirmed bookings
      paymentStatus: bookingData.paymentStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Additional fields for our app
      venue: bookingData.venueName,
      court: bookingData.court,
      ownerId: bookingData.ownerId,
      bookingStatus: bookingData.status, // pending, confirmed, rejected
      notificationSent: false,
    };

    this.bookings.push(booking);
    this.notifyListeners();
    
    // Also add to the old booking store for compatibility
    const { bookingStore } = await import('@/utils/bookingStore');
    if (bookingData.status === 'confirmed') {
      bookingStore.addBooking({
        venue: bookingData.venueName,
        court: bookingData.court,
        date: bookingData.date,
        time: bookingData.time,
        duration: bookingData.duration,
        bookingType: bookingData.bookingType,
        skillLevel: bookingData.skillLevel,
        players: bookingData.players,
        price: bookingData.price,
      });
    }

    return booking;
  }

  static async getBookingsByUser(userId: string): Promise<Booking[]> {
    return this.bookings.filter(booking => booking.userId === userId);
  }

  static async getBookingsByClient(clientId: string): Promise<BookingWithNotification[]> {
    return this.bookings.filter(booking => booking.ownerId === clientId);
  }

  static async getPendingBookings(clientId: string): Promise<BookingWithNotification[]> {
    return this.bookings.filter(booking => 
      booking.ownerId === clientId && 
      (booking as any).bookingStatus === 'pending'
    );
  }

  static async updateBookingStatus(
    bookingId: string, 
    status: 'confirmed' | 'rejected', 
    message?: string
  ): Promise<Booking | null> {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return null;

    (booking as any).bookingStatus = status;
    booking.updatedAt = new Date();
    
    if (status === 'confirmed') {
      booking.status = 'upcoming';
      // Add to old booking store for compatibility
      const { bookingStore } = await import('@/utils/bookingStore');
      bookingStore.addBooking({
        venue: (booking as any).venue,
        court: (booking as any).court,
        date: booking.date,
        time: booking.time,
        duration: booking.duration,
        bookingType: booking.bookingType,
        skillLevel: booking.skillLevel,
        players: booking.players,
        price: booking.price,
      });
    }

    this.notifyListeners();
    return booking;
  }

  static async getAllBookings(): Promise<BookingWithNotification[]> {
    return [...this.bookings].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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

  // Initialize with demo data (no bookings - clean slate for testing)
  static initializeDemoData(): void {
    if (this.initialized) return;
    
    // Keep bookings array empty so user can test the complete workflow
    // from booking creation to revenue tracking
    this.bookings = [];
    this.initialized = true;
  }
}

export { BookingStorageService };
export type { BookingRequest, BookingWithNotification };
