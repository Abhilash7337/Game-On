import { ApiResponse, Booking, PaginatedResponse, User, Venue } from '../../common/types';
import { ClientSessionManager } from './clientSession';

export class ClientService {
  private static baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Venue Management
  static async getClientVenues(): Promise<ApiResponse<Venue[]>> {
    try {
      // Get current client ID
      const clientId = ClientSessionManager.getCurrentClientId();
      if (!clientId) {
        return {
          success: false,
          message: 'Client not authenticated',
          error: 'No client session found',
        };
      }

      // Use VenueStorageService to get venues by owner
      const { VenueStorageService } = await import('../../common/services/venueStorage');
      const venues = await VenueStorageService.getVenuesByOwner(clientId);
      
      return {
        success: true,
        message: 'Client venues retrieved successfully',
        data: venues
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch venues',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createVenue(venueData: Partial<Venue>): Promise<ApiResponse<Venue>> {
    try {
      const response = await fetch(`${this.baseUrl}/client/venues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(venueData),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create venue',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateVenue(venueId: string, venueData: Partial<Venue>): Promise<ApiResponse<Venue>> {
    try {
      const response = await fetch(`${this.baseUrl}/client/venues/${venueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(venueData),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update venue',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteVenue(venueId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/client/venues/${venueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete venue',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Booking Management
  static async getVenueBookings(venueId: string): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/client/venues/${venueId}/bookings`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch venue bookings',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getTodayBookings(): Promise<ApiResponse<Booking[]>> {
    try {
      // Get current client ID
      const clientId = ClientSessionManager.getCurrentClientId();
      if (!clientId) {
        return {
          success: false,
          message: 'Client not authenticated',
          error: 'No client session found',
        };
      }

      // Get client's bookings from BookingStorageService
      const { BookingStorageService } = await import('../../common/services/bookingStorage');
      const allClientBookings = await BookingStorageService.getBookingsByClient(clientId);
      
      // Filter for today's bookings (confirmed bookings only)
      const today = new Date();
      const todayStr = today.toDateString();
      
      const todayBookings = allClientBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.toDateString() === todayStr && 
               (booking as any).bookingStatus === 'confirmed';
      });
      
      return {
        success: true,
        message: 'Today\'s bookings retrieved successfully',
        data: todayBookings
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch today\'s bookings',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getAllBookings(page = 1, limit = 20): Promise<PaginatedResponse<Booking>> {
    try {
      const response = await fetch(`${this.baseUrl}/client/bookings?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        message: 'Failed to fetch bookings',
      };
    }
  }

  // Analytics and Revenue
  static async getRevenueStats(): Promise<ApiResponse<{
    today: number;
    thisMonth: number;
    growth: number;
  }>> {
    try {
      // Get current client ID
      const clientId = ClientSessionManager.getCurrentClientId();
      if (!clientId) {
        return {
          success: false,
          message: 'Client not authenticated',
          error: 'No client session found',
        };
      }

      // Get client's bookings from BookingStorageService
      const { BookingStorageService } = await import('../../common/services/bookingStorage');
      const allClientBookings = await BookingStorageService.getBookingsByClient(clientId);
      
      // Filter confirmed bookings only
      const confirmedBookings = allClientBookings.filter(booking => 
        (booking as any).bookingStatus === 'confirmed'
      );
      
      // Calculate today's revenue
      const today = new Date();
      const todayStr = today.toDateString();
      const todayBookings = confirmedBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.toDateString() === todayStr;
      });
      const todayRevenue = todayBookings.reduce((sum, booking) => sum + booking.price, 0);
      
      // Calculate this month's revenue
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const thisMonthBookings = confirmedBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= thisMonth && bookingDate < nextMonth;
      });
      const thisMonthRevenue = thisMonthBookings.reduce((sum, booking) => sum + booking.price, 0);
      
      // Calculate last month's revenue for growth calculation
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthBookings = confirmedBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= lastMonth && bookingDate < thisMonth;
      });
      const lastMonthRevenue = lastMonthBookings.reduce((sum, booking) => sum + booking.price, 0);
      
      // Calculate growth percentage
      const growth = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0 ? 100 : 0;
      
      return {
        success: true,
        message: 'Revenue stats retrieved successfully',
        data: {
          today: todayRevenue,
          thisMonth: thisMonthRevenue,
          growth: Math.round(growth * 10) / 10 // Round to 1 decimal place
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch revenue stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getBookingStats(venueId?: string): Promise<ApiResponse<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    revenue: number;
  }>> {
    try {
      const url = venueId 
        ? `${this.baseUrl}/client/analytics/bookings?venueId=${venueId}`
        : `${this.baseUrl}/client/analytics/bookings`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch booking stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Profile Management
  static async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/client/profile`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/client/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper methods
  private static getToken(): string {
    // In a real app, this would come from secure storage
    return 'client-auth-token';
  }
}