import { ClientService } from '@/src/client/services/clientApi';
import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Booking, Venue } from '@/src/common/types';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load client's venues
      const venuesResponse = await ClientService.getClientVenues();
      if (venuesResponse.success && venuesResponse.data) {
        setVenues(venuesResponse.data);
      }

      // Load today's bookings
      const bookingsResponse = await ClientService.getTodayBookings();
      if (bookingsResponse.success && bookingsResponse.data) {
        setTodayBookings(bookingsResponse.data);
      }

      // Load revenue data
      const revenueResponse = await ClientService.getRevenueStats();
      if (revenueResponse.success && revenueResponse.data) {
        setRevenue(revenueResponse.data);
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
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        {change && (
          <Text style={[styles.change, { color: change.startsWith('+') ? colors.success : colors.error }]}>
            {change}
          </Text>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const VenueCard = ({ venue }: { venue: Venue }) => (
    <View style={styles.venueCard}>
      <View style={styles.venueHeader}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: venue.isActive ? colors.success + '20' : colors.error + '20' }]}>
          <Text style={[styles.statusText, { color: venue.isActive ? colors.success : colors.error }]}>
            {venue.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text style={styles.venueAddress}>{venue.address}</Text>
      <Text style={styles.venueCourts}>{venue.courts.length} courts</Text>
      <View style={styles.venueFooter}>
        <Text style={styles.venueRating}>
          ⭐ {venue.rating.toFixed(1)}
        </Text>
        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Dashboard"
        subtitle="Manage your venues and bookings"
      >
        {/* Notification button positioned absolutely in top right */}
        <TouchableOpacity style={styles.headerNotificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </AppHeader>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              title="Add Venue"
              onPress={() => Alert.alert('Add Venue', 'Add venue functionality coming soon!')}
              variant="primary"
              style={styles.actionButton}
            />
            <Button
              title="View Analytics"
              onPress={() => Alert.alert('Analytics', 'Analytics functionality coming soon!')}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Your Venues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Venues</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </View>

        {/* Recent Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Bookings</Text>
          {todayBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No bookings today</Text>
            </View>
          ) : (
            todayBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTime}>{booking.time}</Text>
                  <Text style={styles.bookingPrice}>₹{booking.price}</Text>
                </View>
                <Text style={styles.bookingCourt}>{booking.courtId}</Text>
                <Text style={styles.bookingDuration}>{booking.duration} • {booking.bookingType}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  headerBackButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 8,
    zIndex: 10,
  },
  headerNotificationButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
    zIndex: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  venueCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  venueAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  venueCourts: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  venueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueRating: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  manageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textTertiary,
    marginTop: 12,
  },
  bookingCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingTime: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  bookingCourt: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bookingDuration: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});
