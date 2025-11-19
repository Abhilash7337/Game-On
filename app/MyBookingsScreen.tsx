import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BookingData {
  id: string;
  venueName: string;
  courtName: string;
  date: Date;
  time: string;
  duration: string;
  bookingType: 'Open Game' | 'Private Game';
  status: string;
  venue_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  user_id: string;
}

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('❌ No authenticated user');
        setBookings([]);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Fetch all bookings (confirmed, pending, cancelled, rejected)
      const { data: allBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          duration,
          booking_type,
          status,
          venue_id,
          court_id,
          user_id
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (bookingsError) {
        console.error('❌ Error loading bookings:', bookingsError);
        Alert.alert('Error', 'Failed to load bookings');
        setBookings([]);
        setLoading(false);
        return;
      }

      if (!allBookings || allBookings.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get unique venue and court IDs
      const venueIds = [...new Set(allBookings.map(b => b.venue_id))];
      const courtIds = [...new Set(allBookings.map(b => b.court_id))];

      // Fetch venue names
      const { data: venuesData } = await supabase
        .from('venues')
        .select('id, name')
        .in('id', venueIds);

      // Fetch court names
      const { data: courtsData } = await supabase
        .from('courts')
        .select('id, name')
        .in('id', courtIds);

      // Create lookup maps
      const venueMap = new Map(venuesData?.map(v => [v.id, v.name]) || []);
      const courtMap = new Map(courtsData?.map(c => [c.id, c.name]) || []);

      // Transform to display format
      const transformedBookings: BookingData[] = allBookings.map(booking => ({
        id: booking.id,
        venueName: venueMap.get(booking.venue_id) || 'Unknown Venue',
        courtName: courtMap.get(booking.court_id) || 'Unknown Court',
        date: new Date(booking.booking_date),
        time: formatTimeFromDB(booking.start_time),
        duration: booking.duration || '1 hr',
        bookingType: booking.booking_type === 'open' ? 'Open Game' : 'Private Game',
        status: booking.status,
        venue_id: booking.venue_id,
        court_id: booking.court_id,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        user_id: booking.user_id,
      }));

      setBookings(transformedBookings);
    } catch (error) {
      console.error('❌ Error in loadBookings:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
  }, []);

  // Helper: Format time from DB (HH:MM:SS) to display format (H:MM AM/PM)
  const formatTimeFromDB = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return time;
    }
  };

  const formatBookingDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        year: 'numeric',
      });
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#6B7280';
      case 'rejected':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#D1FAE5';
      case 'pending':
        return '#FEF3C7';
      case 'cancelled':
        return '#F3F4F6';
      case 'rejected':
        return '#FEE2E2';
      default:
        return '#F9FAFB';
    }
  };

  const canCancelBooking = (booking: BookingData): boolean => {
    // Can only cancel confirmed or pending bookings
    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      return false;
    }

    // Check if booking is in the past
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();

    return bookingDateTime > now;
  };

  const handleCancelBooking = async (booking: BookingData) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel this booking at ${booking.venueName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await cancelBooking(booking);
          },
        },
      ]
    );
  };

  const cancelBooking = async (booking: BookingData) => {
    try {
      setCancellingId(booking.id);
      const { supabase } = await import('@/src/common/services/supabase');

      console.log('🔄 Cancelling booking:', booking.id);

      // Update booking status to cancelled
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('❌ Error cancelling booking:', updateError);
        Alert.alert('Error', 'Failed to cancel booking. Please try again.');
        setCancellingId(null);
        return;
      }

      console.log('✅ Booking cancelled successfully');

      // Show success message
      Alert.alert(
        'Booking Cancelled',
        'Your booking has been cancelled successfully. The time slot is now available for others to book.',
        [{ text: 'OK' }]
      );

      // Reload bookings to reflect the change
      await loadBookings();
    } catch (error) {
      console.error('❌ Error in cancelBooking:', error);
      Alert.alert('Error', 'An unexpected error occurred while cancelling the booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const renderBookingCard = ({ item }: { item: BookingData }) => {
    const isPast = new Date(`${item.booking_date}T${item.start_time}`) < new Date();
    const canCancel = canCancelBooking(item);
    const isCancelling = cancellingId === item.id;

    return (
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginHorizontal: 16,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          borderLeftWidth: 4,
          borderLeftColor: getStatusColor(item.status),
        }}
      >
        {/* Header Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
              {item.venueName}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
              {item.courtName}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: getStatusBgColor(item.status),
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: getStatusColor(item.status), textTransform: 'capitalize' }}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Booking Type Badge */}
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: item.bookingType === 'Open Game' ? '#DBEAFE' : '#FCE7F3',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: item.bookingType === 'Open Game' ? '#1E40AF' : '#9F1239',
            }}
          >
            {item.bookingType}
          </Text>
        </View>

        {/* Date, Time, Duration Row */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={{ marginLeft: 6, fontSize: 14, color: '#374151', fontWeight: '500' }}>
              {formatBookingDate(item.date)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={{ marginLeft: 6, fontSize: 14, color: '#374151', fontWeight: '500' }}>
              {item.time}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="hourglass-outline" size={16} color="#6B7280" />
            <Text style={{ marginLeft: 6, fontSize: 14, color: '#374151', fontWeight: '500' }}>
              {item.duration}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {canCancel && (
            <TouchableOpacity
              onPress={() => handleCancelBooking(item)}
              disabled={isCancelling}
              style={{
                flex: 1,
                backgroundColor: isCancelling ? '#F3F4F6' : '#FEE2E2',
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                  <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#EF4444' }}>
                    Cancel Booking
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/VenueDetailsScreen',
                params: { venueId: item.venue_id },
              });
            }}
            style={{
              flex: canCancel ? 1 : 1,
              backgroundColor: '#DBEAFE',
              paddingVertical: 12,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="location-outline" size={18} color="#1E40AF" />
            <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#1E40AF' }}>
              View Venue
            </Text>
          </TouchableOpacity>
        </View>

        {/* Past booking indicator */}
        {isPast && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
              <Ionicons name="checkmark-circle" size={12} color="#9CA3AF" /> This booking has ended
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#F3F4F6',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
        No Bookings Yet
      </Text>
      <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 }}>
        Start booking courts to see your upcoming games here
      </Text>
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/courts')}
        style={{
          backgroundColor: '#10B981',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#fff' }}>
          Book a Court
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Separate bookings into categories
  const upcomingBookings = bookings.filter(
    b => new Date(`${b.booking_date}T${b.start_time}`) >= new Date() && (b.status === 'confirmed' || b.status === 'pending')
  );
  const pastBookings = bookings.filter(
    b => new Date(`${b.booking_date}T${b.start_time}`) < new Date() || b.status === 'cancelled' || b.status === 'rejected'
  );

  const allSortedBookings = [...upcomingBookings, ...pastBookings];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }} edges={['top', 'left', 'right']}>
      {/* Hide the default Expo Router header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View
        style={{
          backgroundColor: '#fff',
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>My Bookings</Text>
          {!loading && (
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} total
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280' }}>Loading your bookings...</Text>
        </View>
      ) : allSortedBookings.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={allSortedBookings}
          renderItem={renderBookingCard}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
          ListHeaderComponent={
            upcomingBookings.length > 0 ? (
              <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                  Upcoming ({upcomingBookings.length})
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            pastBookings.length > 0 ? (
              <>
                <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                    Past & Cancelled ({pastBookings.length})
                  </Text>
                </View>
              </>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
