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

      // Get client's venues first
      const venuesResponse = await this.getClientVenues();
      if (!venuesResponse.success || !venuesResponse.data) {
        return {
          success: true,
          message: 'No bookings found',
          data: []
        };
      }

      const clientVenueIds = venuesResponse.data.map(venue => venue.id);
      
      // For now, return empty array since we don't have a booking system yet
      // TODO: Implement actual booking storage and filtering
      const mockBookings: Booking[] = [];
      
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
      // Get current client ID
      const clientId = ClientSessionManager.getCurrentClientId();
      if (!clientId) {
        return {
          success: false,
          message: 'Client not authenticated',
          error: 'No client session found',
        };
      }

      // Get client's venues to calculate revenue
      const venuesResponse = await this.getClientVenues();
      if (!venuesResponse.success || !venuesResponse.data) {
        return {
          success: true,
          message: 'Revenue stats retrieved successfully',
          data: {
            today: 0,
            thisMonth: 0,
            growth: 0
          }
        };
      }

      // TODO: Calculate actual revenue based on bookings
      // For now, return demo data based on number of venues
      const venueCount = venuesResponse.data.length;
      const baseRevenue = venueCount * 500; // Base calculation
      
      return {
        success: true,
        message: 'Revenue stats retrieved successfully',
        data: {
          today: baseRevenue * 0.1, // 10% of base
          thisMonth: baseRevenue,
          growth: venueCount > 0 ? 15.0 : 0
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