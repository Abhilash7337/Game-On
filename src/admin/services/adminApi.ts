import { ApiResponse, Booking, PaginatedResponse, User, Venue } from '../../common/types';

export class AdminService {
  private static baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  // Dashboard and Analytics
  static async getOverviewStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalVenues: number;
    totalBookings: number;
    revenue: number;
  }>> {
    try {
      // Return mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      return {
        success: true,
        message: 'Overview stats retrieved successfully',
        data: {
          totalUsers: 1250,
          totalVenues: 45,
          totalBookings: 8930,
          revenue: 125000
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch overview stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // User Management
  static async getAllUsers(page = 1, limit = 20): Promise<PaginatedResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users?page=${page}&limit=${limit}`, {
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
        message: 'Failed to fetch users',
      };
    }
  }

  static async getRecentUsers(limit = 5): Promise<ApiResponse<User[]>> {
    try {
      // Return mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: 'user',
          location: 'New York',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '2', 
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+1234567891',
          role: 'client',
          location: 'California',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike@example.com', 
          phone: '+1234567892',
          role: 'user',
          location: 'Texas',
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      return {
        success: true,
        message: 'Recent users retrieved successfully',
        data: mockUsers.slice(0, limit)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch recent users',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch user',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
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
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deactivateUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to deactivate user',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Venue Management
  static async getAllVenues(page = 1, limit = 20): Promise<PaginatedResponse<Venue>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/venues?page=${page}&limit=${limit}`, {
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
        message: 'Failed to fetch venues',
      };
    }
  }

  static async getRecentVenues(limit = 5): Promise<ApiResponse<Venue[]>> {
    try {
      // Return mock data instead of API call
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      const mockVenues: Venue[] = [
        {
          id: '1',
          name: 'Elite Sports Club',
          address: '123 Sports Street, New York',
          location: { latitude: 40.7128, longitude: -74.0060 },
          description: 'Premium sports facility with multiple courts',
          amenities: ['Parking', 'Cafeteria', 'Locker Rooms'],
          images: [],
          pricing: { basePrice: 50, peakHourMultiplier: 1.5, currency: 'USD' },
          operatingHours: { open: '06:00', close: '22:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
          courts: [],
          ownerId: 'client1',
          rating: 4.5,
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Champion Courts',
          address: '456 Game Avenue, California', 
          location: { latitude: 34.0522, longitude: -118.2437 },
          description: 'Modern courts with latest equipment',
          amenities: ['Air Conditioning', 'Pro Shop', 'Parking'],
          images: [],
          pricing: { basePrice: 40, peakHourMultiplier: 1.3, currency: 'USD' },
          operatingHours: { open: '07:00', close: '21:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
          courts: [],
          ownerId: 'client2',
          rating: 4.2,
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      return {
        success: true,
        message: 'Recent venues retrieved successfully',
        data: mockVenues.slice(0, limit)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch recent venues',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async approveVenue(venueId: string): Promise<ApiResponse<Venue>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/venues/${venueId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to approve venue',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async rejectVenue(venueId: string, reason: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/venues/${venueId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({ reason }),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reject venue',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async deactivateVenue(venueId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/venues/${venueId}/deactivate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to deactivate venue',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Booking Management
  static async getAllBookings(page = 1, limit = 20): Promise<PaginatedResponse<Booking>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/bookings?page=${page}&limit=${limit}`, {
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

  static async getBookingsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Booking[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/bookings/date-range?start=${startDate}&end=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch bookings by date range',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // System Reports
  static async generateReport(type: 'users' | 'venues' | 'bookings' | 'revenue', dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<any>> {
    try {
      const params = dateRange 
        ? `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        : '';
      
      const response = await fetch(`${this.baseUrl}/admin/reports/${type}${params}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate report',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // System Settings
  static async getSystemSettings(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch system settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async updateSystemSettings(settings: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(settings),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update system settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper methods
  private static getToken(): string {
    // In a real app, this would come from secure storage
    return 'admin-auth-token';
  }
}