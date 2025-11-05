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
    const preSelectedTime = params.timeSlot as string;
    
    const [courts, setCourts] = useState<string[]>([]);
    const [times, setTimes] = useState<string[]>([]);
    const [durations, setDurations] = useState<string[]>([]);
    const [skillLevels, setSkillLevels] = useState<string[]>([]);
    const [playersRequired, setPlayersRequired] = useState<string[]>([]);
    const [timeSlotStatuses, setTimeSlotStatuses] = useState<{[key: string]: {status: string; spotsLeft: number}}>({});
    
    const [court, setCourt] = useState<string>(preSelectedCourt || '');
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [time, setTime] = useState<string>(preSelectedTime || '');
    const [duration, setDuration] = useState<string>('');
    const [bookingType, setBookingType] = useState<'Open Game' | 'Private Game' | ''>('');
    const [skillLevel, setSkillLevel] = useState<string>('');
    const [players, setPlayers] = useState<string>('');

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
        setPlayersRequired(['2', '4', '6', '8']);
    }, []);

    const loadVenueOperatingHours = async () => {
        try {
            const { VenueStorageService } = await import('@/src/common/services/venueStorage');
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
        // Mock data - In real app, fetch from database based on bookings
        const statuses: {[key: string]: {status: string; spotsLeft: number}} = {};
        const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];
        
        timeSlots.forEach(slot => {
            const random = Math.random();
            if (random > 0.8) {
                statuses[slot] = { status: 'booked', spotsLeft: 0 }; // Fully booked
            } else if (random > 0.6) {
                statuses[slot] = { status: 'available', spotsLeft: 4 }; // Available (green)
            } else if (random > 0.4) {
                statuses[slot] = { status: 'joining', spotsLeft: 2 }; // Available to join (orange)
            } else {
                statuses[slot] = { status: 'last-spot', spotsLeft: 1 }; // 1 spot left (red)
            }
        });
        
        setTimeSlotStatuses(statuses);
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
            const { VenueStorageService } = await import('@/src/common/services/venueStorage');
            const venues = await VenueStorageService.getAllVenues();
            const venue = venues.find(v => v.id === venueId);
            
            if (venue && venue.courts.length > 0) {
                setCourts(venue.courts.map(court => court.name));
            } else {
                // Default courts if none specified
                setCourts(['Court A1', 'Court A2', 'Court B1', 'Court B2']);
            }
        } catch (error) {
            console.error('Error loading venue courts:', error);
            setCourts(['Court A1', 'Court A2', 'Court B1', 'Court B2']);
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
        if (!isFormValid) {
            Alert.alert('Incomplete Form', 'Please fill all required fields.');
            return;
        }

        try {
            console.log('🎯 [BOOKING] Starting booking process...');
            
            // Get the actual authenticated user ID
            const { supabase } = await import('@/src/common/services/supabase');
            const { data: { user } } = await supabase.auth.getUser();
            
            console.log('👤 [BOOKING] Authenticated user:', user?.id);
            
            if (!user) {
                Alert.alert('Authentication Error', 'You must be logged in to make a booking.');
                return;
            }

            // Create booking request (pending approval)
            const { BookingStorageService } = await import('../src/common/services/bookingStorage');
            
            const bookingData = {
                userId: user.id, // Use actual user ID from Supabase auth
                venueId: venueId,
                venueName: venueName,
                ownerId: ownerId,
                court: court,
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

            console.log('📋 [BOOKING] Booking data:', JSON.stringify({
                userId: bookingData.userId,
                venueId: bookingData.venueId,
                venueName: bookingData.venueName,
                ownerId: bookingData.ownerId,
                court: bookingData.court,
                status: bookingData.status,
            }, null, 2));

            const booking = await BookingStorageService.createBooking(bookingData);
            
            console.log('✅ [BOOKING] Booking created:', booking.id);
            
            // Send notification to client
            const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
            await ClientNotificationService.sendBookingRequest(ownerId, booking);

            console.log('📧 [BOOKING] Notification sent to owner:', ownerId);

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

                <ScrollView style={layoutStyles.scrollContent} showsVerticalScrollIndicator={false}>
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
                            { backgroundColor: isFormValid ? colors.primary : colors.gray300 }
                        ]}
                        onPress={handleBooking}
                        disabled={!isFormValid}
                    >
                        <Text style={[buttonStyles.primaryText, { color: colors.background }]}>
                            Request Booking - ₹{calculatePrice()}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Modals */}
                <CustomDropdown
                    title="Select Court"
                    value={court}
                    placeholder="Select Court"
                    options={courts}
                    onSelect={setCourt}
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