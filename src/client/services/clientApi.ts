import { ApiResponse, Booking, PaginatedResponse, User, Venue } from '../../common/types';

export class ClientService {
  private static baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Venue Management
  static async getClientVenues(): Promise<ApiResponse<Venue[]>> {
    try {
      // Return mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const mockVenues: Venue[] = [
        {
          id: '1',
          name: 'My Sports Center',
          address: '789 Owner Street, Texas',
          location: { latitude: 32.7767, longitude: -96.7970 },
          description: 'My premier sports facility',
          amenities: ['Parking', 'Cafeteria', 'Pro Shop', 'Locker Rooms'],
          images: [],
          pricing: { basePrice: 60, peakHourMultiplier: 1.4, currency: 'USD' },
          operatingHours: { open: '06:00', close: '23:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
          courts: [],
          ownerId: 'currentClient',
          rating: 4.7,
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      return {
        success: true,
        message: 'Client venues retrieved successfully',
        data: mockVenues
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
      // Return mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      const mockBookings: Booking[] = [
        {
          id: '1',
          userId: 'user1',
          venueId: '1',
          courtId: 'court1',
          date: new Date(),
          time: '10:00',
          duration: '1 hr',
          status: 'upcoming',
          price: 50,
          bookingType: 'Private Game',
          paymentStatus: 'paid',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2', 
          userId: 'user2',
          venueId: '1',
          courtId: 'court2',
          date: new Date(),
          time: '14:00',
          duration: '1.5 hr',
          status: 'upcoming',
          price: 75,
          bookingType: 'Open Game',
          paymentStatus: 'paid',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      return {
        success: true,
        message: 'Today\'s bookings retrieved successfully',
        data: mockBookings
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
      // Return mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      return {
        success: true,
        message: 'Revenue stats retrieved successfully',
        data: {
          today: 125,
          thisMonth: 3450,
          growth: 12.5
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