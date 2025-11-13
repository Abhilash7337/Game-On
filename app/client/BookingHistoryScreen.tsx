import AppHeader from '@/src/common/components/AppHeader';
import { supabase } from '@/src/common/services/supabase';
import { bookingHistoryStyles } from '@/styles/screens/BookingHistoryScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BookingHistoryItem {
  id: string;
  venueName: string;
  courtName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  playerCount: number;
  totalAmount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  paymentStatus: string;
  bookingType: string;
  createdAt: string;
}

const styles = bookingHistoryStyles;

export default function BookingHistoryScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingHistoryItem | null>(null);

  useEffect(() => {
    initializeAndLoadBookings();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (clientId) {
        console.log('📚 [BOOKING HISTORY] Screen focused, refreshing data...');
        loadBookings();
      }
    }, [clientId])
  );

  // Filter bookings when search query or status filter changes
  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, selectedStatus]);

  const initializeAndLoadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to view booking history');
        router.replace('/client-login');
        return;
      }

      setClientId(user.id);
      await loadBookings(user.id);
    } catch (error) {
      console.error('❌ [BOOKING HISTORY] Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize booking history');
    }
  };

  const loadBookings = async (userId?: string, isRefresh = false) => {
    const currentClientId = userId || clientId;
    if (!currentClientId) return;

    if (isRefresh || bookings.length > 0) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('📚 [BOOKING HISTORY] Loading bookings for client:', currentClientId);

      // Get all venues owned by this client first
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id, name')
        .eq('client_id', currentClientId);

      if (venuesError) {
        console.error('❌ [BOOKING HISTORY] Venues error:', venuesError);
        throw venuesError;
      }

      if (!venues || venues.length === 0) {
        setBookings([]);
        setFilteredBookings([]);
        return;
      }

      const venueIds = venues.map(v => v.id);
      const venueMap = new Map(venues.map(v => [v.id, v.name]));

      // Fetch bookings for all client's venues
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          courts!inner(name),
          users!inner(full_name, email, phone)
        `)
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('❌ [BOOKING HISTORY] Bookings error:', bookingsError);
        throw bookingsError;
      }

      // Transform data to match interface
      const transformedBookings: BookingHistoryItem[] = (bookingsData || []).map(booking => ({
        id: booking.id,
        venueName: venueMap.get(booking.venue_id) || 'Unknown Venue',
        courtName: booking.courts?.name || 'Unknown Court',
        userName: booking.users?.full_name || 'Guest User',
        userEmail: booking.users?.email || '',
        userPhone: booking.users?.phone || '',
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        duration: booking.duration,
        playerCount: booking.player_count,
        totalAmount: parseFloat(booking.total_amount || 0),
        status: booking.status,
        paymentStatus: booking.payment_status || 'pending',
        bookingType: booking.booking_type || 'regular',
        createdAt: booking.created_at,
      }));

      setBookings(transformedBookings);
      console.log(`✅ [BOOKING HISTORY] Loaded ${transformedBookings.length} bookings`);
    } catch (error) {
      console.error('❌ [BOOKING HISTORY] Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load booking history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }

    // Filter by search query (venue name, court name, or user name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(booking =>
        booking.venueName.toLowerCase().includes(query) ||
        booking.courtName.toLowerCase().includes(query) ||
        booking.userName.toLowerCase().includes(query) ||
        booking.userEmail.toLowerCase().includes(query)
      );
    }

    setFilteredBookings(filtered);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return colors.success;
      case 'pending': return '#F59E0B';
      case 'cancelled': return colors.error;
      case 'completed': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getStatusBgColor = (status: string) => {
    return getStatusColor(status) + '20';
  };

  const handleBookingPress = (booking: BookingHistoryItem) => {
    setSelectedBooking(booking);
  };

  const renderFilterButtons = () => {
    const statuses = [
      { key: 'all', label: 'All' },
      { key: 'confirmed', label: 'Confirmed' },
      { key: 'pending', label: 'Pending' },
      { key: 'completed', label: 'Completed' },
      { key: 'cancelled', label: 'Cancelled' }
    ] as const;

    return (
      <View style={styles.filterContainer}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.filterButton,
              selectedStatus === status.key && styles.filterButtonActive
            ]}
            onPress={() => setSelectedStatus(status.key)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedStatus === status.key && styles.filterButtonTextActive
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderBookingCard = ({ item }: { item: BookingHistoryItem }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => handleBookingPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.bookingDateInfo}>
          <Text style={styles.bookingDate}>{formatDate(item.bookingDate)}</Text>
          <Text style={styles.bookingTime}>
            {formatTime(item.startTime)} - {formatTime(item.endTime)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusBgColor(item.status) }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{item.venueName}</Text>
          <Text style={styles.courtName}>{item.courtName}</Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.playerCount}>
            {item.playerCount} {item.playerCount > 1 ? 'players' : 'player'}
          </Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <View style={styles.amountInfo}>
          <Text style={styles.amount}>₹{item.totalAmount.toLocaleString()}</Text>
          <Text style={styles.duration}>{item.duration}</Text>
        </View>
        
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentStatus}>
            {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBookingDetailModal = () => {
    if (!selectedBooking) return null;

    return (
      <Modal
        visible={!!selectedBooking}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBooking(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedBooking(null)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Venue & Court</Text>
              <Text style={styles.detailValue}>
                {selectedBooking.venueName} - {selectedBooking.courtName}
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>{selectedBooking.userName}</Text>
              <Text style={styles.detailSubValue}>{selectedBooking.userEmail}</Text>
              {selectedBooking.userPhone && (
                <Text style={styles.detailSubValue}>{selectedBooking.userPhone}</Text>
              )}
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{formatDate(selectedBooking.bookingDate)}</Text>
              <Text style={styles.detailSubValue}>
                {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
              </Text>
              <Text style={styles.detailSubValue}>Duration: {selectedBooking.duration}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Booking Info</Text>
              <Text style={styles.detailValue}>
                {selectedBooking.playerCount} {selectedBooking.playerCount > 1 ? 'players' : 'player'}
              </Text>
              <Text style={styles.detailSubValue}>Type: {selectedBooking.bookingType}</Text>
              <Text style={styles.detailSubValue}>
                Booked on: {formatDate(selectedBooking.createdAt)}
              </Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailLabel}>Payment</Text>
              <Text style={styles.detailValue}>₹{selectedBooking.totalAmount.toLocaleString()}</Text>
              <Text style={[
                styles.detailSubValue,
                { color: getStatusColor(selectedBooking.paymentStatus) }
              ]}>
                Payment: {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
              </Text>
            </View>

            <View style={[
              styles.detailCard,
              { backgroundColor: getStatusBgColor(selectedBooking.status) }
            ]}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[
                styles.detailValue,
                { color: getStatusColor(selectedBooking.status) }
              ]}>
                {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading booking history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Booking History"
        subtitle={`${filteredBookings.length} bookings`}
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by venue, court, or customer..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Buttons */}
        {renderFilterButtons()}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {bookings.length === 0 ? 'No Bookings Yet' : 'No bookings match your search'}
            </Text>
            <Text style={styles.emptyText}>
              {bookings.length === 0 
                ? 'Bookings will appear here as customers make reservations'
                : 'Try adjusting your search or filter criteria'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadBookings(undefined, true)}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.bookingsList}
          />
        )}
      </View>

      {renderBookingDetailModal()}
    </SafeAreaView>
  );
}