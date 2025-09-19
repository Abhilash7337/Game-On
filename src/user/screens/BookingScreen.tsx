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
import { bookingStore } from '@/utils/bookingStore';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuickBookScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [venues, setVenues] = useState<string[]>([]);
    const [courts, setCourts] = useState<string[]>([]);
    const [times, setTimes] = useState<string[]>([]);
    const [durations, setDurations] = useState<string[]>([]);
    const [skillLevels, setSkillLevels] = useState<string[]>([]);
    const [playersRequired, setPlayersRequired] = useState<string[]>([]);
    
    const [venue, setVenue] = useState<string>('');
    const [court, setCourt] = useState<string>('');
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [time, setTime] = useState<string>('');
    const [duration, setDuration] = useState<string>('');
    const [bookingType, setBookingType] = useState<'Open Game' | 'Private Game' | ''>('');
    const [skillLevel, setSkillLevel] = useState<string>('');
    const [players, setPlayers] = useState<string>('');

    // Modal states for custom dropdowns
    const [showVenueModal, setShowVenueModal] = useState(false);
    const [showCourtModal, setShowCourtModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [showSkillModal, setShowSkillModal] = useState(false);
    const [showPlayersModal, setShowPlayersModal] = useState(false);

    useEffect(() => {
        setVenues(['Mahindra Court', 'Sports Complex A', 'Elite Sports Club', 'Champion Courts']);
        setCourts(['Court A1', 'Court A2', 'Court B1', 'Court B2']);
        setTimes(['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']);
        setDurations(['30 min', '1 hr', '1.5 hr', '2 hr']);
        setSkillLevels(['Beginner', 'Intermediate', 'Advanced']);
        setPlayersRequired(['2', '4', '6', '8']);
    }, []);

    const isFormValid =
        venue !== '' &&
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
                                style={[
                                    modalStyles.option,
                                    value === item && { backgroundColor: colors.primary + '20' }
                                ]}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    modalStyles.optionText,
                                    { color: colors.textPrimary },
                                    value === item && { color: colors.primary }
                                ]}>
                                    {item}
                                </Text>
                                {value === item && (
                                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    const handleBooking = () => {
        const newBooking = {
            venue,
            court,
            date,
            time,
            duration,
            bookingType: bookingType as 'Open Game' | 'Private Game',
            price: 500,
            ...(bookingType === 'Open Game' && { 
                skillLevel, 
                players 
            })
        };
        
        bookingStore.addBooking(newBooking);
        
        Alert.alert(
            'Booking Confirmed! 🎉',
            `Your booking at ${venue} - ${court} on ${date.toDateString()} at ${time} for ${duration} has been confirmed.\n\nYou can view it in your upcoming games.`,
            [
                {
                    text: 'View Home',
                    onPress: () => router.push('/(tabs)')
                },
                {
                    text: 'Book Another',
                    onPress: () => {
                        // Reset form
                        setVenue('');
                        setCourt('');
                        setDate(new Date());
                        setTime('');
                        setDuration('');
                        setBookingType('');
                        setSkillLevel('');
                        setPlayers('');
                    }
                }
            ]
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />
            
            <View style={[layoutStyles.container, { backgroundColor: colors.backgroundSecondary }]}>
                <AppHeader 
                    title="Book a Court" 
                    subtitle="Schedule your next game"
                    backgroundColor={colors.primary}
                >
                    <TouchableOpacity onPress={() => router.back()} style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
                    </TouchableOpacity>
                </AppHeader>

                <ScrollView 
                    style={{ flex: 1 }}
                    contentContainerStyle={layoutStyles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Venue Selection */}
                    <View style={cardStyles.flat}>
                        <Text style={textStyles.label}>
                            Select Venue
                        </Text>
                        <TouchableOpacity 
                            style={[inputStyles.dropdown, {
                                backgroundColor: colors.background,
                                borderColor: colors.gray200,
                                borderWidth: 1,
                            }]}
                            onPress={() => setShowVenueModal(true)}
                        >
                            <Text style={venue === '' ? 
                                [inputStyles.dropdownPlaceholder, { color: colors.textSecondary }] : 
                                [inputStyles.dropdownText, { color: colors.textPrimary }]
                            }>
                                {venue || 'Choose a venue...'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Court Selection - Only show when venue is selected */}
                    {venue !== '' && (
                        <View style={cardStyles.flat}>
                            <Text style={textStyles.label}>
                                Select Court
                            </Text>
                            <TouchableOpacity 
                                style={[inputStyles.dropdown, {
                                    backgroundColor: colors.background,
                                    borderColor: colors.gray200,
                                    borderWidth: 1,
                                }]}
                                onPress={() => setShowCourtModal(true)}
                            >
                                <Text style={court === '' ? 
                                    [inputStyles.dropdownPlaceholder, { color: colors.textSecondary }] : 
                                    [inputStyles.dropdownText, { color: colors.textPrimary }]
                                }>
                                    {court || 'Choose a court...'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Date & Time - Only show when court is selected */}
                    {court !== '' && (
                        <View style={cardStyles.flat}>
                            <Text style={textStyles.label}>
                                Date & Time
                            </Text>
                            
                            {/* Date Picker */}
                            <TouchableOpacity 
                                onPress={() => setShowDate(true)} 
                                style={[inputStyles.dateButton, {
                                    backgroundColor: colors.background,
                                    borderColor: colors.gray200,
                                    borderWidth: 1,
                                    borderRadius: 12,
                                }]}
                            >
                                <Text style={[inputStyles.dateButtonText, { color: colors.textPrimary }]}>
                                    {date.toDateString()}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            
                            {/* Date Picker Modal */}
                            {showDate && (
                                <Modal visible={showDate} transparent animationType="slide">
                                    <View style={modalStyles.overlay}>
                                        <View style={[modalStyles.content, { backgroundColor: colors.background }]}>
                                            <View style={[modalStyles.header, { borderBottomColor: colors.gray200 }]}>
                                                <Text style={[modalStyles.title, { color: colors.textPrimary }]}>Select Date</Text>
                                                <TouchableOpacity 
                                                    onPress={() => setShowDate(false)}
                                                    style={{
                                                        backgroundColor: colors.primary,
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 8,
                                                        borderRadius: 20,
                                                    }}
                                                >
                                                    <Text style={{ color: colors.textInverse, fontWeight: '600' }}>Done</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <DateTimePicker
                                                value={date}
                                                mode="date"
                                                display="spinner"
                                                minimumDate={new Date()}
                                                onChange={(event, selectedDate) => {
                                                    if (selectedDate) setDate(selectedDate);
                                                }}
                                                style={{ backgroundColor: colors.background }}
                                                textColor={colors.textPrimary}
                                            />
                                        </View>
                                    </View>
                                </Modal>
                            )}
                            
                            {/* Time and Duration Row */}
                            <View style={layoutStyles.timeRow}>
                                <View style={layoutStyles.timePickerContainer}>
                                    <Text style={textStyles.subLabel}>
                                        Time
                                    </Text>
                                    <TouchableOpacity 
                                        style={[inputStyles.dropdown, {
                                            backgroundColor: colors.background,
                                            borderColor: colors.gray200,
                                            borderWidth: 1,
                                        }]}
                                        onPress={() => setShowTimeModal(true)}
                                    >
                                        <Text style={time === '' ? 
                                            [inputStyles.dropdownPlaceholder, { color: colors.textSecondary }] : 
                                            [inputStyles.dropdownText, { color: colors.textPrimary }]
                                        }>
                                            {time || 'Select time'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={layoutStyles.timePickerContainer}>
                                    <Text style={textStyles.subLabel}>
                                        Duration
                                    </Text>
                                    <TouchableOpacity 
                                        style={[inputStyles.dropdown, {
                                            backgroundColor: colors.background,
                                            borderColor: colors.gray200,
                                            borderWidth: 1,
                                        }]}
                                        onPress={() => setShowDurationModal(true)}
                                    >
                                        <Text style={duration === '' ? 
                                            [inputStyles.dropdownPlaceholder, { color: colors.textSecondary }] : 
                                            [inputStyles.dropdownText, { color: colors.textPrimary }]
                                        }>
                                            {duration || 'Select duration'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Booking Type - Only show when time and duration are selected */}
                    {time !== '' && duration !== '' && (
                        <View style={cardStyles.flat}>
                            <Text style={textStyles.label}>
                                Booking Type
                            </Text>
                            
                            <View style={chipStyles.row}>
                                <TouchableOpacity
                                    style={[chipStyles.base, bookingType === 'Open Game' && chipStyles.selected]}
                                    onPress={() => {
                                        setBookingType('Open Game');
                                        setSkillLevel('');
                                        setPlayers('');
                                    }}
                                >
                                    <Text style={[chipStyles.text, bookingType === 'Open Game' && chipStyles.textSelected]}>
                                        Open Game
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[chipStyles.base, bookingType === 'Private Game' && chipStyles.selected]}
                                    onPress={() => {
                                        setBookingType('Private Game');
                                        setSkillLevel('');
                                        setPlayers('');
                                    }}
                                >
                                    <Text style={[chipStyles.text, bookingType === 'Private Game' && chipStyles.textSelected]}>
                                        Private Game
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Open Game Options */}
                            {bookingType === 'Open Game' && (
                                <View style={layoutStyles.gameOptionsContainer}>
                                    <View style={layoutStyles.gameOptionRow}>
                                        <View style={layoutStyles.gameOptionContainer}>
                                            <Text style={textStyles.subLabel}>
                                                Skill Level
                                            </Text>
                                            <TouchableOpacity 
                                                style={[inputStyles.dropdown, {
                                                    backgroundColor: colors.background,
                                                    borderColor: colors.gray200,
                                                    borderWidth: 1,
                                                }]}
                                                onPress={() => setShowSkillModal(true)}
                                            >
                                                <Text style={skillLevel === '' ? 
                                                    [inputStyles.dropdownPlaceholder, { color: colors.textSecondary }] : 
                                                    [inputStyles.dropdownText, { color: colors.textPrimary }]
                                                }>
                                                    {skillLevel || 'Choose level'}
                                                </Text>
                                                <Ionicons name="chevron-down" size={20} color={colors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={layoutStyles.gameOptionContainer}>
                                            <Text style={textStyles.subLabel}>
                                                Players Needed
                                            </Text>
                                            <TouchableOpacity 
                                                style={[inputStyles.dropdown, {
                                                    backgroundColor: colors.background,
                                                    borderColor: colors.gray200,
                                                    borderWidth: 1,
                                                }]}
                                                onPress={() => setShowPlayersModal(true)}
                                            >
                                                <Text style={players === '' ? 
                                                    [inputStyles.dropdownPlaceholder, { color: colors.textSecondary }] : 
                                                    [inputStyles.dropdownText, { color: colors.textPrimary }]
                                                }>
                                                    {players || 'Select number'}
                                                </Text>
                                                <Ionicons name="chevron-down" size={20} color={colors.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Booking Summary - Only show when form is valid */}
                    {isFormValid && (
                        <View style={cardStyles.summary}>
                            <Text style={textStyles.summaryTitle}>
                                Booking Summary
                            </Text>
                            <View>
                                <View style={summaryStyles.row}>
                                    <Text style={textStyles.summaryLabel}>Venue:</Text>
                                    <Text style={textStyles.summaryValue}>{venue}</Text>
                                </View>
                                <View style={summaryStyles.row}>
                                    <Text style={textStyles.summaryLabel}>Court:</Text>
                                    <Text style={textStyles.summaryValue}>{court}</Text>
                                </View>
                                <View style={summaryStyles.row}>
                                    <Text style={textStyles.summaryLabel}>Date:</Text>
                                    <Text style={textStyles.summaryValue}>{date.toDateString()}</Text>
                                </View>
                                <View style={summaryStyles.row}>
                                    <Text style={textStyles.summaryLabel}>Time:</Text>
                                    <Text style={textStyles.summaryValue}>{time}</Text>
                                </View>
                                <View style={summaryStyles.row}>
                                    <Text style={textStyles.summaryLabel}>Duration:</Text>
                                    <Text style={textStyles.summaryValue}>{duration}</Text>
                                </View>
                                <View style={summaryStyles.row}>
                                    <Text style={textStyles.summaryLabel}>Type:</Text>
                                    <Text style={textStyles.summaryValue}>{bookingType}</Text>
                                </View>
                                {bookingType === 'Open Game' && skillLevel && players && (
                                    <>
                                        <View style={summaryStyles.row}>
                                            <Text style={textStyles.summaryLabel}>Skill Level:</Text>
                                            <Text style={textStyles.summaryValue}>{skillLevel}</Text>
                                        </View>
                                        <View style={summaryStyles.row}>
                                            <Text style={textStyles.summaryLabel}>Players Needed:</Text>
                                            <Text style={textStyles.summaryValue}>{players}</Text>
                                        </View>
                                    </>
                                )}
                                <View style={summaryStyles.priceRow}>
                                    <Text style={textStyles.priceLabel}>Total Cost:</Text>
                                    <Text style={textStyles.priceValue}>₹500</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* All Custom Dropdowns */}
                <CustomDropdown
                    title="Select Venue"
                    value={venue}
                    placeholder="Choose a venue..."
                    options={venues}
                    onSelect={(value) => {
                        setVenue(value);
                        setCourt(''); // Reset court when venue changes
                    }}
                    visible={showVenueModal}
                    onClose={() => setShowVenueModal(false)}
                />

                <CustomDropdown
                    title="Select Court"
                    value={court}
                    placeholder="Choose a court..."
                    options={courts}
                    onSelect={setCourt}
                    visible={showCourtModal}
                    onClose={() => setShowCourtModal(false)}
                />

                <CustomDropdown
                    title="Select Time"
                    value={time}
                    placeholder="Select time"
                    options={times}
                    onSelect={setTime}
                    visible={showTimeModal}
                    onClose={() => setShowTimeModal(false)}
                />

                <CustomDropdown
                    title="Select Duration"
                    value={duration}
                    placeholder="Select duration"
                    options={durations}
                    onSelect={setDuration}
                    visible={showDurationModal}
                    onClose={() => setShowDurationModal(false)}
                />

                <CustomDropdown
                    title="Select Skill Level"
                    value={skillLevel}
                    placeholder="Choose level"
                    options={skillLevels}
                    onSelect={setSkillLevel}
                    visible={showSkillModal}
                    onClose={() => setShowSkillModal(false)}
                />

                <CustomDropdown
                    title="Select Players Needed"
                    value={players}
                    placeholder="Select number"
                    options={playersRequired}
                    onSelect={setPlayers}
                    visible={showPlayersModal}
                    onClose={() => setShowPlayersModal(false)}
                />

                {/* Footer Button */}
                <View style={layoutStyles.footer}>
                    <TouchableOpacity
                        style={[buttonStyles.primary, !isFormValid && buttonStyles.disabled]}
                        disabled={!isFormValid}
                        onPress={handleBooking}
                    >
                        <Text style={[buttonStyles.primaryText, !isFormValid && buttonStyles.disabledText]}>
                            Confirm Booking
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}