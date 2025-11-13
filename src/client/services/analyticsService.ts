/**
 * ✅ PRODUCTION-READY Analytics Service
 * Fetches real-time analytics from Supabase for client dashboard
 */

import { supabase } from '@/src/common/services/supabase';

export interface DashboardAnalytics {
  todayBookings: number;
  pendingRequests: number;
  totalRevenue: number;
  activeVenues: number;
}

class AnalyticsServiceClass {
  /**
   * Get real-time dashboard analytics for client
   */
  async getDashboardAnalytics(clientId: string): Promise<DashboardAnalytics> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      console.log('📊 [ANALYTICS] Fetching dashboard data for client:', clientId);

      // Run all queries in parallel for performance
      const [
        todayBookingsResult,
        pendingRequestsResult,
        revenueResult,
        venuesResult
      ] = await Promise.allSettled([
        this.getTodayBookingsCount(clientId, today),
        this.getPendingRequestsCount(clientId),
        this.getTotalRevenue(clientId),
        this.getActiveVenuesCount(clientId)
      ]);

      return {
        todayBookings: todayBookingsResult.status === 'fulfilled' ? todayBookingsResult.value : 0,
        pendingRequests: pendingRequestsResult.status === 'fulfilled' ? pendingRequestsResult.value : 0,
        totalRevenue: revenueResult.status === 'fulfilled' ? revenueResult.value : 0,
        activeVenues: venuesResult.status === 'fulfilled' ? venuesResult.value : 0
      };
    } catch (error) {
      console.error('❌ [ANALYTICS] Error fetching dashboard analytics:', error);
      return {
        todayBookings: 0,
        pendingRequests: 0,
        totalRevenue: 0,
        activeVenues: 0
      };
    }
  }

  /**
   * Get count of today's bookings (all statuses except cancelled)
   */
  private async getTodayBookingsCount(clientId: string, today: string): Promise<number> {
    try {
      // Get all venues owned by this client
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .eq('client_id', clientId);

      if (!venues || venues.length === 0) {
        return 0;
      }

      const venueIds = venues.map(v => v.id);

      // Count today's bookings for all client's venues
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('venue_id', venueIds)
        .eq('booking_date', today)
        .neq('status', 'cancelled');

      if (error) {
        console.error('❌ [ANALYTICS] Error fetching today bookings:', error);
        return 0;
      }

      console.log(`✅ [ANALYTICS] Today's bookings: ${count || 0}`);
      return count || 0;
    } catch (error) {
      console.error('❌ [ANALYTICS] Error in getTodayBookingsCount:', error);
      return 0;
    }
  }

  /**
   * Get count of pending booking requests
   */
  private async getPendingRequestsCount(clientId: string): Promise<number> {
    try {
      // Get all venues owned by this client
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .eq('client_id', clientId);

      if (!venues || venues.length === 0) {
        return 0;
      }

      const venueIds = venues.map(v => v.id);

      // Count pending bookings for all client's venues
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('venue_id', venueIds)
        .eq('status', 'pending');

      if (error) {
        console.error('❌ [ANALYTICS] Error fetching pending requests:', error);
        return 0;
      }

      console.log(`✅ [ANALYTICS] Pending requests: ${count || 0}`);
      return count || 0;
    } catch (error) {
      console.error('❌ [ANALYTICS] Error in getPendingRequestsCount:', error);
      return 0;
    }
  }

  /**
   * Get total revenue from all confirmed bookings
   */
  private async getTotalRevenue(clientId: string): Promise<number> {
    try {
      // Get all venues owned by this client
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .eq('client_id', clientId);

      if (!venues || venues.length === 0) {
        return 0;
      }

      const venueIds = venues.map(v => v.id);

      // Sum total_amount from all confirmed bookings (regardless of payment status)
      // This matches the logic used in RevenueAnalyticsScreen
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount')
        .in('venue_id', venueIds)
        .eq('status', 'confirmed');

      if (error) {
        console.error('❌ [ANALYTICS] Error fetching revenue:', error);
        return 0;
      }

      const totalRevenue = data?.reduce((sum, booking) => {
        return sum + (parseFloat(booking.total_amount) || 0);
      }, 0) || 0;

      console.log(`✅ [ANALYTICS] Total revenue: ₹${totalRevenue}`);
      return Math.round(totalRevenue);
    } catch (error) {
      console.error('❌ [ANALYTICS] Error in getTotalRevenue:', error);
      return 0;
    }
  }

  /**
   * Get count of active venues
   */
  private async getActiveVenuesCount(clientId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [ANALYTICS] Error fetching active venues:', error);
        return 0;
      }

      console.log(`✅ [ANALYTICS] Active venues: ${count || 0}`);
      return count || 0;
    } catch (error) {
      console.error('❌ [ANALYTICS] Error in getActiveVenuesCount:', error);
      return 0;
    }
  }

  /**
   * Get detailed booking list for today
   */
  async getTodayBookingsList(clientId: string): Promise<any[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all venues owned by this client
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name')
        .eq('client_id', clientId);

      if (!venues || venues.length === 0) {
        return [];
      }

      const venueIds = venues.map(v => v.id);
      const venueMap = new Map(venues.map(v => [v.id, v.name]));

      // Fetch today's bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          courts!inner(name),
          users!inner(full_name)
        `)
        .in('venue_id', venueIds)
        .eq('booking_date', today)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('❌ [ANALYTICS] Error fetching today bookings list:', error);
        return [];
      }

      const formattedBookings = bookings?.map(b => ({
        id: b.id,
        venueName: venueMap.get(b.venue_id) || 'Unknown Venue',
        courtName: b.courts?.name || 'Unknown Court',
        userName: b.users?.full_name || 'Guest',
        startTime: b.start_time,
        endTime: b.end_time,
        duration: b.duration,
        bookingType: b.booking_type,
        playerCount: b.player_count,
        totalAmount: parseFloat(b.total_amount || 0),
        status: b.status,
        paymentStatus: b.payment_status
      })) || [];

      console.log(`✅ [ANALYTICS] Today's bookings list: ${formattedBookings.length} bookings`);
      return formattedBookings;
    } catch (error) {
      console.error('❌ [ANALYTICS] Error in getTodayBookingsList:', error);
      return [];
    }
  }
}

export const AnalyticsService = new AnalyticsServiceClass();
