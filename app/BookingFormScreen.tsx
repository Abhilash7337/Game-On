import AppHeader from '@/src/common/components/AppHeader';
import {
    buttonStyles,
    cardStyles,
    chipStyles,
    inputStyles,
    layoutStyles,
    modalStyles,
    summaryStyles,
    textStyles,
    bookingFormStyles
} from '@/styles/screens/QuickBookScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import services at top level to prevent rebundling
import { VenueStorageService } from '@/src/common/services/venueStorage';
import { supabase } from '@/src/common/services/supabase';
import { BookingStorageService } from '@/src/common/services/bookingStorage';

export default function BookingFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    
    // Get venue data from params
    const venueId = params.venueId as string;
    const venueName = params.venueName as string;
    const venuePrice = parseInt(params.venuePrice as string) || 500;
    const ownerId = params.ownerId as string;
    const preSelectedCourt = params.court as string;
    const preSelectedCourtId = params.courtId as string; // Real court UUID from database
    const preSelectedTime = params.timeSlot as string;
    
    const [courts, setCourts] = useState<string[]>([]);
    const [times, setTimes] = useState<string[]>([]);
    const [durations, setDurations] = useState<string[]>([]);
    const [skillLevels, setSkillLevels] = useState<string[]>([]);
    const [playersRequired, setPlayersRequired] = useState<string[]>([]);
    const [timeSlotStatuses, setTimeSlotStatuses] = useState<{[key: string]: {status: string; spotsLeft: number}}>({});
    
    const [court, setCourt] = useState<string>(preSelectedCourt || '');
    const [courtId, setCourtId] = useState<string>(preSelectedCourtId || ''); // Store actual court UUID
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [time, setTime] = useState<string>(preSelectedTime || '');
    const [duration, setDuration] = useState<string>('');
    const [bookingType, setBookingType] = useState<'Open Game' | 'Private Game' | ''>('');
    const [skillLevel, setSkillLevel] = useState<string>('');
    const [players, setPlayers] = useState<string>('');

    // Submitting state to prevent double-clicks
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal states for custom dropdowns
    const [showCourtModal, setShowCourtModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showSkillModal, setShowSkillModal] = useState(false);
    const [showPlayersModal, setShowPlayersModal] = useState(false);

    useEffect(() => {
        // Load courts for this specific venue
        loadVenueCourts();
        loadVenueOperatingHours();
        loadTimeSlotStatuses();
        setDurations(['1 hr', '2 hr', '3 hr']);
        setSkillLevels(['Beginner', 'Intermediate', 'Advanced']);
        setPlayersRequired(['1', '2', '3', '4', '5']); // ✅ Support 1-5 players
    }, []);

    const loadVenueOperatingHours = async () => {
        try {
            const venues = await VenueStorageService.getAllVenues();
            const venue = venues.find(v => v.id === venueId);
            
            if (venue && venue.operatingHours) {
                const { open, close } = venue.operatingHours;
                const openHour = parseInt(open.split(':')[0]);
                const closeHour = parseInt(close.split(':')[0]);
                
                const generatedTimes = [];
                for (let hour = openHour; hour < closeHour; hour++) {
                    const period = hour < 12 ? 'AM' : 'PM';
                    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                    generatedTimes.push(`${displayHour}:00 ${period}`);
                }
                setTimes(generatedTimes);
            } else {
                // Default times if no operating hours
                setTimes(['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']);
            }
        } catch (error) {
            console.error('Error loading venue hours:', error);
            setTimes(['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']);
        }
    };

    const loadTimeSlotStatuses = async () => {
        try {
            // Fetch real bookings from Supabase for this venue and date
            
            const dateStr = date.toISOString().split('T')[0];
            
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select('start_time, end_time, booking_type, player_count, status')
                .eq('venue_id', venueId)
                .eq('booking_date', dateStr)
                .in('status', ['pending', 'confirmed']);

            if (error) {
                console.error('❌ Error loading time slot statuses:', error);
                // Fallback to all available if error
                const statuses: {[key: string]: {status: string; spotsLeft: number}} = {};
                times.forEach(slot => {
                    statuses[slot] = { status: 'available', spotsLeft: 4 };
                });
                setTimeSlotStatuses(statuses);
                return;
            }

            const statuses: {[key: string]: {status: string; spotsLeft: number}} = {};
            
            times.forEach(slot => {
                // Parse the slot time to compare with bookings
                const slotParts = slot.split(' ');
                const timePart = slotParts[0];
                const period = slotParts[1];
                
                let [hours, minutes] = timePart.split(':').map(Number);
                
                if (period === 'PM' && hours !== 12) {
                    hours += 12;
                } else if (period === 'AM' && hours === 12) {
                    hours = 0;
                }
                
                const slotTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                
                // Check if this time slot overlaps with any booking
                const booking = bookings?.find(b => {
                    const bookingStart = b.start_time;
                    const bookingEnd = b.end_time;
                    return slotTime >= bookingStart && slotTime < bookingEnd;
                });
                
                if (booking) {
                    // Time slot is occupied
                    if (booking.booking_type === 'Private Game' || booking.status === 'confirmed') {
                        statuses[slot] = { status: 'booked', spotsLeft: 0 };
                    } else if (booking.booking_type === 'Open Game') {
                        const playerCount = booking.player_count || 4;
                        if (playerCount === 1) {
                            statuses[slot] = { status: 'last-spot', spotsLeft: 1 };
                        } else if (playerCount <= 2) {
                            statuses[slot] = { status: 'joining', spotsLeft: playerCount };
                        } else {
                            statuses[slot] = { status: 'joining', spotsLeft: playerCount };
                        }
                    } else {
                        statuses[slot] = { status: 'available', spotsLeft: 4 };
                    }
                } else {
                    // Time slot is available
                    statuses[slot] = { status: 'available', spotsLeft: 4 };
                }
            });
            
            setTimeSlotStatuses(statuses);
            console.log('✅ Loaded time slot statuses from database');
        } catch (error) {
            console.error('❌ Error in loadTimeSlotStatuses:', error);
            // Fallback to all available
            const statuses: {[key: string]: {status: string; spotsLeft: number}} = {};
            times.forEach(slot => {
                statuses[slot] = { status: 'available', spotsLeft: 4 };
            });
            setTimeSlotStatuses(statuses);
        }
    };

    const getTimeSlotColor = (timeSlot: string) => {
        const status = timeSlotStatuses[timeSlot];
        if (!status) return colors.gray300;
        
        switch (status.status) {
            case 'booked':
                return colors.gray300; // Faded
            case 'available':
                return '#10B981'; // Green
            case 'joining':
                return '#F59E0B'; // Orange
            case 'last-spot':
                return '#EF4444'; // Red
            default:
                return colors.gray300;
        }
    };

    const isTimeSlotDisabled = (timeSlot: string) => {
        const status = timeSlotStatuses[timeSlot];
        return status?.status === 'booked';
    };

    const loadVenueCourts = async () => {
        try {
            
            
            
            // Fetch courts with UUIDs from database
            const { data: courtsData, error } = await supabase
                .from('courts')
                .select('id, name')
                .eq('venue_id', venueId)
                .eq('is_active', true);
            
            if (!error && courtsData && courtsData.length > 0) {
                setCourts(courtsData.map(c => c.name));
                
                // If pre-selected court exists, set its UUID
                if (preSelectedCourt && !courtId) {
                    const selectedCourtData = courtsData.find(c => c.name === preSelectedCourt);
                    if (selectedCourtData) {
                        setCourtId(selectedCourtData.id);
                    }
                }
            } else {
                // Fallback to venue storage service
                const venues = await VenueStorageService.getAllVenues();
                const venue = venues.find(v => v.id === venueId);
                
                if (venue && venue.courts.length > 0) {
                    setCourts(venue.courts.map(court => court.name));
                } else {
                    // Default courts if none specified
                    setCourts(['Court A1', 'Court A2', 'Court B1', 'Court B2']);
                }
            }
        } catch (error) {
            console.error('Error loading venue courts:', error);
            setCourts(['Court A1', 'Court A2', 'Court B1', 'Court B2']);
        }
    };

    // Handle court selection - also fetch the court UUID
    const handleCourtSelection = async (courtName: string) => {
        setCourt(courtName);
        
        // Fetch the court UUID for this court name
        try {
            
            const { data: courtData } = await supabase
                .from('courts')
                .select('id')
                .eq('venue_id', venueId)
                .eq('name', courtName)
                .single();
            
            if (courtData) {
                setCourtId(courtData.id);
                console.log('🎾 [BOOKING FORM] Selected court UUID:', courtData.id);
            }
        } catch (error) {
            console.error('Error fetching court UUID:', error);
        }
    };

    const isFormValid =
        court !== '' &&
        time !== '' &&
        duration !== '' &&
        bookingType !== '' &&
        (bookingType === 'Private Game' || (skillLevel !== '' && players !== ''));

    // Custom Dropdown Component with Time Slot Colors
    const CustomDropdown = ({ 
        title, 
        value, 
        placeholder, 
        options, 
        onSelect, 
        visible, 
        onClose,
        isTimeDropdown = false
    }: {
        title: string;
        value: string;
        placeholder: string;
        options: string[];
        onSelect: (value: string) => void;
        visible: boolean;
        onClose: () => void;
        isTimeDropdown?: boolean;
    }) => (
        <Modal visible={visible} transparent animationType="slide">
            <View style={modalStyles.overlay}>
                <View style={[modalStyles.content, { backgroundColor: colors.background }]}>
                    <View style={[modalStyles.header, { borderBottomColor: colors.gray200 }]}>
                        <Text style={[modalStyles.title, { color: colors.textPrimary }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => {
                            const isDisabled = isTimeDropdown && isTimeSlotDisabled(item);
                            const slotColor = isTimeDropdown ? getTimeSlotColor(item) : colors.textPrimary;
                            const status = timeSlotStatuses[item];
                            
                            return (
                                <TouchableOpacity
                                    style={[
                                        modalStyles.option, 
                                        { 
                                            borderBottomColor: colors.gray200,
                                            opacity: isDisabled ? 0.4 : 1,
                                            backgroundColor: isTimeDropdown && value === item ? slotColor + '20' : 'transparent'
                                        }
                                    ]}
                                    onPress={() => {
                                        if (!isDisabled) {
                                            onSelect(item);
                                            onClose();
                                        }
                                    }}
                                    disabled={isDisabled}
                                >
                                    <View style={bookingFormStyles.slotIndicatorRow}>
                                        {isTimeDropdown && (
                                            <View style={[
                                                bookingFormStyles.slotIndicator,
                                                { backgroundColor: slotColor }
                                            ]} />
                                        )}
                                        <Text style={[
                                            modalStyles.optionText, 
                                            { 
                                                color: isDisabled ? colors.textSecondary : colors.textPrimary,
                                                flex: 1
                                            }
                                        ]}>
                                            {item}
                                        </Text>
                                        {isTimeDropdown && status && (
                                            <Text style={bookingFormStyles.slotStatusText}>
                                                {status.status === 'booked' ? 'Booked' : 
                                                 status.status === 'available' ? 'Available' :
                                                 status.status === 'last-spot' ? '1 spot left' :
                                                 `${status.spotsLeft} spots`}
                                            </Text>
                                        )}
                                    </View>
                                    {value === item && <Ionicons name="checkmark" size={20} color={slotColor} />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );

    const calculatePrice = () => {
        if (!duration) return venuePrice;
        
        const durationHours = duration === '1 hr' ? 1 : 
                             duration === '2 hr' ? 2 : 
                             duration === '3 hr' ? 3 : 1;
        
        return Math.round(venuePrice * durationHours);
    };

    const handleBooking = async () => {
        // Early return if already submitting
        if (isSubmitting) {
            console.log('⚠️ [BOOKING] Already submitting, ignoring duplicate click');
            return;
        }

        if (!isFormValid) {
            Alert.alert('Incomplete Form', 'Please fill all required fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('🎯 [BOOKING] Starting booking process...');
            
            // Get the actual authenticated user ID
            
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError) {
                console.error('❌ [BOOKING] Auth error:', authError.message);
                Alert.alert(
                    'Authentication Required', 
                    'Please sign in to make a booking.',
                    [
                        { 
                            text: 'Sign In', 
                            onPress: () => router.push('/login')
                        },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
                return;
            }
            
            console.log('👤 [BOOKING] Authenticated user:', user?.id);
            console.log('📍 [BOOKING] Venue details:', {
                venueId,
                venueName,
                ownerId,
                court,
                courtId
            });
            
            if (!user) {
                Alert.alert(
                    'Authentication Required',
                    'Please sign in to make a booking.',
                    [
                        { 
                            text: 'Sign In', 
                            onPress: () => router.push('/login')
                        },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
                return;
            }

            // Check for booking conflicts BEFORE creating booking
            
            const durationHours = parseInt(duration.split(' ')[0]) || 1;
            
            // Use the actual court UUID if available, otherwise it will be looked up
            const conflictCourtId = courtId || `${venueId}-${court}`;
            
            const hasConflict = await BookingStorageService.checkBookingConflict(
                venueId,
                conflictCourtId,
                date,
                time,
                durationHours
            );

            if (hasConflict) {
                Alert.alert(
                    'Time Slot Unavailable',
                    'This time slot is already booked. Please select a different time or court.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Create booking request (pending approval)
            const bookingData = {
                userId: user.id, // Use actual user ID from Supabase auth
                venueId: venueId,
                venueName: venueName,
                ownerId: ownerId,
                court: court,
                courtId: courtId, // Pass the real court UUID if we have it
                date: date,
                time: time,
                duration: duration,
                bookingType: bookingType as 'Open Game' | 'Private Game',
                skillLevel: bookingType === 'Open Game' ? skillLevel : undefined,
                players: bookingType === 'Open Game' ? players : undefined,
                price: calculatePrice(),
                status: 'pending' as const, // Pending client approval
                paymentStatus: 'pending' as const,
            };

            console.log('📋 [BOOKING] Creating booking with data:', {
                userId: bookingData.userId,
                venueId: bookingData.venueId,
                venueName: bookingData.venueName,
                court: bookingData.court,
                courtId: bookingData.courtId,
                date: bookingData.date.toISOString(),
                time: bookingData.time,
                duration: bookingData.duration,
                bookingType: bookingData.bookingType,
                skillLevel: bookingData.skillLevel,
                players: bookingData.players,
                price: bookingData.price,
                status: bookingData.status,
            });

            const booking = await BookingStorageService.createBooking(bookingData);
            
            console.log('✅ [BOOKING] Booking created successfully:', {
                bookingId: booking.id,
                status: booking.status,
                bookingStatus: (booking as any).bookingStatus,
                venueId: booking.venueId,
                courtId: booking.courtId,
                date: booking.date.toISOString(),
                time: booking.time
            });
            
            // Send notification to client - COMMENTED OUT
            // const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
            // await ClientNotificationService.sendBookingRequest(ownerId, booking);

            console.log('📧 [BOOKING] Notification disabled (commented out)');

            Alert.alert(
                'Booking Request Sent!',
                `Your booking request for ${venueName} has been sent to the venue owner for approval. You'll receive a notification once it's confirmed.`,
                [
                    { 
                        text: 'OK', 
                        onPress: () => router.push('/(tabs)')
                    }
                ]
            );
        } catch (error) {
            console.error('❌ [BOOKING] Error creating booking:', error);
            Alert.alert('Error', 'Failed to create booking request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />
            
            <View style={[layoutStyles.container, { paddingTop: 0 }]}>
                {/* White Header */}
                <View style={[{
                    backgroundColor: '#FFFFFF',
                    paddingTop: insets.top + 20,
                    paddingBottom: 20,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                    flexDirection: 'row',
                    alignItems: 'center',
                }]}>
                    <TouchableOpacity onPress={() => router.back()} style={bookingFormStyles.headerBackButton}>
                        <Ionicons name="arrow-back-outline" size={24} color="#000" />
                    </TouchableOpacity>
                    <View style={bookingFormStyles.headerTextContainer}>
                        <Text style={bookingFormStyles.headerTitle}>
                            Book {venueName}
                        </Text>
                        <Text style={bookingFormStyles.headerSubtitle}>
                            Fill in the details below
                        </Text>
                    </View>
                </View>

                <ScrollView 
                    style={{ flex: 1 }} 
                    contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Court Selection */}
                    <Text style={textStyles.label}>Court *</Text>
                    <TouchableOpacity 
                        style={[inputStyles.dropdown, { backgroundColor: colors.background, borderColor: colors.gray200 }]} 
                        onPress={() => setShowCourtModal(true)}
                    >
                        <Text style={[inputStyles.dropdownText, { color: court ? colors.textPrimary : colors.textSecondary }]}>
                            {court || 'Select Court'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Date Selection */}
                    <Text style={textStyles.label}>Date *</Text>
                    <TouchableOpacity 
                        style={[inputStyles.dropdown, { backgroundColor: colors.background, borderColor: colors.gray200 }]} 
                        onPress={() => setShowDate(true)}
                    >
                        <Text style={[inputStyles.dropdownText, { color: colors.textPrimary }]}>
                            {date.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </Text>
                        <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {showDate && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            minimumDate={new Date()}
                            onChange={(event, selectedDate) => {
                                setShowDate(false);
                                if (selectedDate) {
                                    setDate(selectedDate);
                                }
                            }}
                        />
                    )}

                    {/* Time Selection */}
                    <Text style={textStyles.label}>Time *</Text>
                    <TouchableOpacity 
                        style={[inputStyles.dropdown, { backgroundColor: colors.background, borderColor: colors.gray200 }]} 
                        onPress={() => setShowTimeModal(true)}
                    >
                        <Text style={[inputStyles.dropdownText, { color: time ? colors.textPrimary : colors.textSecondary }]}>
                            {time || 'Select Time'}
                        </Text>
                        <Ionicons name="time" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Duration Selection */}
                    <Text style={textStyles.label}>Duration *</Text>
                    <TouchableOpacity 
                        style={[inputStyles.dropdown, { backgroundColor: colors.background, borderColor: colors.gray200 }]} 
                        onPress={() => setShowDurationModal(true)}
                    >
                        <Text style={[inputStyles.dropdownText, { color: duration ? colors.textPrimary : colors.textSecondary }]}>
                            {duration || 'Select Duration'}
                        </Text>
                        <Ionicons name="hourglass" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Booking Type */}
                    <Text style={textStyles.label}>Booking Type *</Text>
                    <View style={chipStyles.row}>
                        <TouchableOpacity
                            style={[
                                chipStyles.base,
                                bookingType === 'Open Game' ? 
                                { backgroundColor: colors.primary, borderColor: colors.primary } : 
                                { backgroundColor: colors.background, borderColor: colors.gray200 }
                            ]}
                            onPress={() => setBookingType('Open Game')}
                        >
                            <Text style={[
                                chipStyles.text,
                                { color: bookingType === 'Open Game' ? colors.background : colors.textSecondary }
                            ]}>
                                Open Game
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                chipStyles.base,
                                bookingType === 'Private Game' ? 
                                { backgroundColor: colors.primary, borderColor: colors.primary } : 
                                { backgroundColor: colors.background, borderColor: colors.gray200 }
                            ]}
                            onPress={() => setBookingType('Private Game')}
                        >
                            <Text style={[
                                chipStyles.text,
                                { color: bookingType === 'Private Game' ? colors.background : colors.textSecondary }
                            ]}>
                                Private Game
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Open Game Options */}
                    {bookingType === 'Open Game' && (
                        <>
                            <Text style={textStyles.label}>Skill Level *</Text>
                            <TouchableOpacity 
                                style={[inputStyles.dropdown, { backgroundColor: colors.background, borderColor: colors.gray200 }]} 
                                onPress={() => setShowSkillModal(true)}
                            >
                                <Text style={[inputStyles.dropdownText, { color: skillLevel ? colors.textPrimary : colors.textSecondary }]}>
                                    {skillLevel || 'Select Skill Level'}
                                </Text>
                                <Ionicons name="trophy" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <Text style={textStyles.label}>Players Needed *</Text>
                            <TouchableOpacity 
                                style={[inputStyles.dropdown, { backgroundColor: colors.background, borderColor: colors.gray200 }]} 
                                onPress={() => setShowPlayersModal(true)}
                            >
                                <Text style={[inputStyles.dropdownText, { color: players ? colors.textPrimary : colors.textSecondary }]}>
                                    {players ? `${players} players` : 'Select Players Needed'}
                                </Text>
                                <Ionicons name="people" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Price Summary */}
                    {duration && (
                        <View style={[cardStyles.base, { backgroundColor: colors.gray50, borderColor: colors.gray200, borderWidth: 1 }]}>
                            <Text style={[textStyles.summaryTitle, { color: colors.textPrimary }]}>Booking Summary</Text>
                            <View style={summaryStyles.row}>
                                <Text style={[textStyles.summaryLabel, { color: colors.textSecondary }]}>Court:</Text>
                                <Text style={[textStyles.summaryValue, { color: colors.textPrimary }]}>{court || 'Not selected'}</Text>
                            </View>
                            <View style={summaryStyles.row}>
                                <Text style={[textStyles.summaryLabel, { color: colors.textSecondary }]}>Duration:</Text>
                                <Text style={[textStyles.summaryValue, { color: colors.textPrimary }]}>{duration}</Text>
                            </View>
                            <View style={summaryStyles.row}>
                                <Text style={[textStyles.summaryLabel, { color: colors.textSecondary }]}>Base Price:</Text>
                                <Text style={[textStyles.summaryValue, { color: colors.textPrimary }]}>₹{venuePrice}/hour</Text>
                            </View>
                            <View style={[summaryStyles.row, summaryStyles.priceRow]}>
                                <Text style={[textStyles.priceLabel, { color: colors.textPrimary }]}>Total Amount:</Text>
                                <Text style={[textStyles.priceValue, { color: colors.primary }]}>₹{calculatePrice()}</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Book Button */}
                <View style={[layoutStyles.footer, { backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={[
                            buttonStyles.primary,
                            { backgroundColor: (isFormValid && !isSubmitting) ? colors.primary : colors.gray300 }
                        ]}
                        onPress={handleBooking}
                        disabled={!isFormValid || isSubmitting}
                    >
                        <Text style={[buttonStyles.primaryText, { color: colors.background }]}>
                            {isSubmitting ? 'Processing...' : `Request Booking - ₹${calculatePrice()}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Modals */}
                <CustomDropdown
                    title="Select Court"
                    value={court}
                    placeholder="Select Court"
                    options={courts}
                    onSelect={handleCourtSelection}
                    visible={showCourtModal}
                    onClose={() => setShowCourtModal(false)}
                />

                <CustomDropdown
                    title="Select Time"
                    value={time}
                    placeholder="Select Time"
                    options={times}
                    onSelect={setTime}
                    visible={showTimeModal}
                    onClose={() => setShowTimeModal(false)}
                    isTimeDropdown={true}
                />

                <CustomDropdown
                    title="Select Duration"
                    value={duration}
                    placeholder="Select Duration"
                    options={durations}
                    onSelect={setDuration}
                    visible={showDurationModal}
                    onClose={() => setShowDurationModal(false)}
                />

                <CustomDropdown
                    title="Select Skill Level"
                    value={skillLevel}
                    placeholder="Select Skill Level"
                    options={skillLevels}
                    onSelect={setSkillLevel}
                    visible={showSkillModal}
                    onClose={() => setShowSkillModal(false)}
                />

                <CustomDropdown
                    title="Players Needed"
                    value={players}
                    placeholder="Select Players Needed"
                    options={playersRequired}
                    onSelect={setPlayers}
                    visible={showPlayersModal}
                    onClose={() => setShowPlayersModal(false)}
                />
            </View>
        </>
    );
}