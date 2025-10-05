import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Booking, Venue } from '@/src/common/types';
import { ClientService } from '@/src/client/services/clientApi';
import {
  bookingManagementStyles,
  bookingManagementTextStyles
} from '@/styles/screens/BookingManagementScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type BookingStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';
type BookingFilter = 'today' | 'week' | 'month';

export default function BookingManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('all');
  const [timeFilter, setTimeFilter] = useState<BookingFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBookings();
    loadVenues();
  }, [selectedVenue, statusFilter, timeFilter]);

  const loadVenues = async () => {
    try {
      const response = await ClientService.getClientVenues();
      if (response.success && response.data) {
        setVenues(response.data);
      }
    } catch (error) {
      console.error('Failed to load venues:', error);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Mock booking data - in real app, this would come from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBookings: Booking[] = [
        {
          id: '1',
          userId: 'user1',
          venueId: '1',
          courtId: 'Court A1',
          date: new Date(),
          time: '10:00',
          duration: '1 hr',
          status: 'upcoming',
          price: 500,
          bookingType: 'Private Game',
          paymentStatus: 'paid',
          participants: ['user1'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          userId: 'user2',
          venueId: '1',
          courtId: 'Court B1',
          date: new Date(),
          time: '14:00',
          duration: '1.5 hr',
          status: 'upcoming',
          price: 750,
          bookingType: 'Open Game',
          paymentStatus: 'paid',
          participants: ['user2', 'user3'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          userId: 'user4',
          venueId: '1',
          courtId: 'Court A2',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          time: '16:00',
          duration: '2 hr',
          status: 'completed',
          price: 1000,
          bookingType: 'Private Game',
          paymentStatus: 'paid',
          participants: ['user4'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setBookings(mockBookings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesVenue = selectedVenue === 'all' || booking.venueId === selectedVenue;
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      booking.courtId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingType.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesVenue && matchesStatus && matchesSearch;
  });

  const handleBookingAction = (bookingId: string, action: 'approve' | 'reject' | 'cancel') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          onPress: () => {
            // In real app, this would call the API
            Alert.alert('Success', `Booking ${action}d successfully`);
            loadBookings();
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

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <View style={bookingManagementStyles.bookingCard}>
      <View style={bookingManagementStyles.bookingHeader}>
        <View style={bookingManagementStyles.bookingInfo}>
          <Text style={bookingManagementStyles.courtName}>{booking.courtId}</Text>
          <Text style={bookingManagementStyles.bookingType}>{booking.bookingType}</Text>
        </View>
        <View style={[
          bookingManagementStyles.statusBadge,
          { backgroundColor: getStatusColor(booking.status) + '20' }
        ]}>
          <Ionicons 
            name={getStatusIcon(booking.status) as any} 
            size={16} 
            color={getStatusColor(booking.status)} 
          />
          <Text style={[
            bookingManagementStyles.statusText,
            { color: getStatusColor(booking.status) }
          ]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={bookingManagementStyles.bookingDetails}>
        <View style={bookingManagementStyles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={bookingManagementStyles.detailText}>
            {booking.date.toLocaleDateString()} at {booking.time}
          </Text>
        </View>
        <View style={bookingManagementStyles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={bookingManagementStyles.detailText}>{booking.duration}</Text>
        </View>
        <View style={bookingManagementStyles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
          <Text style={bookingManagementStyles.detailText}>₹{booking.price}</Text>
        </View>
        {booking.participants && booking.participants.length > 0 && (
          <View style={bookingManagementStyles.detailRow}>
            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
            <Text style={bookingManagementStyles.detailText}>
              {booking.participants.length} participant(s)
            </Text>
          </View>
        )}
      </View>

      {booking.status === 'upcoming' && (
        <View style={bookingManagementStyles.actionButtons}>
          <TouchableOpacity
            style={[bookingManagementStyles.actionButton, bookingManagementStyles.approveButton]}
            onPress={() => handleBookingAction(booking.id, 'approve')}
          >
            <Ionicons name="checkmark" size={16} color={colors.textInverse} />
            <Text style={bookingManagementStyles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[bookingManagementStyles.actionButton, bookingManagementStyles.rejectButton]}
            onPress={() => handleBookingAction(booking.id, 'reject')}
          >
            <Ionicons name="close" size={16} color={colors.textInverse} />
            <Text style={bookingManagementStyles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const FilterChip = ({ label, value, isSelected, onPress }: {
    label: string;
    value: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        bookingManagementStyles.filterChip,
        isSelected && bookingManagementStyles.filterChipSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        bookingManagementStyles.filterChipText,
        isSelected && bookingManagementStyles.filterChipTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={bookingManagementStyles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Booking Management"
        subtitle="Manage your venue bookings"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </AppHeader>

      <View style={bookingManagementStyles.content}>
        {/* Filters */}
        <View style={bookingManagementStyles.filtersContainer}>
          <Text style={bookingManagementStyles.filterLabel}>Status:</Text>
          <View style={bookingManagementStyles.filterRow}>
            <FilterChip
              label="All"
              value="all"
              isSelected={statusFilter === 'all'}
              onPress={() => setStatusFilter('all')}
            />
            <FilterChip
              label="Upcoming"
              value="upcoming"
              isSelected={statusFilter === 'upcoming'}
              onPress={() => setStatusFilter('upcoming')}
            />
            <FilterChip
              label="Completed"
              value="completed"
              isSelected={statusFilter === 'completed'}
              onPress={() => setStatusFilter('completed')}
            />
            <FilterChip
              label="Cancelled"
              value="cancelled"
              isSelected={statusFilter === 'cancelled'}
              onPress={() => setStatusFilter('cancelled')}
            />
          </View>

          <Text style={bookingManagementStyles.filterLabel}>Time Range:</Text>
          <View style={bookingManagementStyles.filterRow}>
            <FilterChip
              label="Today"
              value="today"
              isSelected={timeFilter === 'today'}
              onPress={() => setTimeFilter('today')}
            />
            <FilterChip
              label="This Week"
              value="week"
              isSelected={timeFilter === 'week'}
              onPress={() => setTimeFilter('week')}
            />
            <FilterChip
              label="This Month"
              value="month"
              isSelected={timeFilter === 'month'}
              onPress={() => setTimeFilter('month')}
            />
          </View>
        </View>

        {/* Bookings List */}
        <View style={bookingManagementStyles.bookingsContainer}>
          <Text style={bookingManagementStyles.bookingsTitle}>
            Bookings ({filteredBookings.length})
          </Text>
          
          {loading ? (
            <View style={bookingManagementStyles.loadingContainer}>
              <Text style={bookingManagementStyles.loadingText}>Loading bookings...</Text>
            </View>
          ) : filteredBookings.length === 0 ? (
            <View style={bookingManagementStyles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={bookingManagementStyles.emptyText}>No bookings found</Text>
              <Text style={bookingManagementStyles.emptySubtext}>
                Try adjusting your filters or check back later
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredBookings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <BookingCard booking={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={bookingManagementStyles.listContainer}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
