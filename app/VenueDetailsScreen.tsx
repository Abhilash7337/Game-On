import {
  venueDetailsStyles
} from '@/styles/screens/VenueDetailsScreen';
import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
// 1. Import StatusBar and useSafeAreaInsets
import { Venue } from '@/src/common/types';
import { calculateDistance, formatDistance } from '@/src/common/utils/distanceCalculator';
import * as Location from 'expo-location';
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function VenueDetailsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [distance, setDistance] = useState<string>('N/A');
  const [availableCourts, setAvailableCourts] = useState<Array<{id: string; name: string; type: string; uuid?: string}>>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [datePickerAnimation] = useState(new Animated.Value(0));
  const [bookingsForDate, setBookingsForDate] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]); // Store all preloaded bookings
  const [bookingsLoaded, setBookingsLoaded] = useState(false); // Track if bookings are loaded
  const [currentUserId, setCurrentUserId] = useState<string>(''); // Store current user ID
  const bookingSubscriptionRef = useRef<any>(null); // Real-time subscription reference
  const router = useRouter();
  const params = useLocalSearchParams();
  // 2. Get the safe area inset values
  const insets = useSafeAreaInsets();

  const loadVenueDetails = useCallback(async () => {
    try {
      const { VenueStorageService } = await import('@/src/common/services/venueStorage');
      const { supabase } = await import('@/src/common/services/supabase');
      const venues = await VenueStorageService.getAllVenues();
      const venueId = params.venueId as string;
      
      const foundVenue = venues.find(v => v.id === venueId);
      if (foundVenue) {
        setVenue(foundVenue);
        
        // Calculate distance immediately if we already have location
        if (userLocation) {
          calculateVenueDistance(foundVenue);
        }
        
        // Load courts for this venue from database
        const { data: courts } = await supabase
          .from('courts')
          .select('id, name, type')
          .eq('venue_id', venueId)
          .eq('is_active', true);
        
        if (courts && courts.length > 0) {
          setAvailableCourts(courts.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            uuid: c.id // Store the actual UUID for booking
          })));
        } else {
          // Fallback to venue.courts if available
          if (foundVenue.courts && foundVenue.courts.length > 0) {
            setAvailableCourts(foundVenue.courts.map(c => ({
              id: c.id || `court-${c.name}`,
              name: c.name,
              type: c.type,
              uuid: c.id // May be undefined for fallback data
            })));
          }
        }
        
        return foundVenue;
      } else {
        // Fallback to default venue if not found
        const defaultVenue = {
          id: '1',
          name: 'Mahindra Court',
          address: 'Mahindra University, Bahadurpally, Hyderabad',
          location: { latitude: 17.5449, longitude: 78.5718 },
          description: 'Premium sports facility with modern amenities and professional courts suitable for matches, tournaments, and casual games.',
          amenities: ['Parking', 'Lighting', 'Washrooms', 'Refreshments', 'Seating'],
          images: ['https://via.placeholder.com/400x200/047857/ffffff?text=Mahindra+Court'],
          pricing: { basePrice: 500, peakHourMultiplier: 1.5, currency: 'INR' },
          operatingHours: { open: '06:00', close: '22:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
          courts: [],
          ownerId: 'sample-owner',
          rating: 4.2,
          isActive: true,
          createdAt: new Date(),
        };
        setVenue(defaultVenue);
        if (userLocation) {
          calculateVenueDistance(defaultVenue);
        }
        return defaultVenue;
      }
    } catch (error) {
      console.error('❌ Error loading venue details:', error);
      return null;
    }
  }, [params.venueId, userLocation]);

  const getUserLocation = async () => {
    try {
      // ✅ OPTIMIZATION: Try cache first for instant location!
      const { dataPrefetchService } = await import('@/src/common/services/dataPrefetch');
      const cache = dataPrefetchService.getCache();
      
      if (cache?.userLocation && dataPrefetchService.isCacheFresh()) {
        console.log('⚡ [VENUE DETAILS] Using cached location - INSTANT!');
        setUserLocation(cache.userLocation);
        
        // If venue is already loaded, calculate distance now
        if (venue) {
          calculateVenueDistance(venue);
        }
        return;
      }
      
      // Cache miss - get fresh location
      console.log('📍 [VENUE DETAILS] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ [VENUE DETAILS] Location permission denied');
        return;
      }

      console.log('📍 [VENUE DETAILS] Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userCoords);
      console.log('📍 [VENUE DETAILS] User location obtained:', userCoords);
      
      // If venue is already loaded, calculate distance now
      if (venue) {
        calculateVenueDistance(venue);
      }
      
    } catch (error) {
      console.log('❌ [VENUE DETAILS] Error getting location:', error);
    }
  };

  const calculateVenueDistance = (venueData: Venue) => {
    if (!userLocation || !venueData.location) {
      console.log('⚠️ Cannot calculate distance - missing user location or venue location');
      setDistance('N/A');
      return;
    }

    try {
      let venueCoords;
      
      // Handle different location data formats
      if (typeof venueData.location === 'string') {
        try {
          venueCoords = JSON.parse(venueData.location);
        } catch (parseError) {
          console.log('❌ Failed to parse venue location string:', venueData.location);
          setDistance('N/A');
          return;
        }
      } else {
        venueCoords = venueData.location;
      }

      // Validate coordinates
      if (venueCoords?.latitude && venueCoords?.longitude &&
          typeof venueCoords.latitude === 'number' && 
          typeof venueCoords.longitude === 'number' &&
          !isNaN(venueCoords.latitude) && 
          !isNaN(venueCoords.longitude) &&
          venueCoords.latitude !== 0 && 
          venueCoords.longitude !== 0) {
        
        const distanceKm = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          venueCoords.latitude,
          venueCoords.longitude
        );
        
        const formattedDistance = formatDistance(distanceKm);
        setDistance(formattedDistance);
        console.log(`📍 Distance calculated for ${venueData.name}: ${formattedDistance}`);
      } else {
        console.log('❌ Invalid venue coordinates:', venueCoords);
        setDistance('N/A');
      }
    } catch (error) {
      console.log('❌ Error calculating distance:', error);
      setDistance('N/A');
    }
  };

  // Generate hourly time slots based on venue operating hours (optimized for fast date switching)
  const generateTimeSlots = useCallback((courtName: string) => {
    if (!venue || !venue.operatingHours) return [];
    
    const { open, close } = venue.operatingHours;
    const slots = [];
    
    // Parse opening time (format: "10:00" or "10:00 AM")
    const openHour = parseInt(open.split(':')[0]);
    const closeHour = parseInt(close.split(':')[0]);
    
    // Get current time info
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(selectedDate);
    selectedDay.setHours(0, 0, 0, 0);
    const isToday = selectedDay.getTime() === today.getTime();
    
    // If viewing today, calculate the next available hour slot
    let startHour = openHour;
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // If current time is past the minute mark, start from next hour
      // For example: if it's 2:30 PM (14:30), start from 3 PM (15:00)
      if (currentMinute > 0) {
        startHour = Math.max(currentHour + 1, openHour);
      } else {
        // If it's exactly on the hour (e.g., 2:00 PM), can start from current hour
        startHour = Math.max(currentHour, openHour);
      }
      
      console.log(`⏰ [VENUE DETAILS] Current time: ${currentHour}:${currentMinute}, Starting from hour: ${startHour}`);
      
      // If current time is past closing time, show no slots
      if (startHour >= closeHour) {
        console.log(`⏰ [VENUE DETAILS] All time slots have passed for today`);
        return [];
      }
    }
    
    // Get bookings for this court
    const courtBookings = bookingsForDate.filter(booking => 
      (booking as any).court === courtName
    );
    
    console.log(`⏰ [VENUE DETAILS] Generating slots for ${courtName}:`);
    console.log(`  - Total bookings for date: ${bookingsForDate.length}`);
    console.log(`  - Bookings for this court: ${courtBookings.length}`);
    if (courtBookings.length > 0) {
      courtBookings.forEach((b: any, idx: number) => {
        console.log(`  - Booking ${idx + 1}:`, {
          id: b.id,
          time: b.time,
          status: b.status,
          bookingType: b.bookingType,
          players: b.players,
          userId: b.userId
        });
      });
    }
    
    // Generate hourly slots starting from startHour
    for (let hour = startHour; hour < closeHour; hour++) {
      const period = hour < 12 ? 'AM' : 'PM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const timeStr = `${displayHour}:00 ${period}`;
      
      // Check if this time slot is booked
      const booking = courtBookings.find(b => {
        // Parse booking time (e.g., "6:00 AM")
        const bookingTimeParts = b.time.split(' ');
        const bookingHourStr = bookingTimeParts[0].split(':')[0];
        const bookingPeriod = bookingTimeParts[1];
        let bookingHour = parseInt(bookingHourStr);
        
        // Convert to 24-hour format
        if (bookingPeriod === 'PM' && bookingHour !== 12) {
          bookingHour += 12;
        } else if (bookingPeriod === 'AM' && bookingHour === 12) {
          bookingHour = 0;
        }
        
        // Parse duration (e.g., "2 hr" -> 2)
        const durationHours = parseInt(b.duration.split(' ')[0]);
        
        // Check if current hour falls within booking range
        return hour >= bookingHour && hour < bookingHour + durationHours;
      });
      
      let status = 'available';
      let spotsLeft = 4;
      let duration = 1;
      let endTime = null;
      
      if (booking) {
        // ✅ FIX: Check the correct field - 'status' not 'bookingStatus'
        const bookingStatus = (booking as any).status || 'pending';
        const bookingType = (booking as any).bookingType || 'Private Game';
        const playersNeeded = parseInt((booking as any).players || '4');
        const bookingUserId = (booking as any).userId;
        
        console.log(`  📋 [TIME SLOT ${timeStr}] Booking found:`, {
          bookingId: (booking as any).id,
          bookingStatus,
          bookingType,
          playersNeeded,
          bookingUserId,
          currentUserId
        });
        
        // ✅ CHECK IF CURRENT USER IS THE HOST
        const isHost = bookingUserId === currentUserId;
        
        // ✅ CONFIRMED bookings are ALWAYS shown (with proper status)
        if (bookingStatus === 'confirmed') {
          // Private games = fully booked (greyed out)
          if (bookingType === 'Private Game') {
            status = 'booked';
            spotsLeft = 0;
            console.log(`  ⚪ Private Game → BOOKED (grey)`);
          } 
          // Open games = check if user is host or can join
          else if (bookingType === 'Open Game') {
            // If user is the HOST, show as booked (your game)
            if (isHost) {
              status = 'booked';
              spotsLeft = 0;
              console.log(`  ⚪ Your Open Game (HOST) → BOOKED (grey, your game)`);
            }
            // If user is NOT the host, show join options based on spots available
            else {
              // ✅ Color logic based on spots remaining (1-5 players supported)
              if (playersNeeded === 0) {
                // Game is full
                status = 'booked';
                spotsLeft = 0;
                console.log(`  ⚪ Open Game FULL → BOOKED (grey)`);
              } else if (playersNeeded === 1) {
                // Last spot available - RED (urgent)
                status = 'last-spot';
                spotsLeft = 1;
                console.log(`  🔴 Open Game → LAST SPOT (red, 1 spot left)`);
              } else if (playersNeeded === 2) {
                // 2 spots left - ORANGE (filling up)
                status = 'joining';
                spotsLeft = 2;
                console.log(`  🟠 Open Game → JOINING (orange, 2 spots left)`);
              } else if (playersNeeded >= 3) {
                // 3+ spots left - ORANGE (plenty of space)
                status = 'joining';
                spotsLeft = playersNeeded;
                console.log(`  🟠 Open Game → JOINING (orange, ${playersNeeded} spots left)`);
              }
            }
          }
        } 
        // ⏳ PENDING bookings SHOULD show as booked (waiting for approval)
        else if (bookingStatus === 'pending') {
          status = 'booked';
          spotsLeft = 0;
          console.log(`  ⏳ Pending booking → BOOKED (grey, waiting approval)`);
        }
        // ❌ REJECTED/CANCELLED bookings don't affect availability
        else if (bookingStatus === 'rejected' || bookingStatus === 'cancelled') {
          status = 'available';
          console.log(`  ✅ Rejected/Cancelled → AVAILABLE (green)`);
        }
        
        // Only handle multi-hour bookings for CONFIRMED/PENDING statuses
        // Rejected/Cancelled bookings should show each hour as available individually
        if (bookingStatus === 'confirmed' || bookingStatus === 'pending') {
          // Check if this is the start of a multi-hour booking
          const bookingTimeParts = booking.time.split(' ');
          const bookingHourStr = bookingTimeParts[0].split(':')[0];
          const bookingPeriod = bookingTimeParts[1];
          let bookingStartHour = parseInt(bookingHourStr);
          
          if (bookingPeriod === 'PM' && bookingStartHour !== 12) {
            bookingStartHour += 12;
          } else if (bookingPeriod === 'AM' && bookingStartHour === 12) {
            bookingStartHour = 0;
          }
          
          if (hour === bookingStartHour) {
            // This is the start of the booking
            duration = parseInt(booking.duration.split(' ')[0]);
            if (duration > 1) {
              const endHour = hour + duration;
              const endPeriod = endHour < 12 ? 'AM' : 'PM';
              const endDisplayHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
              endTime = `${endDisplayHour}:00 ${endPeriod}`;
            }
          } else {
            // This is a continuation slot, skip it
            continue;
          }
        }
      }
      
      slots.push({
        time: timeStr,
        endTime: endTime,
        status: status,
        price: venue.pricing.basePrice,
        duration: duration,
        spotsLeft: spotsLeft
      });
    }
    
    return slots;
  }, [venue, selectedDate, bookingsForDate]); // Depend on key values for optimization

  // Generate dates for next 15 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }
  };

  // Open date picker with animation
  const openDatePicker = () => {
    setShowDatePicker(true);
    Animated.spring(datePickerAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
  };

  // Close date picker with animation
  const closeDatePicker = () => {
    // ✅ FIX: Use faster timing animation for smoother close
    Animated.timing(datePickerAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowDatePicker(false);
    });
  };

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'booked':
        return '#D1D5DB'; // Faded gray
      case 'available':
        return '#10B981'; // Green
      case 'joining':
        return '#F59E0B'; // Orange  
      case 'last-spot':
        return '#EF4444'; // Red
      default:
        return '#D1D5DB';
    }
  };

  useEffect(() => {
    // ✅ OPTIMIZATION: Load ALL data in parallel (no waterfalls!)
    const loadAllData = async () => {
      try {
        setLoading(true);
        
        console.log('⚡ [VENUE DETAILS] Loading all data in parallel...');
        const startTime = Date.now();
        
        // ✅ Get current user ID first
        const { supabase } = await import('@/src/common/services/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          console.log('👤 [VENUE DETAILS] Current user ID:', user.id);
        }
        
        // Run ALL async operations in parallel
        const [
          venueResult,
          locationResult,
          bookingsResult
        ] = await Promise.allSettled([
          loadVenueDetails(),
          getUserLocation(),
          preloadAllBookings()
        ]);
        
        const duration = Date.now() - startTime;
        console.log(`✅ [VENUE DETAILS] Parallel load completed in ${duration}ms`);
        
        // Process results (all settled, so no failures block the screen)
        if (venueResult.status === 'rejected') {
          console.error('Venue loading failed:', venueResult.reason);
        }
        if (locationResult.status === 'rejected') {
          console.error('Location loading failed:', locationResult.reason);
        }
        if (bookingsResult.status === 'rejected') {
          console.error('Bookings loading failed:', bookingsResult.reason);
        }

        // ✅ Set up real-time subscription after initial load
        setupRealtimeSubscription();
        
      } catch (error) {
        console.error('❌ [VENUE DETAILS] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();

    // ✅ Cleanup subscription on unmount
    return () => {
      if (bookingSubscriptionRef.current) {
        console.log('🧹 [VENUE DETAILS] Cleaning up real-time subscription');
        bookingSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Refresh bookings when screen comes into focus (e.g., after making a booking)
  useFocusEffect(
    useCallback(() => {
      // Reload bookings whenever the screen is focused
      if (bookingsLoaded) {
        console.log('🔄 [VENUE DETAILS] Screen focused - refreshing bookings...');
        preloadAllBookings();
      }
    }, [bookingsLoaded])
  );

  useEffect(() => {
    // Filter bookings instantly when date changes (if bookings are already loaded)
    if (bookingsLoaded && allBookings.length >= 0) {
      filterBookingsForDate();
    }
  }, [selectedDate, allBookings, bookingsLoaded]);

  // Preload all bookings for the next 15 days (for instant date switching)
  const preloadAllBookings = async () => {
    try {
      console.log('📅 [VENUE DETAILS] Preloading bookings for this venue...');
      const startTime = Date.now();
      const { supabase } = await import('@/src/common/services/supabase');
      
      // Need venue ID to filter bookings
      const venueId = params.venueId as string;
      console.log('🏢 [VENUE DETAILS] Venue ID:', venueId);
      
      // Generate date range for next 15 days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 15);
      
      const dateRange = {
        start: today.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      };
      console.log('📅 [VENUE DETAILS] Date range:', dateRange);
      
      // ✅ OPTIMIZATION: Query ONLY this venue's bookings directly from DB (10-50x faster!)
      // ✅ ALSO count participants for accurate spot tracking
      const { data: venueBookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          venue_id,
          court_id,
          booking_date,
          start_time,
          end_time,
          duration,
          status,
          booking_type,
          player_count,
          user_id,
          total_amount,
          courts (
            name,
            type
          )
        `)
        .eq('venue_id', venueId)
        .gte('booking_date', dateRange.start)
        .lte('booking_date', dateRange.end)
        .order('booking_date', { ascending: true });
      
      if (error) {
        console.error('❌ [VENUE DETAILS] Error loading venue bookings:', error);
        console.error('❌ [VENUE DETAILS] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setAllBookings([]);
        setBookingsLoaded(true);
        return;
      }
      
      console.log(`📊 [VENUE DETAILS] Raw bookings from DB: ${venueBookings?.length || 0}`);
      if (venueBookings && venueBookings.length > 0) {
        console.log('📋 [VENUE DETAILS] First booking sample:', {
          id: venueBookings[0].id,
          status: venueBookings[0].status,
          booking_type: venueBookings[0].booking_type,
          booking_date: venueBookings[0].booking_date,
          user_id: venueBookings[0].user_id,
          player_count: venueBookings[0].player_count
        });
        console.log('📋 [VENUE DETAILS] All booking dates:', venueBookings.map((b: any) => b.booking_date));
      } else {
        console.warn('⚠️ [VENUE DETAILS] No bookings found for venue:', venueId);
        console.warn('⚠️ [VENUE DETAILS] This could be due to:');
        console.warn('  1. RLS (Row Level Security) policies blocking the query');
        console.warn('  2. No bookings exist for this venue');
        console.warn('  3. Bookings exist but outside the date range');
      }
      
      // ✅ For each open game booking, count actual participants
      const bookingsWithParticipants = await Promise.all(
        (venueBookings || []).map(async (booking: any) => {
          // ✅ For open games, player_count in DB already stores "spots still needed"
          // Just fetch participant count for logging/debugging purposes
          let actualPlayerCount = booking.player_count;
          
          // If it's an open game, count participants from booking_participants table (for logging)
          if (booking.booking_type === 'open' && booking.status === 'confirmed') {
            const { data: participants, error: partError } = await supabase
              .from('booking_participants')
              .select('id')
              .eq('booking_id', booking.id)
              .eq('status', 'confirmed'); // ✅ Use 'confirmed' status
            
            if (!partError && participants) {
              // ✅ player_count in DB = spots still needed (don't recalculate!)
              const spotsNeeded = booking.player_count || 0;
              const currentPlayers = participants.length + 1; // +1 for host
              
              console.log(`🎮 [BOOKING ${booking.id.substring(0, 8)}] Participant count:`, {
                spotsNeeded: spotsNeeded,
                participants: participants.length,
                host: 1,
                currentPlayers: currentPlayers,
                totalSlots: currentPlayers + spotsNeeded
              });
              
              // ✅ Use the DB value directly (it's already correct)
              actualPlayerCount = spotsNeeded;
            }
          }
          
          return {
            ...booking,
            player_count: actualPlayerCount
          };
        })
      );
      
      console.log(`✅ [VENUE DETAILS] Processed ${bookingsWithParticipants.length} bookings with participant data`);
      
      // Transform to expected format
      const transformedBookings = bookingsWithParticipants.map((booking: any) => {
        // Convert DB time format (HH:MM:SS) to display format (H:MM AM/PM)
        const convertToDisplayTime = (dbTime: string) => {
          if (!dbTime) return '';
          const [hours, minutes] = dbTime.split(':').map(Number);
          const period = hours < 12 ? 'AM' : 'PM';
          const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
          return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
        };

        return {
          id: booking.id,
          venueId: booking.venue_id,
          courtId: booking.court_id,
          court: booking.courts?.name || 'Unknown Court',
          date: booking.booking_date,
          time: convertToDisplayTime(booking.start_time), // Convert to display format
          startTime: booking.start_time, // Keep original for reference
          endTime: booking.end_time,
          duration: `${booking.duration} hr${booking.duration > 1 ? 's' : ''}`, // Format duration
          status: booking.status,
          bookingType: booking.booking_type === 'open' ? 'Open Game' : 'Private Game',
          players: booking.player_count?.toString() || '4',
          userId: booking.user_id,
          totalAmount: booking.total_amount,
        };
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ [VENUE DETAILS] Loaded ${transformedBookings.length} bookings in ${duration}ms`);
      
      if (transformedBookings.length > 0) {
        console.log('📋 [VENUE DETAILS] Sample transformed booking:', {
          id: transformedBookings[0].id?.substring(0, 8),
          court: transformedBookings[0].court,
          date: transformedBookings[0].date,
          time: transformedBookings[0].time,
          status: transformedBookings[0].status,
          bookingType: transformedBookings[0].bookingType,
          players: transformedBookings[0].players,
          userId: transformedBookings[0].userId?.substring(0, 8)
        });
      }
      
      setAllBookings(transformedBookings);
      setBookingsLoaded(true);
      
      // Filter for current selected date
      filterBookingsForSelectedDate(transformedBookings, selectedDate);
      
    } catch (error) {
      console.error('❌ [VENUE DETAILS] Error preloading bookings:', error);
      setAllBookings([]);
      setBookingsLoaded(true);
      setBookingsForDate([]);
    }
  };

  // ✅ Set up real-time subscription for booking changes
  const setupRealtimeSubscription = async () => {
    try {
      // Cleanup existing subscription
      if (bookingSubscriptionRef.current) {
        bookingSubscriptionRef.current.unsubscribe();
      }

      const { supabase } = await import('@/src/common/services/supabase');
      const venueId = params.venueId as string;

      console.log('📡 [VENUE DETAILS] Setting up real-time subscription for venue:', venueId);

      // Subscribe to booking changes for this venue
      bookingSubscriptionRef.current = supabase
        .channel(`venue-bookings-${venueId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'bookings',
            filter: `venue_id=eq.${venueId}`
          },
          (payload: any) => {
            console.log('🔔 [VENUE DETAILS] Booking change detected:', payload.eventType);
            console.log('📦 [VENUE DETAILS] Payload:', {
              event: payload.eventType,
              bookingId: payload.new?.id || payload.old?.id,
              status: payload.new?.status || payload.old?.status,
              bookingDate: payload.new?.booking_date || payload.old?.booking_date
            });
            
            // Reload bookings to get fresh data
            console.log('🔄 [VENUE DETAILS] Refreshing bookings due to real-time update...');
            preloadAllBookings();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ [VENUE DETAILS] Real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ [VENUE DETAILS] Real-time subscription error');
          } else if (status === 'TIMED_OUT') {
            console.warn('⚠️ [VENUE DETAILS] Real-time subscription timed out');
          }
        });

    } catch (error) {
      console.error('❌ [VENUE DETAILS] Failed to set up real-time subscription:', error);
    }
  };

  // Instantly filter preloaded bookings for the selected date
  const filterBookingsForDate = () => {
    filterBookingsForSelectedDate(allBookings, selectedDate);
  };

  // Helper function to filter bookings for a specific date
  const filterBookingsForSelectedDate = (bookings: any[], date: Date) => {
    const dateStr = date.toDateString();
    const filteredBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      const matches = bookingDate.toDateString() === dateStr;
      return matches;
    });
    
    console.log(`📅 [VENUE DETAILS] Filtering for ${dateStr}:`, {
      totalBookings: bookings.length,
      matchingBookings: filteredBookings.length
    });
    
    if (filteredBookings.length > 0) {
      console.log('📋 [VENUE DETAILS] Filtered bookings:', 
        filteredBookings.map((b: any) => ({
          id: b.id?.substring(0, 8),
          court: b.court,
          time: b.time,
          status: b.status,
          bookingType: b.bookingType
        }))
      );
    }
    
    setBookingsForDate(filteredBookings);
  };

  if (loading) {
    return (
      <View style={[venueDetailsStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#047857" />
        <Text style={venueDetailsStyles.loadingText}>Loading venue details...</Text>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={[venueDetailsStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={venueDetailsStyles.errorText}>Venue not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={venueDetailsStyles.goBackButton}>
          <Text style={venueDetailsStyles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImages = venue.images.length > 0 ? venue.images : [
    'https://via.placeholder.com/400x200/047857/ffffff?text=No+Image'
  ];

  const amenityIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    'Parking': 'car-outline',
    'Lighting': 'sunny-outline',
    'Washrooms': 'water-outline',
    'Refreshments': 'cafe-outline',
    'Seating': 'people-outline',
    'Cafeteria': 'restaurant-outline',
    'Locker Rooms': 'lock-closed-outline',
    'Air Conditioning': 'snow-outline',
    'WiFi': 'wifi-outline',
    'Shower Facilities': 'water-outline',
    'Equipment Rental': 'basketball-outline',
    'First Aid': 'medical-outline',
    'Pro Shop': 'storefront-outline'
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View style={venueDetailsStyles.container}>
        {/* White Header matching Social Hub design */}
        <View style={[venueDetailsStyles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={venueDetailsStyles.headerTitle}>Venue Details</Text>
        </View>

        <ScrollView>
          {/* Image Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {displayImages.map((img: string, index: number) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={[venueDetailsStyles.image, { width, height: 224 }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          <View style={venueDetailsStyles.dotsContainer}>
            {displayImages.map((_: string, i: number) => (
              <View
                key={i}
                style={[venueDetailsStyles.dot, i === activeIndex ? venueDetailsStyles.dotActive : venueDetailsStyles.dotInactive]}
              />
            ))}
          </View>

          {/* Venue Info */}
          <View style={venueDetailsStyles.venueInfo}>
            <View style={venueDetailsStyles.venueNameRow}>
              <Text style={venueDetailsStyles.venueName}>{venue.name}</Text>
              <View style={venueDetailsStyles.ratingContainer}>
                <Ionicons name="star" size={16} color="#EA580C" />
                <Text style={venueDetailsStyles.ratingText}>
                  {venue.rating.toFixed(1)} ({Math.floor(Math.random() * 50) + 10})
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={venueDetailsStyles.venueLocation}
              onPress={() => {
                // In a real app, use Linking.openURL with Google Maps URL
                // Maps functionality will be implemented with proper linking
              }}
            >
              <Ionicons name="map-outline" size={18} color="#047857" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={venueDetailsStyles.locationText} numberOfLines={2} ellipsizeMode="tail">
                  {venue.address}
                </Text>
                <Text style={venueDetailsStyles.distanceText}>• {distance}</Text>
              </View>
            </TouchableOpacity>
            
            {/* Operating Hours */}
            <View style={venueDetailsStyles.operatingHours}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={venueDetailsStyles.hoursText}>
                {venue.operatingHours.open} - {venue.operatingHours.close} • {venue.operatingHours.days.join(', ')}
              </Text>
            </View>
          </View>


          {/* Amenities */}
          <View style={venueDetailsStyles.amenities}>
            <Text style={venueDetailsStyles.amenitiesTitle}>Amenities</Text>
            <View style={venueDetailsStyles.amenitiesGrid}>
              {venue.amenities.map((amenity, index) => (
                <View key={index} style={venueDetailsStyles.amenityItem}>
                  <Ionicons 
                    name={amenityIcons[amenity] || "checkmark-circle-outline"} 
                    size={20} 
                    color="#047857" 
                  />
                  <Text style={venueDetailsStyles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* About */}
          <View style={venueDetailsStyles.about}>
            <Text style={venueDetailsStyles.aboutTitle}>About</Text>
            <Text style={venueDetailsStyles.aboutText}>
              {venue.description}
            </Text>
          </View>

          {/* Advanced Court Availability */}
          <View style={venueDetailsStyles.courtAvailability}>
            <View style={venueDetailsStyles.availabilityHeader}>
              <Text style={venueDetailsStyles.amenitiesTitle}>Court Availability</Text>
              <TouchableOpacity 
                style={venueDetailsStyles.dateSelector}
                onPress={openDatePicker}
              >
                <Text style={venueDetailsStyles.todayLabel}>{formatDate(selectedDate)}</Text>
                <Ionicons name="chevron-down-outline" size={16} color="#047857" />
              </TouchableOpacity>
            </View>
            
            {/* Loading indicator for initial booking load */}
            {!bookingsLoaded && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <ActivityIndicator size="small" color="#047857" />
                <Text style={{ marginLeft: 8, color: '#6B7280', fontSize: 14 }}>
                  Loading availability...
                </Text>
              </View>
            )}
            
            {/* Courts with Horizontal Scrollable Time Slots */}
            {availableCourts.length > 0 ? (
              availableCourts.map((court, courtIndex) => (
                <View key={courtIndex} style={venueDetailsStyles.courtSection}>
                  <Text style={venueDetailsStyles.courtTitle}>{court.name}</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={venueDetailsStyles.timeSlotsScroll}
                    contentContainerStyle={venueDetailsStyles.timeSlotsContainer}
                  >
                    {generateTimeSlots(court.name).map((slot, timeIndex) => {
                      const cardWidth = slot.duration > 1 ? 100 + (slot.duration - 1) * 60 : 100;
                      const slotColor = getSlotColor(slot.status);
                      
                      return (
                        <TouchableOpacity
                          key={timeIndex}
                          style={[
                            venueDetailsStyles.timeSlotCard,
                            {
                              width: cardWidth,
                              backgroundColor: slotColor + '15',
                              borderColor: slotColor,
                              borderWidth: 1.5,
                            }
                          ]}
                          onPress={() => {
                            if (slot.status === 'booked') {
                              // Booked slots are disabled
                              return;
                            } else if (slot.status === 'available') {
                              // Available slots - open booking form
                              router.push({
                                pathname: '/BookingFormScreen',
                                params: {
                                  venueId: venue.id,
                                  venueName: venue.name,
                                  venuePrice: slot.price.toString(),
                                  ownerId: venue.ownerId,
                                  court: court.name,
                                  courtId: court.uuid || court.id,
                                  timeSlot: slot.time
                                }
                              });
                            } else if (slot.status === 'joining' || slot.status === 'last-spot') {
                              // Joining/last-spot slots - open join game screen
                              // Need to get the booking ID for this time slot
                              const booking = bookingsForDate.find(b => 
                                (b as any).court === court.name && (b as any).time === slot.time
                              );
                              
                              if (booking && (booking as any).id) {
                                router.push({
                                  pathname: '/JoinGameScreen' as any,
                                  params: {
                                    bookingId: (booking as any).id
                                  }
                                });
                              }
                            }
                          }}
                          disabled={slot.status === 'booked'}
                        >
                          <Text style={[
                            venueDetailsStyles.slotTime,
                            { color: slot.status === 'booked' ? '#9CA3AF' : '#000' }
                          ]}>
                            {slot.endTime ? `${slot.time} - ${slot.endTime}` : slot.time}
                          </Text>
                          <Text style={[
                            venueDetailsStyles.slotPrice,
                            { 
                              color: slotColor,
                              fontWeight: '600'
                            }
                          ]}>
                            {slot.status === 'booked' ? 'Booked' : 
                             slot.status === 'available' ? `₹${slot.price}` :
                             slot.status === 'last-spot' ? '1 spot left' :
                             'Join Game'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                ))
            ) : (
              <Text style={venueDetailsStyles.noCourtsText}>
                No courts available
              </Text>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="none"
        onRequestClose={closeDatePicker}
      >
        <Animated.View 
          style={[
            venueDetailsStyles.modalOverlay,
            {
              // ✅ FIX: Animate the overlay opacity to prevent lingering fade
              opacity: datePickerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            }
          ]}
        >
          <TouchableOpacity 
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            activeOpacity={1}
            onPress={closeDatePicker}
          >
            <Animated.View
              style={[
                venueDetailsStyles.datePickerContainer,
                {
                  transform: [{
                    scale: datePickerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    })
                  }],
                  opacity: datePickerAnimation,
                }
              ]}
              onStartShouldSetResponder={() => true}
            >
            <View style={venueDetailsStyles.datePickerHeader}>
              <Text style={venueDetailsStyles.datePickerTitle}>
                Select Date
              </Text>
            </View>
            
            <ScrollView style={venueDetailsStyles.datePickerScroll}>
              {generateDates().map((date, index) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      venueDetailsStyles.dateOption,
                      isSelected && venueDetailsStyles.dateOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedDate(date);
                      // ✅ FIX: Smooth close animation instead of instant dismiss
                      Animated.timing(datePickerAnimation, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                      }).start(() => {
                        setShowDatePicker(false);
                      });
                    }}
                  >
                    <Text style={[
                      venueDetailsStyles.dateOptionText,
                      isSelected && venueDetailsStyles.dateOptionTextSelected
                    ]}>
                      {formatDate(date)}
                    </Text>
                    {date.toDateString() !== new Date().toDateString() && (
                      <Text style={venueDetailsStyles.dateSubtext}>
                        {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}