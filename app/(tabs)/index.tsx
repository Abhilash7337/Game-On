
import AppHeader from '@/src/common/components/AppHeader';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { dataPrefetchService } from '@/src/common/services/dataPrefetch';
import { GameChatroomCleanupService } from '@/src/common/services/gameChatroomCleanup';
import {
  homeStyles,
  homeTextStyles
} from '@/styles/screens/HomeScreen';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


interface BookingDisplay {
  id: string;
  venueName: string;
  courtName: string;
  date: Date;
  time: string;
  duration: string;
  bookingType: 'Open Game' | 'Private Game';
  status: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; location: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const [userBookings, setUserBookings] = useState<BookingDisplay[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bookingSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    loadUserData();
    loadUserBookings();
    
    // ✅ OPTIMIZATION: Cleanup expired chatrooms on app startup (silent, non-blocking)
    GameChatroomCleanupService.autoCleanup(true).catch(() => {});
    
    // ✅ OPTIMIZATION: Prefetch immediately if no cache exists!
    const cache = dataPrefetchService.getCache();
    
    if (!cache) {
      console.log('📦 [HOME] No cache available - STARTING PREFETCH NOW!');
      // Start prefetch immediately (don't wait for login animation)
      dataPrefetchService.prefetchAll().then(() => {
        console.log('✅ [HOME] Prefetch completed from home screen!');
      }).catch(err => {
        console.warn('[HOME] Prefetch failed:', err);
      });
    } else {
      // Cache exists - check if stale and refresh in background
      const cacheAge = dataPrefetchService.getCacheAge();
      const cacheAgeSeconds = Math.floor(cacheAge / 1000);
      console.log(`📊 [HOME] Cache age: ${cacheAgeSeconds}s`);
      
      if (!dataPrefetchService.isCacheFresh()) {
        console.log('🔄 [HOME] Cache is stale, refreshing in background...');
        dataPrefetchService.prefetchAll().catch(err => {
          console.warn('[HOME] Background cache refresh failed:', err);
        });
      } else {
        console.log('✅ [HOME] Cache is fresh, no refresh needed');
      }
    }

    // Cleanup subscription on unmount
    return () => {
      if (bookingSubscriptionRef.current) {
        console.log('🧹 [HOME] Cleaning up booking subscription');
        bookingSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // ✅ Reload bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('👁️ [HOME] Screen focused - reloading bookings');
      loadUserBookings();
    }, [])
  );

  const loadUserData = async () => {
    // ✅ OPTIMIZATION: Load user data synchronously (no await needed)
    setUser({ name: 'GameOn', location: 'Hyderabad, India' });
    setNotifications(0); // Notifications disabled
  };

  const loadUserBookings = async () => {
    try {
      setLoadingBookings(true);
      
      // Get current user ID from Supabase auth
      const { supabase } = await import('@/src/common/services/supabase');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('📋 [HOME] No authenticated user, skipping bookings load');
        setUserBookings([]);
        setLoadingBookings(false);
        return;
      }
      
      setCurrentUserId(user.id);
      console.log('📋 [HOME] Loading bookings for user:', user.id);
      
      // ✅ Fetch BOTH owned bookings AND joined games (via conversation_participants)
      // First, get bookings where user is the creator
      const { data: ownedBookings, error: ownedError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          duration,
          booking_type,
          status,
          venue_id,
          court_id
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('booking_date', new Date().toISOString().split('T')[0]);

      if (ownedError) {
        console.error('❌ [HOME] Error loading owned bookings:', ownedError);
      }

      console.log('📋 [HOME] Owned bookings:', ownedBookings?.length || 0);

      // Second, get bookings where user joined as a participant (open games)
      const { data: joinedBookings, error: joinedError } = await supabase
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
          conversations!inner(
            id,
            conversation_participants!inner(user_id, is_active)
          )
        `)
        .eq('status', 'confirmed')
        .eq('booking_type', 'open')
        .eq('conversations.conversation_participants.user_id', user.id)
        .eq('conversations.conversation_participants.is_active', true)
        .gte('booking_date', new Date().toISOString().split('T')[0]);

      if (joinedError) {
        console.error('❌ [HOME] Error loading joined bookings:', joinedError);
      }

      console.log('📋 [HOME] Joined bookings:', joinedBookings?.length || 0);

      // Combine both lists and remove duplicates
      const allBookingsMap = new Map();
      
      // Add owned bookings
      (ownedBookings || []).forEach(booking => {
        allBookingsMap.set(booking.id, booking);
      });
      
      // Add joined bookings (skip if already added as owned)
      (joinedBookings || []).forEach(booking => {
        if (!allBookingsMap.has(booking.id)) {
          allBookingsMap.set(booking.id, booking);
        }
      });

      const bookingsData = Array.from(allBookingsMap.values())
        .sort((a, b) => {
          // Sort by date, then by time
          const dateCompare = a.booking_date.localeCompare(b.booking_date);
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        })
        .slice(0, 5); // Limit to 5 bookings

      console.log(`📋 [HOME] Total unique bookings: ${bookingsData.length}`);

      if (bookingsData.length === 0) {
        console.log('⚠️ [HOME] No confirmed bookings found for user:', user.id);
        setUserBookings([]);
        setLoadingBookings(false);
        
        // ✅ Set up real-time subscription for future bookings
        setupRealtimeSubscription(user.id);
        return;
      }

      // Get unique venue IDs and court IDs
      const venueIds = [...new Set(bookingsData.map(b => b.venue_id))];
      const courtIds = [...new Set(bookingsData.map(b => b.court_id))];

      console.log('🏟️ [HOME] Fetching venue/court names:', { venueIds, courtIds });

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
      const transformedBookings: BookingDisplay[] = bookingsData.map(booking => ({
        id: booking.id,
        venueName: venueMap.get(booking.venue_id) || 'Unknown Venue',
        courtName: courtMap.get(booking.court_id) || 'Unknown Court',
        date: new Date(booking.booking_date),
        time: formatTimeFromDB(booking.start_time),
        duration: `${booking.duration} hr`,
        bookingType: booking.booking_type === 'open' ? 'Open Game' : 'Private Game',
        status: booking.status,
      }));
      
      console.log(`✅ [HOME] Loaded ${transformedBookings.length} confirmed bookings (owned + joined)`);
      setUserBookings(transformedBookings);
      
      // ✅ Set up real-time subscription
      setupRealtimeSubscription(user.id);
      
    } catch (error) {
      console.error('❌ [HOME] Error in loadUserBookings:', error);
      setUserBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // ✅ Set up real-time subscription for booking changes
  const setupRealtimeSubscription = async (userId: string) => {
    try {
      // Cleanup existing subscription
      if (bookingSubscriptionRef.current) {
        bookingSubscriptionRef.current.unsubscribe();
      }

      const { supabase } = await import('@/src/common/services/supabase');

      console.log('📡 [HOME] Setting up real-time subscription for user bookings:', userId);

      // Subscribe to booking changes for this user
      bookingSubscriptionRef.current = supabase
        .channel('home-bookings')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('📡 [HOME] Booking change detected:', payload);
            
            // Reload bookings when any change occurs
            loadUserBookings();
          }
        )
        .subscribe((status) => {
          console.log('📡 [HOME] Subscription status:', status);
        });

    } catch (error) {
      console.error('❌ [HOME] Error setting up real-time subscription:', error);
    }
  };

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
        weekday: 'short'
      });
    }
  };

  const renderBookingCard = ({ item }: { item: BookingDisplay }) => (
    <TouchableOpacity 
      style={homeStyles.bookingCard}
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to My Bookings screen
        router.push('/MyBookingsScreen');
      }}
    >
      <View style={homeStyles.bookingCardHeader}>
        <View style={homeStyles.bookingDateBadge}>
          <Ionicons name="calendar-outline" size={14} color="#10B981" />
          <Text style={homeTextStyles.bookingDateText}>{formatBookingDate(item.date)}</Text>
        </View>
        <View style={[
          homeStyles.bookingTypeBadge,
          { backgroundColor: item.bookingType === 'Open Game' ? '#DBEAFE' : '#FCE7F3' }
        ]}>
          <Text style={[
            homeTextStyles.bookingTypeText,
            { color: item.bookingType === 'Open Game' ? '#1E40AF' : '#9F1239' }
          ]}>
            {item.bookingType}
          </Text>
        </View>
      </View>
      
      <Text style={homeTextStyles.bookingVenueName} numberOfLines={1}>
        {item.venueName}
      </Text>
      
      <View style={homeStyles.bookingInfoRow}>
        <View style={homeStyles.bookingInfoItem}>
          <Ionicons name="basketball-outline" size={16} color="#6B7280" />
          <Text style={homeTextStyles.bookingInfoText}>{item.courtName}</Text>
        </View>
        <View style={homeStyles.bookingInfoDivider} />
        <View style={homeStyles.bookingInfoItem}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={homeTextStyles.bookingInfoText}>{item.time}</Text>
        </View>
        <View style={homeStyles.bookingInfoDivider} />
        <View style={homeStyles.bookingInfoItem}>
          <Ionicons name="hourglass-outline" size={16} color="#6B7280" />
          <Text style={homeTextStyles.bookingInfoText}>{item.duration}</Text>
        </View>
      </View>
      
      <View style={homeStyles.bookingCardFooter}>
        <View style={homeStyles.bookingStatusBadge}>
          <View style={homeStyles.bookingStatusDot} />
          <Text style={homeTextStyles.bookingStatusText}>Confirmed</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView style={homeStyles.container} edges={['left', 'right', 'bottom']}>
        {/* Disable Expo Router default header */}
        <Stack.Screen options={{ headerShown: false }} />

      <AppHeader 
        title={user?.name ?? 'GameOn'} 
        subtitle="Sports Hub"
        locationText={user?.location ?? ''}
      >
        {/* Right side icons positioned absolutely */}
        <View style={homeStyles.headerRightSection}>
          <TouchableOpacity 
            style={homeStyles.notificationIconContainer}
            onPress={() => router.push('/role-selection')}
          >
            <Ionicons name="swap-horizontal" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={homeStyles.notificationIconContainer}
            onPress={() => router.push('/NotificationsScreen')}
          >
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            {/* Notification badge, show only if there are notifications */}
            {notifications > 0 && <View style={homeStyles.notificationBadge} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={homeStyles.profileIconContainer}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </AppHeader>

      {/* Body Content */}
      <View style={homeStyles.body}>
        <Text style={homeTextStyles.sectionTitle}>Quick Actions</Text>
        <View style={homeStyles.quickActionsRow}>
          <TouchableOpacity 
            style={[homeStyles.quickActionCard, homeStyles.quickBookCard]} 
            onPress={() => router.push('/(tabs)/courts')}
          >
            <Text style={homeTextStyles.quickActionTitle}>Quick Book</Text>
            <Text style={homeTextStyles.quickActionSubtitle}>Book a court</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[homeStyles.quickActionCard, homeStyles.joinGameCard]} 
            onPress={() => router.push('/(tabs)/courts')}
          >
            <Text style={homeTextStyles.quickActionTitle}>Join Game</Text>
            <Text style={homeTextStyles.quickActionSubtitle}>Join existing games</Text>
          </TouchableOpacity>
        </View>

        {/* Your Bookings Section */}
        <View style={homeStyles.bookingsSection}>
          <View style={homeStyles.bookingsSectionHeader}>
            <Text style={homeTextStyles.sectionTitle}>Your Bookings</Text>
            {userBookings.length > 0 && (
              <TouchableOpacity 
                onPress={() => router.push('/MyBookingsScreen')}
                style={homeStyles.viewAllButton}
              >
                <Text style={homeTextStyles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={16} color="#10B981" />
              </TouchableOpacity>
            )}
          </View>

          {loadingBookings ? (
            <View style={homeStyles.bookingsLoadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={homeTextStyles.loadingText}>Loading your bookings...</Text>
            </View>
          ) : userBookings.length === 0 ? (
            <View style={homeStyles.noBookingsContainer}>
              <View style={homeStyles.noBookingsIconContainer}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={homeTextStyles.noBookingsTitle}>No Upcoming Bookings</Text>
              <Text style={homeTextStyles.noBookingsSubtitle}>
                Book a court to see your upcoming games here
              </Text>
            </View>
          ) : (
            <FlatList
              data={userBookings}
              renderItem={renderBookingCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={homeStyles.bookingsListContainer}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
    </ErrorBoundary>
  );
}
