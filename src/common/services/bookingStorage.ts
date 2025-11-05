import { Booking } from '@/src/common/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKINGS_STORAGE_KEY = '@game_on_bookings';

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

  // Load bookings from AsyncStorage
  private static async loadFromStorage(): Promise<void> {
    try {
      console.log('💾 [STORAGE] Loading bookings from AsyncStorage...');
      const stored = await AsyncStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        this.bookings = parsed.map((b: any) => ({
          ...b,
          date: new Date(b.date),
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        }));
        console.log('✅ [STORAGE] Loaded bookings from storage:', this.bookings.length);
      } else {
        console.log('ℹ️ [STORAGE] No stored bookings found');
        this.bookings = [];
      }
      this.initialized = true;
    } catch (error) {
      console.error('❌ [STORAGE] Error loading bookings:', error);
      this.bookings = [];
      this.initialized = true;
    }
  }

  // Save bookings to AsyncStorage
  private static async saveToStorage(): Promise<void> {
    try {
      console.log('💾 [STORAGE] Saving bookings to AsyncStorage:', this.bookings.length);
      await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(this.bookings));
      console.log('✅ [STORAGE] Bookings saved successfully');
    } catch (error) {
      console.error('❌ [STORAGE] Error saving bookings:', error);
    }
  }

  // Ensure storage is loaded before any operation
  private static async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadFromStorage();
    }
  }

  static async createBooking(bookingData: BookingRequest): Promise<Booking> {
    try {
      // Ensure bookings are loaded
      await this.ensureInitialized();

      // Validate required fields
      if (!bookingData.userId || !bookingData.venueId || !bookingData.venueName) {
        throw new Error('User ID, venue ID, and venue name are required');
      }

      if (!bookingData.date || !bookingData.time || !bookingData.duration) {
        throw new Error('Date, time, and duration are required');
      }

      if (bookingData.price < 0) {
        throw new Error('Price cannot be negative');
      }

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
      await this.saveToStorage(); // Persist to AsyncStorage
      this.notifyListeners();
      
      console.log('✅ [STORAGE] Booking added and persisted:', booking.id);
      
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
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create booking. Please try again.');
    }
  }

  static async getBookingsByUser(userId: string): Promise<Booking[]> {
    try {
      await this.ensureInitialized();
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      return this.bookings.filter(booking => booking.userId === userId);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch bookings. Please try again.');
    }
  }

  static async getBookingsByClient(clientId: string): Promise<BookingWithNotification[]> {
    try {
      await this.ensureInitialized();
      
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      return this.bookings.filter(booking => booking.ownerId === clientId);
    } catch (error) {
      console.error('Error fetching client bookings:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch bookings. Please try again.');
    }
  }

  static async getPendingBookings(clientId: string): Promise<BookingWithNotification[]> {
    await this.ensureInitialized();
    
    console.log('🔍 [STORAGE] Getting pending bookings for clientId:', clientId);
    console.log('🔍 [STORAGE] Total bookings in storage:', this.bookings.length);
    console.log('🔍 [STORAGE] All bookings:', JSON.stringify(this.bookings.map(b => ({
      id: b.id,
      ownerId: b.ownerId,
      bookingStatus: (b as any).bookingStatus,
      venue: (b as any).venue,
    })), null, 2));
    
    const pending = this.bookings.filter(booking => 
      booking.ownerId === clientId && 
      (booking as any).bookingStatus === 'pending'
    );
    
    console.log('✅ [STORAGE] Found pending bookings:', pending.length);
    return pending;
  }

  static async updateBookingStatus(
    bookingId: string, 
    status: 'confirmed' | 'rejected', 
    message?: string
  ): Promise<Booking | null> {
    await this.ensureInitialized();
    
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
    
    await this.saveToStorage(); // Persist changes
    this.notifyListeners();
    return booking;
  }

  static async getAllBookings(): Promise<BookingWithNotification[]> {
    await this.ensureInitialized();
    
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

  // Clear all bookings (for testing/reset)
  static async clearAllBookings(): Promise<void> {
    console.log('🗑️ [STORAGE] Clearing all bookings...');
    this.bookings = [];
    await AsyncStorage.removeItem(BOOKINGS_STORAGE_KEY);
    this.notifyListeners();
    console.log('✅ [STORAGE] All bookings cleared');
  }

  // Initialize with demo data (deprecated - using AsyncStorage now)
  static initializeDemoData(): void {
    // No-op - bookings are now persisted in AsyncStorage
    console.log('ℹ️ [STORAGE] initializeDemoData called (deprecated, using AsyncStorage)');
  }
}

export { BookingStorageService };
export type { BookingRequest, BookingWithNotification };

