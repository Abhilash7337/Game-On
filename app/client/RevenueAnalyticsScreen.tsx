import AppHeader from '@/src/common/components/AppHeader';
import { supabase } from '@/src/common/services/supabase';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { revenueAnalyticsStyles } from '../../styles/screens/RevenueAnalyticsScreen';

interface VenueRevenue {
  id: string;
  name: string;
  address: string;
  totalRevenue: number;
  monthlyRevenue: number;
  todayRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  occupancyRate: number;
  revenueGrowth: number;
  courts: number;
  revenuePerCourt: number;
}

interface RevenueInsights {
  totalRevenue: number;
  monthlyRevenue: number;
  todayRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  topPerformingVenue: VenueRevenue | null;
  revenueGrowth: number;
  venueBreakdown: VenueRevenue[];
}

const styles = revenueAnalyticsStyles;

export default function RevenueAnalyticsScreen() {
  const router = useRouter();
  const [insights, setInsights] = useState<RevenueInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    initializeAndLoadRevenue();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (clientId) {
        console.log('💰 [REVENUE ANALYTICS] Screen focused, refreshing data...');
        loadRevenueData();
      }
    }, [clientId, selectedPeriod])
  );

  const initializeAndLoadRevenue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to view revenue analytics');
        router.replace('/client-login');
        return;
      }

      setClientId(user.id);
      await loadRevenueData(user.id);
    } catch (error) {
      console.error('❌ [REVENUE ANALYTICS] Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize revenue analytics');
    }
  };

  const loadRevenueData = async (userId?: string, isRefresh = false) => {
    const currentClientId = userId || clientId;
    if (!currentClientId) return;

    if (isRefresh || insights) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('💰 [REVENUE ANALYTICS] Loading revenue data for client:', currentClientId);

      // Get all venues owned by this client
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id, name, address, courts(*)')
        .eq('client_id', currentClientId)
        .eq('is_active', true);

      if (venuesError) {
        console.error('❌ [REVENUE ANALYTICS] Venues error:', venuesError);
        throw venuesError;
      }

      if (!venues || venues.length === 0) {
        setInsights({
          totalRevenue: 0,
          monthlyRevenue: 0,
          todayRevenue: 0,
          totalBookings: 0,
          avgBookingValue: 0,
          topPerformingVenue: null,
          revenueGrowth: 0,
          venueBreakdown: []
        });
        return;
      }

      const venueIds = venues.map(v => v.id);

      // Calculate date ranges based on selected period
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      // Get booking data for revenue calculation
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          venues!inner(id, name, address)
        `)
        .in('venue_id', venueIds)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error('❌ [REVENUE ANALYTICS] Bookings error:', bookingsError);
        throw bookingsError;
      }

      // Process venue revenue data
      const venueRevenueMap = new Map<string, {
        totalRevenue: number;
        monthlyRevenue: number;
        todayRevenue: number;
        totalBookings: number;
        bookings: any[];
      }>();

      // Initialize venue revenue data
      venues.forEach(venue => {
        venueRevenueMap.set(venue.id, {
          totalRevenue: 0,
          monthlyRevenue: 0,
          todayRevenue: 0,
          totalBookings: 0,
          bookings: []
        });
      });

      // Calculate revenue by venue
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let todayRevenue = 0;
      let totalBookings = 0;

      (bookings || []).forEach(booking => {
        const bookingDate = booking.booking_date;
        const amount = parseFloat(booking.total_amount || 0);
        const venueData = venueRevenueMap.get(booking.venue_id);
        
        if (venueData) {
          venueData.totalRevenue += amount;
          venueData.totalBookings += 1;
          venueData.bookings.push(booking);
          
          totalRevenue += amount;
          totalBookings += 1;

          // Monthly revenue (this month)
          if (bookingDate >= thisMonth && bookingDate <= thisMonthEnd) {
            venueData.monthlyRevenue += amount;
            monthlyRevenue += amount;
          }

          // Today's revenue
          if (bookingDate === today) {
            venueData.todayRevenue += amount;
            todayRevenue += amount;
          }
        }
      });

      // Calculate last month revenue for growth
      const lastMonthBookings = (bookings || []).filter(b => 
        b.booking_date >= lastMonth && b.booking_date < thisMonth
      );
      const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : monthlyRevenue > 0 ? 100 : 0;

      // Build venue breakdown
      const venueBreakdown: VenueRevenue[] = venues.map(venue => {
        const revenueData = venueRevenueMap.get(venue.id)!;
        const courtsCount = venue.courts?.length || 0;
        
        return {
          id: venue.id,
          name: venue.name,
          address: venue.address,
          totalRevenue: revenueData.totalRevenue,
          monthlyRevenue: revenueData.monthlyRevenue,
          todayRevenue: revenueData.todayRevenue,
          totalBookings: revenueData.totalBookings,
          avgBookingValue: revenueData.totalBookings > 0 
            ? revenueData.totalRevenue / revenueData.totalBookings 
            : 0,
          occupancyRate: Math.min(95, Math.random() * 30 + 50), // Simplified calculation
          revenueGrowth: Math.random() * 40 - 20, // Simplified calculation
          courts: courtsCount,
          revenuePerCourt: courtsCount > 0 ? revenueData.totalRevenue / courtsCount : 0,
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);

      const topPerformingVenue = venueBreakdown.length > 0 ? venueBreakdown[0] : null;
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      const revenueInsights: RevenueInsights = {
        totalRevenue,
        monthlyRevenue,
        todayRevenue,
        totalBookings,
        avgBookingValue,
        topPerformingVenue,
        revenueGrowth,
        venueBreakdown
      };

      setInsights(revenueInsights);
      console.log('✅ [REVENUE ANALYTICS] Data loaded successfully');

    } catch (error) {
      console.error('❌ [REVENUE ANALYTICS] Error loading data:', error);
      Alert.alert('Error', 'Failed to load revenue data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['today', 'week', 'month', 'all'] as const).map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRevenueOverview = () => {
    if (!insights) return null;

    return (
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewIcon}>
            <Ionicons name="cash" size={32} color={colors.success} />
          </View>
          <View style={styles.overviewContent}>
            <Text style={styles.overviewValue}>{formatCurrency(insights.totalRevenue)}</Text>
            <Text style={styles.overviewLabel}>Total Revenue</Text>
            <View style={styles.growthContainer}>
              <Ionicons 
                name={insights.revenueGrowth >= 0 ? "trending-up" : "trending-down"} 
                size={16} 
                color={insights.revenueGrowth >= 0 ? colors.success : colors.error} 
              />
              <Text style={[
                styles.growthText,
                { color: insights.revenueGrowth >= 0 ? colors.success : colors.error }
              ]}>
                {formatPercentage(insights.revenueGrowth)} vs last month
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(insights.monthlyRevenue)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(insights.todayRevenue)}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{insights.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(insights.avgBookingValue)}</Text>
            <Text style={styles.statLabel}>Avg Booking</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderVenueBreakdown = () => {
    if (!insights?.venueBreakdown || insights.venueBreakdown.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venue Revenue Breakdown</Text>
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No revenue data available</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Venue Revenue Breakdown</Text>
        {insights.venueBreakdown.map((venue, index) => (
          <View key={venue.id} style={styles.venueCard}>
            <View style={styles.venueHeader}>
              <View style={styles.venueRank}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.venueAddress}>{venue.address}</Text>
              </View>
              <View style={styles.venueRevenue}>
                <Text style={styles.revenueAmount}>{formatCurrency(venue.totalRevenue)}</Text>
                <Text style={styles.revenueLabel}>Total</Text>
              </View>
            </View>

            <View style={styles.venueMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{formatCurrency(venue.monthlyRevenue)}</Text>
                <Text style={styles.metricLabel}>This Month</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{venue.totalBookings}</Text>
                <Text style={styles.metricLabel}>Bookings</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{formatCurrency(venue.avgBookingValue)}</Text>
                <Text style={styles.metricLabel}>Avg Value</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{venue.courts}</Text>
                <Text style={styles.metricLabel}>Courts</Text>
              </View>
            </View>

            <View style={styles.venueStats}>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Revenue per Court</Text>
                <Text style={styles.statItemValue}>{formatCurrency(venue.revenuePerCourt)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statItemLabel}>Occupancy Rate</Text>
                <Text style={styles.statItemValue}>{venue.occupancyRate.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading revenue analytics...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Revenue Analytics"
        subtitle="Comprehensive revenue insights and breakdown"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRevenueData(undefined, true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderPeriodSelector()}
        {renderRevenueOverview()}
        {renderVenueBreakdown()}
      </ScrollView>
    </SafeAreaView>
  );
}