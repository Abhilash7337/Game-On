
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
import { ActivityIndicator, Alert, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

interface JoinRequestDisplay {
  id: string;
  bookingId: string;
  requesterId: string;
  requesterName: string;
  requesterRating?: number;
  bookingDate: string;
  bookingTime: string;
  venueName: string;
  courtName: string;
  createdAt: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; location: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const [userBookings, setUserBookings] = useState<BookingDisplay[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestDisplay[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bookingSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    loadUserData();
    loadUserBookings();
    loadJoinRequests();
    
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
      loadJoinRequests();
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

  // Load join requests for the current user's bookings
  const loadJoinRequests = async () => {
    try {
      setLoadingJoinRequests(true);
      
      const { supabase } = await import('@/src/common/services/supabase');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('📋 [HOME] No authenticated user, skipping join requests load');
        setJoinRequests([]);
        setLoadingJoinRequests(false);
        return;
      }
      
      console.log('📋 [HOME] Loading join requests for host:', user.id);
      
      // Fetch pending join requests for the user's bookings
      const { data: requests, error } = await supabase
        .from('join_requests')
        .select(`
          id,
          booking_id,
          requester_id,
          created_at,
          requester:users!join_requests_requester_id_fkey!inner(
            id,
            full_name,
            rating
          ),
          booking:bookings!join_requests_booking_id_fkey!inner(
            booking_date,
            start_time,
            venue_id,
            court_id
          )
        `)
        .eq('host_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ [HOME] Error loading join requests:', error);
        setJoinRequests([]);
        setLoadingJoinRequests(false);
        return;
      }

      if (!requests || requests.length === 0) {
        console.log('✅ [HOME] No pending join requests found');
        setJoinRequests([]);
        setLoadingJoinRequests(false);
        return;
      }

      // Get venue and court names
      const venueIds = [...new Set(requests.map(r => {
        const booking = Array.isArray(r.booking) ? r.booking[0] : r.booking;
        return booking?.venue_id;
      }).filter(Boolean))];
      
      const courtIds = [...new Set(requests.map(r => {
        const booking = Array.isArray(r.booking) ? r.booking[0] : r.booking;
        return booking?.court_id;
      }).filter(Boolean))];

      const { data: venuesData } = await supabase
        .from('venues')
        .select('id, name')
        .in('id', venueIds as string[]);

      const { data: courtsData } = await supabase
        .from('courts')
        .select('id, name')
        .in('id', courtIds as string[]);

      const venueMap = new Map(venuesData?.map(v => [v.id, v.name]) || []);
      const courtMap = new Map(courtsData?.map(c => [c.id, c.name]) || []);

      // Transform to display format
      const transformedRequests: JoinRequestDisplay[] = requests.map(req => {
        const requester = Array.isArray(req.requester) ? req.requester[0] : req.requester;
        const booking = Array.isArray(req.booking) ? req.booking[0] : req.booking;
        
        return {
          id: req.id,
          bookingId: req.booking_id,
          requesterId: requester?.id || req.requester_id || '',
          requesterName: requester?.full_name || 'Unknown Player',
          requesterRating: requester?.rating,
          bookingDate: new Date(booking?.booking_date || '').toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          bookingTime: formatTimeFromDB(booking?.start_time || ''),
          venueName: venueMap.get(booking?.venue_id || '') || 'Unknown Venue',
          courtName: courtMap.get(booking?.court_id || '') || 'Unknown Court',
          createdAt: req.created_at,
        };
      });

      console.log(`✅ [HOME] Loaded ${transformedRequests.length} pending join requests`);
      setJoinRequests(transformedRequests);
      
    } catch (error) {
      console.error('❌ [HOME] Error in loadJoinRequests:', error);
      setJoinRequests([]);
    } finally {
      setLoadingJoinRequests(false);
    }
  };

  // Handle accept join request
  const handleAcceptJoinRequest = async (requestId: string, requesterName: string) => {
    try {
      const { JoinRequestService } = await import('@/src/common/services/joinRequestService');
      
      const result = await JoinRequestService.acceptJoinRequest(requestId);
      
      if (result.success) {
        Alert.alert(
          'Request Accepted',
          `${requesterName} has been added to your game!`,
          [{ text: 'OK' }]
        );
        // Reload join requests
        loadJoinRequests();
        // Also reload bookings to reflect participant count changes
        loadUserBookings();
      } else {
        Alert.alert('Error', result.error || 'Failed to accept request');
      }
    } catch (error) {
      console.error('❌ [HOME] Error accepting join request:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Handle reject join request
  const handleRejectJoinRequest = async (requestId: string, requesterName: string) => {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject ${requesterName}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { JoinRequestService } = await import('@/src/common/services/joinRequestService');
              
              const result = await JoinRequestService.rejectJoinRequest(requestId);
              
              if (result.success) {
                Alert.alert('Request Rejected', 'The join request has been rejected.');
                loadJoinRequests();
              } else {
                Alert.alert('Error', result.error || 'Failed to reject request');
              }
            } catch (error) {
              console.error('❌ [HOME] Error rejecting join request:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
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
      <ScrollView style={homeStyles.body} showsVerticalScrollIndicator={false}>
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

        {/* Join Requests Section */}
        <View style={homeStyles.bookingsSection}>
          <View style={homeStyles.bookingsSectionHeader}>
            <Text style={homeTextStyles.sectionTitle}>Join Requests</Text>
          </View>

          {loadingJoinRequests ? (
            <View style={homeStyles.bookingsLoadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={homeTextStyles.loadingText}>Loading join requests...</Text>
            </View>
          ) : joinRequests.length === 0 ? (
            <View style={homeStyles.noBookingsContainer}>
              <View style={homeStyles.noBookingsIconContainer}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={homeTextStyles.noBookingsTitle}>No Pending Requests</Text>
              <Text style={homeTextStyles.noBookingsSubtitle}>
                Join requests will appear here when players want to join your games
              </Text>
            </View>
          ) : (
            <FlatList
                data={joinRequests}
                nestedScrollEnabled
                renderItem={({ item }) => {
                  return (
                    <View style={homeStyles.joinRequestCard}>
                      <View style={homeStyles.joinRequestHeader}>
                        <View style={homeStyles.joinRequestPlayerInfo}>
                          <View style={homeStyles.joinRequestPlayerIcon}>
                            <Ionicons name="person" size={24} color="#10B981" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={homeTextStyles.joinRequestPlayerName}>
                              {item.requesterName}
                            </Text>
                            {item.requesterRating ? (
                              <View style={homeStyles.joinRequestRatingBadge}>
                                <Ionicons name="star" size={12} color="#FBBF24" />
                                <Text style={homeTextStyles.joinRequestRating}>
                                  {item.requesterRating.toFixed(1)}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>

                      <View style={homeStyles.joinRequestDetails}>
                        <View style={homeStyles.joinRequestDetailRow}>
                          <Ionicons name="location" size={16} color="#6B7280" />
                          <Text style={homeTextStyles.joinRequestDetailText}>
                            {item.venueName} - {item.courtName}
                          </Text>
                        </View>
                        <View style={homeStyles.joinRequestDetailRow}>
                          <Ionicons name="calendar" size={16} color="#6B7280" />
                          <Text style={homeTextStyles.joinRequestDetailText}>
                            {item.bookingDate} at {item.bookingTime}
                          </Text>
                        </View>
                      </View>

                      <View style={homeStyles.joinRequestActions}>
                        <TouchableOpacity
                          style={homeStyles.joinRequestMessageButton}
                          onPress={() => {
                            router.push({
                              pathname: '/FriendChatScreen',
                              params: { 
                                friendId: item.requesterId,
                                friendName: item.requesterName 
                              }
                            });
                          }}
                        >
                          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[homeStyles.joinRequestButton, homeStyles.joinRequestRejectButton]}
                          onPress={() => handleRejectJoinRequest(item.id, item.requesterName)}
                        >
                          <Ionicons name="close" size={20} color="#EF4444" />
                          <Text style={homeTextStyles.joinRequestRejectText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[homeStyles.joinRequestButton, homeStyles.joinRequestAcceptButton]}
                          onPress={() => handleAcceptJoinRequest(item.id, item.requesterName)}
                        >
                          <Ionicons name="checkmark" size={20} color="#fff" />
                          <Text style={homeTextStyles.joinRequestAcceptText}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                  </View>
                  );
                }}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={homeStyles.bookingsListContainer}
              />
            )
          }
        </View>
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundary>
  );
}
