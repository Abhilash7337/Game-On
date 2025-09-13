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
}

class BookingStore {
  private bookings: Booking[] = [];
  private listeners: (() => void)[] = [];

  addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'upcoming'
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
    return [...this.bookings];
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
}

export const bookingStore = new BookingStore();
