import { ClientService } from '@/src/client/services/clientApi';
import { ClientAuthService } from '@/src/client/services/clientAuth';
import AppHeader from '@/src/common/components/AppHeader';
import { Booking, Venue } from '@/src/common/types';
import {
  clientDashboardStyles
} from '@/styles/screens/ClientDashboardScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientDashboardScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [revenue, setRevenue] = useState({
    today: 0,
    thisMonth: 0,
    growth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    initializeClientSession();
    loadDashboardData();
  }, []);

  const initializeClientSession = async () => {
    // Initialize demo session if not already set
    const { ClientSessionManager } = await import('@/src/client/services/clientSession');
    if (!ClientSessionManager.isAuthenticated()) {
      ClientSessionManager.setSession({
        clientId: 'current-client',
        name: 'Demo Venue Owner',
        email: 'demo@gameon.com',
        isAuthenticated: true,
      });
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Initialize demo booking data and get services
      const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
      const { ClientSessionManager } = await import('@/src/client/services/clientSession');
      BookingStorageService.initializeDemoData();
      
      // Load client's venues
      const venuesResponse = await ClientService.getClientVenues();
      if (venuesResponse.success && venuesResponse.data) {
        setVenues(venuesResponse.data);
      }

      // Load today's bookings
      const bookingsResponse = await ClientService.getTodayBookings();
      if (bookingsResponse.success && bookingsResponse.data) {
        setTodayBookings(bookingsResponse.data);
        console.log('Today Bookings:', bookingsResponse.data);
      }

      // Load revenue data
      const revenueResponse = await ClientService.getRevenueStats();
      if (revenueResponse.success && revenueResponse.data) {
        setRevenue(revenueResponse.data);
      }

      // Load pending booking requests count
      const clientId = ClientSessionManager.getCurrentClientId();
      if (clientId) {
        const pendingBookings = await BookingStorageService.getPendingBookings(clientId);
        setPendingRequestsCount(pendingBookings.length);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, change }: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    change?: string;
  }) => (
    <View style={clientDashboardStyles.statCard}>
      <View style={clientDashboardStyles.statHeader}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        {change && (
          <Text style={[clientDashboardStyles.change, { color: change.startsWith('+') ? colors.success : colors.error }]}>
            {change}
          </Text>
        )}
      </View>
      <Text style={clientDashboardStyles.statValue}>{value}</Text>
      <Text style={clientDashboardStyles.statTitle}>{title}</Text>
    </View>
  );

  const VenueCard = ({ venue }: { venue: Venue }) => (
    <View style={clientDashboardStyles.venueCard}>
      <View style={clientDashboardStyles.venueHeader}>
        <Text style={clientDashboardStyles.venueName}>{venue.name}</Text>
        <View style={[clientDashboardStyles.statusBadge, { backgroundColor: venue.isActive ? colors.success + '20' : colors.error + '20' }]}>
          <Text style={[clientDashboardStyles.statusText, { color: venue.isActive ? colors.success : colors.error }]}>
            {venue.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text style={clientDashboardStyles.venueAddress}>{venue.address}</Text>
      <Text style={clientDashboardStyles.venueCourts}>{venue.courts.length} courts</Text>
      <View style={clientDashboardStyles.venueFooter}>
        <Text style={clientDashboardStyles.venueRating}>
          {venue.rating.toFixed(1)}
        </Text>
        <TouchableOpacity style={clientDashboardStyles.manageButton}>
          <Text style={clientDashboardStyles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
            refreshing={loading}
            onRefresh={loadDashboardData}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

        {/* Stats Cards */}
        <View style={clientDashboardStyles.statsContainer}>
          <StatCard
            title="Today's Revenue"
            value={`₹${revenue.today.toLocaleString()}`}
            icon="cash-outline"
            change={`+${revenue.growth}%`}
          />
          <StatCard
            title="Today's Bookings"
            value={todayBookings.length.toString()}
            icon="calendar-outline"
          />
          <StatCard
            title="Active Venues"
            value={venues.filter(v => v.isActive).length.toString()}
            icon="location-outline"
          />
          <StatCard
            title="Monthly Revenue"
            value={`₹${revenue.thisMonth.toLocaleString()}`}
            icon="trending-up-outline"
          />
        </View>

        {/* Quick Actions */}
        <View style={clientDashboardStyles.section}>
          <Text style={clientDashboardStyles.sectionTitle}>Quick Actions</Text>
          
          <View style={clientDashboardStyles.quickActionsGrid}>
            {/* First Row - Primary Actions */}
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
                {pendingRequestsCount > 0 && (
                  <View style={clientDashboardStyles.badge}>
                    <Text style={clientDashboardStyles.badgeText}>
                      {pendingRequestsCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Second Row - Secondary Actions */}
            <TouchableOpacity
              style={clientDashboardStyles.modernActionButtonFull}
              onPress={() => Alert.alert('Analytics', 'Analytics functionality coming soon!')}
            >
              <View style={clientDashboardStyles.modernButtonContentHorizontal}>
                <View style={clientDashboardStyles.modernButtonIconOutline}>
                  <Ionicons name="analytics-outline" size={24} color={colors.primary} />
                </View>
                <Text style={clientDashboardStyles.modernButtonTextOutline}>View Analytics</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Venues */}
        <View style={clientDashboardStyles.section}>
          <View style={clientDashboardStyles.sectionHeader}>
            <Text style={clientDashboardStyles.sectionTitle}>Your Venues</Text>
            <TouchableOpacity>
              <Text style={clientDashboardStyles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </View>

        {/* Recent Bookings */}
        <View style={clientDashboardStyles.section}>
          <Text style={clientDashboardStyles.sectionTitle}>Today's Bookings</Text>
          {todayBookings.length === 0 ? (
            <View style={clientDashboardStyles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={clientDashboardStyles.emptyText}>No bookings today</Text>
            </View>
          ) : (
            todayBookings.map((booking) => {
              const bookingWithDetails = booking as any; // Type assertion for additional fields
              return (
                <View key={booking.id} style={clientDashboardStyles.bookingCard}>
                  <View style={clientDashboardStyles.bookingHeader}>
                    <Text style={clientDashboardStyles.bookingTime}>{booking.time}</Text>
                    <Text style={clientDashboardStyles.bookingPrice}>₹{booking.price}</Text>
                  </View>
                  <Text style={clientDashboardStyles.bookingCourt}>
                    {bookingWithDetails.venue || 'Unknown Venue'} - {bookingWithDetails.court || booking.courtId}
                  </Text>
                  <Text style={clientDashboardStyles.bookingDuration}>
                    {booking.duration} • {booking.bookingType}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}