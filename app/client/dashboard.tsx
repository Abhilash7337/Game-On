import { ClientService } from '@/src/client/services/clientApi';
import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Booking, Venue } from '@/src/common/types';
import {
    buttonStyles,
    cardStyles,
    clientDashboardStyles,
    clientDashboardTextStyles
} from '@/styles/screens/ClientDashboardScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
          ⭐ {venue.rating.toFixed(1)}
        </Text>
        <TouchableOpacity style={clientDashboardStyles.manageButton}>
          <Text style={clientDashboardStyles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={clientDashboardStyles.container} edges={['left', 'right', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Dashboard"
        subtitle="Manage your venues and bookings"
      >
        {/* Notification button positioned absolutely in top right */}
        <TouchableOpacity style={clientDashboardStyles.headerNotificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </AppHeader>

      <ScrollView style={clientDashboardStyles.content} showsVerticalScrollIndicator={false}>

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
          <View style={clientDashboardStyles.quickActions}>
            <Button
              title="Add Venue"
              onPress={() => Alert.alert('Add Venue', 'Add venue functionality coming soon!')}
              variant="primary"
              style={clientDashboardStyles.actionButton}
            />
            <Button
              title="View Analytics"
              onPress={() => Alert.alert('Analytics', 'Analytics functionality coming soon!')}
              variant="outline"
              style={clientDashboardStyles.actionButton}
            />
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
            todayBookings.map((booking) => (
              <View key={booking.id} style={clientDashboardStyles.bookingCard}>
                <View style={clientDashboardStyles.bookingHeader}>
                  <Text style={clientDashboardStyles.bookingTime}>{booking.time}</Text>
                  <Text style={clientDashboardStyles.bookingPrice}>₹{booking.price}</Text>
                </View>
                <Text style={clientDashboardStyles.bookingCourt}>{booking.courtId}</Text>
                <Text style={clientDashboardStyles.bookingDuration}>{booking.duration} • {booking.bookingType}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}