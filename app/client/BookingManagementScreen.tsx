import AppHeader from '@/src/common/components/AppHeader';
import { Booking } from '@/src/common/types';
import { ClientService } from '@/src/client/services/clientApi';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingManagementStyles } from '@/styles/screens/BookingManagementScreen';

interface BookingWithDetails extends Booking {
  venueName?: string;
  courtName?: string;
  playerName?: string;
  playerRating?: number;
}

export default function BookingManagementScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    loadBookings();
  }, [selectedFilter]);

  const loadBookings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      const response = await ClientService.getAllBookings();
      if (response.success && response.data) {
        let filteredBookings = response.data;
        
        // Apply filters
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (selectedFilter) {
          case 'today':
            filteredBookings = response.data.filter(booking => 
              new Date(booking.date).toDateString() === today.toDateString()
            );
            break;
          case 'upcoming':
            filteredBookings = response.data.filter(booking => 
              new Date(booking.date) > now && booking.status === 'upcoming'
            );
            break;
          case 'completed':
            filteredBookings = response.data.filter(booking => 
              booking.status === 'completed'
            );
            break;
        }
        
        setBookings(filteredBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCheckIn = (booking: BookingWithDetails) => {
    Alert.alert(
      'Check In Player',
      `Mark ${booking.playerName || 'Player'} as checked in?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: () => {
            // TODO: Implement check-in logic
            Alert.alert('Success', 'Player checked in successfully');
          }
        }
      ]
    );
  };

  const handleNoShow = (booking: BookingWithDetails) => {
    Alert.alert(
      'Mark as No Show',
      `Mark ${booking.playerName || 'Player'} as no show? This will process a refund.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'No Show',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement no-show logic
            Alert.alert('Success', 'Player marked as no show');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return colors.info;
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return 'time-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const BookingCard = ({ booking }: { booking: BookingWithDetails }) => (
    <View style={bookingManagementStyles.bookingCard}>
      <View style={bookingManagementStyles.bookingHeader}>
        <View style={bookingManagementStyles.bookingInfo}>
          <Text style={bookingManagementStyles.venueName}>{booking.venueName || 'Unknown Venue'}</Text>
          <Text style={bookingManagementStyles.courtName}>{booking.courtName || booking.courtId}</Text>
          <Text style={bookingManagementStyles.playerName}>
            {booking.playerName || 'Unknown Player'}
            {booking.playerRating && (
              <Text style={bookingManagementStyles.playerRating}>
                {' '}⭐ {booking.playerRating.toFixed(1)}
              </Text>
            )}
          </Text>
        </View>
        <View style={[
          bookingManagementStyles.statusBadge,
          { backgroundColor: getStatusColor(booking.status) + '20' }
        ]}>
          <Ionicons 
            name={getStatusIcon(booking.status) as any} 
            size={14} 
            color={getStatusColor(booking.status)} 
          />
          <Text style={[
            bookingManagementStyles.statusText,
            { color: getStatusColor(booking.status) }
          ]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={bookingManagementStyles.bookingDetails}>
        <View style={bookingManagementStyles.detailRow}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={bookingManagementStyles.detailText}>
            {new Date(booking.date).toLocaleDateString()} at {booking.time}
          </Text>
        </View>
        <View style={bookingManagementStyles.detailRow}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={bookingManagementStyles.detailText}>{booking.duration}</Text>
        </View>
        <View style={bookingManagementStyles.detailRow}>
          <Ionicons name="people" size={16} color={colors.textSecondary} />
          <Text style={bookingManagementStyles.detailText}>{booking.bookingType}</Text>
        </View>
        {booking.skillLevel && (
          <View style={bookingManagementStyles.detailRow}>
            <Ionicons name="trophy" size={16} color={colors.textSecondary} />
            <Text style={bookingManagementStyles.detailText}>{booking.skillLevel}</Text>
          </View>
        )}
      </View>
      
      <View style={bookingManagementStyles.priceRow}>
        <Text style={bookingManagementStyles.priceText}>₹{booking.price}</Text>
        <Text style={bookingManagementStyles.priceLabel}>Total Amount</Text>
      </View>
      
      {booking.status === 'upcoming' && (
        <View style={bookingManagementStyles.actionButtons}>
          <TouchableOpacity
            style={[bookingManagementStyles.actionButton, bookingManagementStyles.checkInButton]}
            onPress={() => handleCheckIn(booking)}
          >
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={[bookingManagementStyles.actionButtonText, { color: colors.success }]}>
              Check In
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[bookingManagementStyles.actionButton, bookingManagementStyles.noShowButton]}
            onPress={() => handleNoShow(booking)}
          >
            <Ionicons name="close" size={16} color={colors.error} />
            <Text style={[bookingManagementStyles.actionButtonText, { color: colors.error }]}>
              No Show
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const FilterButton = ({ filter, label, count }: { filter: string; label: string; count: number }) => (
    <TouchableOpacity
      style={[
        bookingManagementStyles.filterButton,
        selectedFilter === filter && bookingManagementStyles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter as any)}
    >
      <Text style={[
        bookingManagementStyles.filterButtonText,
        selectedFilter === filter && bookingManagementStyles.filterButtonTextActive
      ]}>
        {label}
      </Text>
      <Text style={[
        bookingManagementStyles.filterCount,
        selectedFilter === filter && bookingManagementStyles.filterCountActive
      ]}>
        {count}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={bookingManagementStyles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Booking Management"
        subtitle="Manage all your bookings"
      />

      <View style={bookingManagementStyles.content}>
        <View style={bookingManagementStyles.filterSection}>
          <Text style={bookingManagementStyles.sectionTitle}>Filter Bookings</Text>
          <View style={bookingManagementStyles.filterButtons}>
            <FilterButton filter="all" label="All" count={bookings.length} />
            <FilterButton filter="today" label="Today" count={bookings.filter(b => 
              new Date(b.date).toDateString() === new Date().toDateString()
            ).length} />
            <FilterButton filter="upcoming" label="Upcoming" count={bookings.filter(b => 
              new Date(b.date) > new Date() && b.status === 'upcoming'
            ).length} />
            <FilterButton filter="completed" label="Completed" count={bookings.filter(b => 
              b.status === 'completed'
            ).length} />
          </View>
        </View>

        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BookingCard booking={item} />}
          contentContainerStyle={bookingManagementStyles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadBookings(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={bookingManagementStyles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
              <Text style={bookingManagementStyles.emptyTitle}>No Bookings Found</Text>
              <Text style={bookingManagementStyles.emptyText}>
                {selectedFilter === 'all' 
                  ? 'No bookings have been made yet'
                  : `No ${selectedFilter} bookings found`
                }
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
