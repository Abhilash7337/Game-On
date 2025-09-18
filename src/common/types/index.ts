// Common types and interfaces used across the application

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'client' | 'admin';
  location?: string;
  avatar?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  amenities: string[];
  images: string[];
  pricing: {
    basePrice: number;
    peakHourMultiplier: number;
    currency: string;
  };
  operatingHours: {
    open: string;
    close: string;
    days: string[];
  };
  courts: Court[];
  ownerId: string; // Client who owns this venue
  rating: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Court {
  id: string;
  name: string;
  venueId: string;
  type: 'badminton' | 'tennis' | 'squash' | 'basketball';
  isActive: boolean;
  maintenanceSchedule?: MaintenanceSchedule[];
}

export interface MaintenanceSchedule {
  id: string;
  courtId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  isRecurring: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  venueId: string;
  courtId: string;
  date: Date;
  time: string;
  duration: string;
  bookingType: 'Open Game' | 'Private Game';
  skillLevel?: string;
  players?: string;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  participants?: string[]; // User IDs of people who joined
  isUserGame?: boolean; // Track if this game belongs to the current user
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
}

export type UserRole = 'user' | 'client' | 'admin';
export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type CourtType = 'badminton' | 'tennis' | 'squash' | 'basketball';