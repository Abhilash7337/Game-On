// Simple booking store for managing upcoming games
export interface Booking {
  id: string;
  venue: string;
  court: string;
  date: Date;
  time: string;
  duration: string;
  bookingType: 'Open Game' | 'Private Game';
  skillLevel?: string;
  players?: string;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: Date;
  isUserGame?: boolean; // Track if this game belongs to the current user
}

class BookingStore {
  private bookings: Booking[] = [];
  private listeners: (() => void)[] = [];

  addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'isUserGame'>) {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'upcoming',
      isUserGame: true // Mark as user's game since they're creating it
    };
    
    this.bookings.push(newBooking);
    this.notifyListeners();
  }

  getUpcomingBookings(): Booking[] {
    return this.bookings
      .filter(booking => booking.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getAllBookings(): Booking[] {
    return [...this.bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getCompletedBookings(): Booking[] {
    return this.bookings
      .filter(booking => booking.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getBookingsByStatus(status: 'upcoming' | 'completed' | 'cancelled'): Booking[] {
    return this.bookings
      .filter(booking => booking.status === status)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get only Open Games that are upcoming and available for joining (not user's games)
  getAvailableOpenGames(): Booking[] {
    return this.bookings
      .filter(booking => 
        booking.status === 'upcoming' && 
        booking.bookingType === 'Open Game' &&
        new Date(booking.date).getTime() > Date.now() && // Future games only
        !booking.isUserGame // Exclude user's own games
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Get user's own Open Games (both upcoming and past)
  getUserOpenGames(): Booking[] {
    return this.bookings
      .filter(booking => booking.bookingType === 'Open Game' && booking.isUserGame)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Get user's upcoming Open Games
  getUserUpcomingOpenGames(): Booking[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    
    return this.bookings
      .filter(booking => 
        booking.bookingType === 'Open Game' && 
        booking.status === 'upcoming' &&
        new Date(booking.date).getTime() >= today.getTime() && // Include today's games
        booking.isUserGame
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Add a game that belongs to another user (for simulation purposes)
  addOtherUserGame(booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'isUserGame'>) {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString() + '_other',
      createdAt: new Date(),
      status: 'upcoming',
      isUserGame: false // Mark as other user's game
    };
    
    this.bookings.push(newBooking);
    this.notifyListeners();
  }
}

export const bookingStore = new BookingStore();
