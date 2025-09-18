import { ApiResponse, Booking, User } from '../../common/types';

export class UserService {
  private static baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  // User Profile
  static async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/user/profile`, {
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
      const response = await fetch(`${this.baseUrl}/user/profile`, {
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

  // Bookings
  static async getUserBookings(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/user/bookings`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch bookings',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async createBooking(bookingData: Partial<Booking>): Promise<ApiResponse<Booking>> {
    try {
      const response = await fetch(`${this.baseUrl}/user/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(bookingData),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create booking',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async cancelBooking(bookingId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/user/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to cancel booking',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Open Games
  static async getAvailableOpenGames(): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/user/games/available`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch available games',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async joinOpenGame(gameId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/user/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to join game',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper methods
  private static getToken(): string {
    // In a real app, this would come from secure storage
    return 'user-auth-token';
  }
}