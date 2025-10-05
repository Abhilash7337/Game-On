import AppHeader from '@/src/common/components/AppHeader';
import {
    buttonStyles,
    cardStyles,
    chipStyles,
    inputStyles,
    layoutStyles,
    modalStyles,
    summaryStyles,
    textStyles
} from '@/styles/screens/QuickBookScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
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
    
    const [courts, setCourts] = useState<string[]>([]);
    const [times, setTimes] = useState<string[]>([]);
    const [durations, setDurations] = useState<string[]>([]);
    const [skillLevels, setSkillLevels] = useState<string[]>([]);
    const [playersRequired, setPlayersRequired] = useState<string[]>([]);
    
    const [court, setCourt] = useState<string>('');
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [time, setTime] = useState<string>('');
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
        setTimes(['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']);
        setDurations(['30 min', '1 hr', '1.5 hr', '2 hr']);
        setSkillLevels(['Beginner', 'Intermediate', 'Advanced']);
        setPlayersRequired(['2', '4', '6', '8']);
    }, []);

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

    // Custom Dropdown Component
    const CustomDropdown = ({ 
        title, 
        value, 
        placeholder, 
        options, 
        onSelect, 
        visible, 
        onClose 
    }: {
        title: string;
        value: string;
        placeholder: string;
        options: string[];
        onSelect: (value: string) => void;
        visible: boolean;
        onClose: () => void;
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
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[modalStyles.option, { borderBottomColor: colors.gray200 }]}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text style={[modalStyles.optionText, { color: colors.textPrimary }]}>{item}</Text>
                                {value === item && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    const calculatePrice = () => {
        if (!duration) return venuePrice;
        
        const durationHours = duration === '30 min' ? 0.5 : 
                             duration === '1 hr' ? 1 : 
                             duration === '1.5 hr' ? 1.5 : 2;
        
        return Math.round(venuePrice * durationHours);
    };

    const handleBooking = async () => {
        if (!isFormValid) {
            Alert.alert('Incomplete Form', 'Please fill all required fields.');
            return;
        }

        try {
            // Create booking request (pending approval)
            const { BookingStorageService } = await import('../src/common/services/bookingStorage');
            
            const bookingData = {
                userId: 'current-user', // In real app, get from user session
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

            const booking = await BookingStorageService.createBooking(bookingData);
            
            // Send notification to client
            const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
            await ClientNotificationService.sendBookingRequest(ownerId, booking);

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
            console.error('Error creating booking:', error);
            Alert.alert('Error', 'Failed to create booking request. Please try again.');
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />
            
            <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
                <AppHeader 
                    title={`Book ${venueName}`}
                    subtitle="Fill in the details below"
                />

                <ScrollView style={layoutStyles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Venue Info Card */}
                    <View style={[cardStyles.base, { backgroundColor: colors.primary + '10' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Ionicons name="location" size={20} color={colors.primary} />
                            <Text style={[textStyles.label, { color: colors.primary, marginLeft: 8, marginBottom: 0 }]}>
                                {venueName}
                            </Text>
                        </View>
                        <Text style={[textStyles.subLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                            Base Price: ₹{venuePrice}/hour
                        </Text>
                    </View>

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