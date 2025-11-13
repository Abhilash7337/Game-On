import { AnalyticsService } from '@/src/client/services/analyticsService';
import { ClientAuthService } from '@/src/client/services/clientAuth';
import AppHeader from '@/src/common/components/AppHeader';
import {
  clientDashboardStyles
} from '@/styles/screens/ClientDashboardScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardAnalytics {
  todayBookings: number;
  pendingRequests: number;
  totalRevenue: number;
  activeVenues: number;
}

interface TodayBooking {
  id: string;
  venueName: string;
  courtName: string;
  userName: string;
  startTime: string;
  endTime: string;
  duration: string;
  bookingType: string;
  playerCount: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

export default function ClientDashboardScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    todayBookings: 0,
    pendingRequests: 0,
    totalRevenue: 0,
    activeVenues: 0
  });
  const [todayBookingsList, setTodayBookingsList] = useState<TodayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const bookingSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    initializeClientSession();
    loadDashboardData();
    
    return () => {
      // Cleanup subscription on unmount
      if (bookingSubscriptionRef.current) {
        bookingSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // ✅ Refresh dashboard when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (clientId) {
        console.log('🔄 [DASHBOARD] Screen focused, refreshing data...');
        loadDashboardData();
      }
    }, [clientId])
  );

  const initializeClientSession = async () => {
    // Check if client is authenticated
    const { ClientAuthService } = await import('@/src/client/services/clientAuth');
    const client = await ClientAuthService.getCurrentSession();
    
    if (!client) {
      // Not authenticated, redirect to login
      Alert.alert(
        'Authentication Required',
        'Please sign in to access your dashboard',
        [
          {
            text: 'Sign In',
            onPress: () => router.replace('/client-login')
          }
        ]
      );
    }
  };

  const loadDashboardData = async () => {
    // Use refreshing state if already loaded, otherwise use loading
    if (analytics.todayBookings > 0 || analytics.pendingRequests > 0) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Get current client ID
      const { supabase } = await import('@/src/common/services/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        console.error('❌ [DASHBOARD] No authenticated user');
        return;
      }

      setClientId(user.id);
      console.log('📊 [DASHBOARD] Loading analytics for client:', user.id);

      // Fetch real-time analytics from Supabase
      const analyticsData = await AnalyticsService.getDashboardAnalytics(user.id);
      setAnalytics(analyticsData);

      // Fetch today's bookings list
      const bookings = await AnalyticsService.getTodayBookingsList(user.id);
      setTodayBookingsList(bookings);

      console.log('✅ [DASHBOARD] Analytics loaded:', analyticsData);

      // ✅ Set up real-time subscription for booking updates
      setupRealtimeSubscription(user.id);

    } catch (error) {
      console.error('❌ [DASHBOARD] Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = async (userId: string) => {
    try {
      // Cleanup existing subscription
      if (bookingSubscriptionRef.current) {
        bookingSubscriptionRef.current.unsubscribe();
      }

      const { supabase } = await import('@/src/common/services/supabase');

      // Get all venues owned by this client
      const { data: venues } = await supabase
        .from('venues')
        .select('id')
        .eq('client_id', userId);

      if (!venues || venues.length === 0) {
        console.log('⚠️ [DASHBOARD] No venues found for real-time subscription');
        return;
      }

      const venueIds = venues.map(v => v.id);
      console.log(`📡 [DASHBOARD] Setting up real-time for ${venueIds.length} venues`);

      // Subscribe to booking changes for all client's venues
      bookingSubscriptionRef.current = supabase
        .channel('dashboard-bookings')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'bookings'
          },
          (payload: any) => {
            // Check if the booking is for one of this client's venues
            const bookingVenueId = payload.new?.venue_id || payload.old?.venue_id;
            if (venueIds.includes(bookingVenueId)) {
              console.log('🔔 [DASHBOARD] Booking change detected:', payload.eventType);
              // Reload dashboard data when bookings change
              loadDashboardData();
            }
          }
        )
        .subscribe();

      console.log('✅ [DASHBOARD] Real-time subscription active');
    } catch (error) {
      console.error('❌ [DASHBOARD] Failed to set up real-time subscription:', error);
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={clientDashboardStyles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={clientDashboardStyles.statHeader}>
        <Ionicons name={icon} size={24} color={color || colors.primary} />
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        )}
      </View>
      <Text style={clientDashboardStyles.statValue}>{value}</Text>
      <Text style={clientDashboardStyles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const handleStatCardPress = (cardType: 'venues' | 'revenue' | 'bookings' | 'requests') => {
    switch (cardType) {
      case 'venues':
        router.push('/client/VenueManagementScreen');
        break;
      case 'revenue':
        router.push('/client/RevenueAnalyticsScreen');
        break;
      case 'bookings':
        router.push('/client/BookingHistoryScreen');
        break;
      case 'requests':
        router.push('/client/BookingRequestsScreen');
        break;
      default:
        break;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ClientAuthService.signOut();
              setShowProfileMenu(false);
              router.replace('/client-login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={clientDashboardStyles.container} edges={['left', 'right', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false // Disable swipe back gesture on iOS
        }} 
      />
      
      <AppHeader 
        title="Dashboard"
        subtitle="Manage your venues and bookings"
      >
        {/* Header Actions - Notification and Profile */}
        <View style={clientDashboardStyles.headerActions}>
          <TouchableOpacity style={clientDashboardStyles.headerIconButton}>
            <Ionicons name="notifications-outline" size={26} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={clientDashboardStyles.headerIconButton}
            onPress={() => setShowProfileMenu(true)}
          >
            <Ionicons name="person-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </AppHeader>

      {/* Profile Menu Modal */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowProfileMenu(false)}>
          <View style={clientDashboardStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={clientDashboardStyles.profileMenu}>
                <View style={clientDashboardStyles.profileMenuHeader}>
                  <View style={clientDashboardStyles.profileAvatar}>
                    <Ionicons name="person" size={32} color={colors.primary} />
                  </View>
                  <View style={clientDashboardStyles.profileInfo}>
                    <Text style={clientDashboardStyles.profileName}>Demo Venue Owner</Text>
                    <Text style={clientDashboardStyles.profileEmail}>demo@gameon.com</Text>
                  </View>
                </View>
                
                <View style={clientDashboardStyles.profileMenuDivider} />
                
                <TouchableOpacity 
                  style={clientDashboardStyles.profileMenuItem}
                  onPress={() => {
                    setShowProfileMenu(false);
                    Alert.alert('Coming Soon', 'Profile settings will be available soon!');
                  }}
                >
                  <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
                  <Text style={clientDashboardStyles.profileMenuItemText}>Settings</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[clientDashboardStyles.profileMenuItem, clientDashboardStyles.logoutMenuItem]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                  <Text style={clientDashboardStyles.logoutMenuItemText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ScrollView 
        style={clientDashboardStyles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadDashboardData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

        {/* Stats Cards - Only Important Metrics */}
        <View style={clientDashboardStyles.statsContainer}>
          <StatCard
            title="Today's Bookings"
            value={analytics.todayBookings.toString()}
            icon="calendar-outline"
            color={colors.primary}
            onPress={() => handleStatCardPress('bookings')}
          />
          <StatCard
            title="Pending Requests"
            value={analytics.pendingRequests.toString()}
            icon="mail-outline"
            color="#F59E0B"
            onPress={() => handleStatCardPress('requests')}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${analytics.totalRevenue.toLocaleString()}`}
            icon="cash-outline"
            color="#10B981"
            onPress={() => handleStatCardPress('revenue')}
          />
          <StatCard
            title="Active Venues"
            value={analytics.activeVenues.toString()}
            icon="location-outline"
            color="#8B5CF6"
            onPress={() => handleStatCardPress('venues')}
          />
        </View>

        {/* Quick Actions */}
        <View style={clientDashboardStyles.section}>
          <Text style={clientDashboardStyles.sectionTitle}>Quick Actions</Text>
          
          <View style={clientDashboardStyles.quickActionsGrid}>
            {/* Primary Actions */}
            <View style={clientDashboardStyles.quickActions}>
              <TouchableOpacity
                style={clientDashboardStyles.modernActionButton}
                onPress={() => router.push('/add-venue')}
              >
                <View style={clientDashboardStyles.modernButtonContent}>
                  <View style={clientDashboardStyles.modernButtonIcon}>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                  </View>
                  <Text style={clientDashboardStyles.modernButtonText}>Add Venue</Text>
                </View>
              </TouchableOpacity>
              
              <View style={clientDashboardStyles.buttonWithBadge}>
                <TouchableOpacity
                  style={clientDashboardStyles.modernActionButtonOutline}
                  onPress={() => router.push('/client/BookingRequestsScreen' as any)}
                >
                  <View style={clientDashboardStyles.modernButtonContent}>
                    <View style={clientDashboardStyles.modernButtonIconOutline}>
                      <Ionicons name="mail-outline" size={24} color={colors.primary} />
                    </View>
                    <Text style={clientDashboardStyles.modernButtonTextOutline}>Requests</Text>
                  </View>
                </TouchableOpacity>
                {analytics.pendingRequests > 0 && (
                  <View style={clientDashboardStyles.badge}>
                    <Text style={clientDashboardStyles.badgeText}>
                      {analytics.pendingRequests}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Today's Bookings Detail */}
        <View style={clientDashboardStyles.section}>
          <Text style={clientDashboardStyles.sectionTitle}>Today's Bookings</Text>
          {todayBookingsList.length === 0 ? (
            <View style={clientDashboardStyles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={clientDashboardStyles.emptyText}>No bookings today</Text>
            </View>
          ) : (
            todayBookingsList.map((booking) => (
              <View key={booking.id} style={clientDashboardStyles.bookingCard}>
                <View style={clientDashboardStyles.bookingHeader}>
                  <Text style={clientDashboardStyles.bookingTime}>
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </Text>
                  <Text style={clientDashboardStyles.bookingPrice}>₹{booking.totalAmount}</Text>
                </View>
                <Text style={clientDashboardStyles.bookingCourt}>
                  {booking.venueName} - {booking.courtName}
                </Text>
                <View style={clientDashboardStyles.bookingFooter}>
                  <Text style={clientDashboardStyles.bookingDuration}>
                    {booking.userName} • {booking.playerCount} {booking.playerCount > 1 ? 'players' : 'player'}
                  </Text>
                  <View style={[
                    clientDashboardStyles.statusBadge, 
                    { 
                      backgroundColor: booking.status === 'confirmed' 
                        ? colors.success + '20' 
                        : booking.status === 'pending' 
                        ? '#F59E0B20' 
                        : colors.error + '20' 
                    }
                  ]}>
                    <Text style={[
                      clientDashboardStyles.statusText, 
                      { 
                        color: booking.status === 'confirmed' 
                          ? colors.success 
                          : booking.status === 'pending' 
                          ? '#F59E0B' 
                          : colors.error 
                      }
                    ]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}