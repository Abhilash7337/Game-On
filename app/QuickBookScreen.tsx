import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Alert, Modal, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingStore } from '@/utils/bookingStore';

const PRIMARY_GREEN = '#047857';
const ORANGE_COLOR = '#EA580C';
const COMPONENT_GRAY = '#F3F4F6';
const TEXT_GRAY = '#6B7280';
const DARK_TEXT = '#111827';

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

    const handleConfirmBooking = () => {
        if (isFormValid) {
            // Save booking to store
            bookingStore.addBooking({
                venue,
                court,
                date,
                time,
                duration,
                bookingType: bookingType as 'Open Game' | 'Private Game',
                skillLevel: bookingType === 'Open Game' ? skillLevel : undefined,
                players: bookingType === 'Open Game' ? players : undefined,
                price: 500
            });

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
        }
    };

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
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={DARK_TEXT} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.modalOption,
                                    value === item && styles.modalOptionSelected
                                ]}
                                onPress={() => {
                                    onSelect(item);
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    styles.modalOptionText,
                                    value === item && styles.modalOptionTextSelected
                                ]}>
                                    {item}
                                </Text>
                                {value === item && (
                                    <Ionicons name="checkmark" size={20} color={PRIMARY_GREEN} />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="light" />
            
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Book a Court</Text>
                            <Text style={styles.headerSubtitle}>Schedule your next game</Text>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
                    {/* Venue Selection */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Select Venue</Text>
                        <TouchableOpacity 
                            style={styles.dropdownButton}
                            onPress={() => setShowVenueModal(true)}
                        >
                            <Text style={[
                                styles.dropdownText,
                                venue === '' && styles.dropdownPlaceholder
                            ]}>
                                {venue || 'Choose a venue...'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={TEXT_GRAY} />
                        </TouchableOpacity>
                    </View>

                    {/* Custom Dropdowns */}
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

                    {/* Court Selection */}
                    {venue !== '' && (
                        <View style={styles.card}>
                            <Text style={styles.label}>Select Court</Text>
                            <TouchableOpacity 
                                style={styles.dropdownButton}
                                onPress={() => setShowCourtModal(true)}
                            >
                                <Text style={[
                                    styles.dropdownText,
                                    court === '' && styles.dropdownPlaceholder
                                ]}>
                                    {court || 'Choose a court...'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color={TEXT_GRAY} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <CustomDropdown
                        title="Select Court"
                        value={court}
                        placeholder="Choose a court..."
                        options={courts}
                        onSelect={setCourt}
                        visible={showCourtModal}
                        onClose={() => setShowCourtModal(false)}
                    />

                    {/* Date & Time */}
                    {court !== '' && (
                        <View style={styles.card}>
                            <Text style={styles.label}>Date & Time</Text>
                            <TouchableOpacity 
                                onPress={() => setShowDate(true)} 
                                style={styles.dateBtn}
                            >
                                <Text style={styles.dateBtnText}>
                                    {date.toDateString()}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={TEXT_GRAY} />
                            </TouchableOpacity>
                            
                            {showDate && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    minimumDate={new Date()}
                                    onChange={(event, selectedDate) => {
                                        setShowDate(false);
                                        if (selectedDate) setDate(selectedDate);
                                    }}
                                />
                            )}
                            
                            <View style={styles.timeRow}>
                                <View style={styles.timePickerContainer}>
                                    <Text style={styles.subLabel}>Time</Text>
                                    <TouchableOpacity 
                                        style={styles.dropdownButton}
                                        onPress={() => setShowTimeModal(true)}
                                    >
                                        <Text style={[
                                            styles.dropdownText,
                                            time === '' && styles.dropdownPlaceholder
                                        ]}>
                                            {time || 'Select time'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={TEXT_GRAY} />
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.timePickerContainer}>
                                    <Text style={styles.subLabel}>Duration</Text>
                                    <TouchableOpacity 
                                        style={styles.dropdownButton}
                                        onPress={() => setShowDurationModal(true)}
                                    >
                                        <Text style={[
                                            styles.dropdownText,
                                            duration === '' && styles.dropdownPlaceholder
                                        ]}>
                                            {duration || 'Select duration'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={TEXT_GRAY} />
                                    </TouchableOpacity>
                                </View>
                            </View>

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
                        </View>
                    )}

                    {/* Booking Type */}
                    {time !== '' && duration !== '' && (
                        <View style={styles.card}>
                            <Text style={styles.label}>Booking Type</Text>
                            <View style={styles.chipRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        bookingType === 'Open Game' && styles.chipSelected
                                    ]}
                                    onPress={() => {
                                        setBookingType('Open Game');
                                        setSkillLevel('');
                                        setPlayers('');
                                    }}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        bookingType === 'Open Game' && styles.chipTextSelected
                                    ]}>
                                        Open Game
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        bookingType === 'Private Game' && styles.chipSelected
                                    ]}
                                    onPress={() => {
                                        setBookingType('Private Game');
                                        setSkillLevel('');
                                        setPlayers('');
                                    }}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        bookingType === 'Private Game' && styles.chipTextSelected
                                    ]}>
                                        Private Game
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Open Game Options */}
                            {bookingType === 'Open Game' && (
                                <View style={styles.gameOptionsContainer}>
                                    <View style={styles.gameOptionRow}>
                                        <View style={styles.gameOptionContainer}>
                                            <Text style={styles.subLabel}>Skill Level</Text>
                                            <TouchableOpacity 
                                                style={styles.dropdownButton}
                                                onPress={() => setShowSkillModal(true)}
                                            >
                                                <Text style={[
                                                    styles.dropdownText,
                                                    skillLevel === '' && styles.dropdownPlaceholder
                                                ]}>
                                                    {skillLevel || 'Choose level'}
                                                </Text>
                                                <Ionicons name="chevron-down" size={20} color={TEXT_GRAY} />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        <View style={styles.gameOptionContainer}>
                                            <Text style={styles.subLabel}>Players Needed</Text>
                                            <TouchableOpacity 
                                                style={styles.dropdownButton}
                                                onPress={() => setShowPlayersModal(true)}
                                            >
                                                <Text style={[
                                                    styles.dropdownText,
                                                    players === '' && styles.dropdownPlaceholder
                                                ]}>
                                                    {players || 'Select number'}
                                                </Text>
                                                <Ionicons name="chevron-down" size={20} color={TEXT_GRAY} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

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
                                </View>
                            )}
                        </View>
                    )}

                    {/* Booking Summary */}
                    {isFormValid && (
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Booking Summary</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Venue:</Text>
                                <Text style={styles.summaryValue}>{venue}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Court:</Text>
                                <Text style={styles.summaryValue}>{court}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Date:</Text>
                                <Text style={styles.summaryValue}>{date.toDateString()}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Time:</Text>
                                <Text style={styles.summaryValue}>{time}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Duration:</Text>
                                <Text style={styles.summaryValue}>{duration}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Type:</Text>
                                <Text style={styles.summaryValue}>{bookingType}</Text>
                            </View>
                            {bookingType === 'Open Game' && skillLevel && players && (
                                <>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Skill Level:</Text>
                                        <Text style={styles.summaryValue}>{skillLevel}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Players Needed:</Text>
                                        <Text style={styles.summaryValue}>{players}</Text>
                                    </View>
                                </>
                            )}
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Total Cost:</Text>
                                <Text style={styles.priceValue}>₹500</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.confirmBtn,
                            { backgroundColor: isFormValid ? PRIMARY_GREEN : '#D1D5DB' }
                        ]}
                        disabled={!isFormValid}
                        onPress={handleConfirmBooking}
                    >
                        <Text style={styles.confirmBtnText}>
                            {isFormValid ? 'Confirm Booking' : 'Complete Form to Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: PRIMARY_GREEN,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    headerSubtitle: {
        color: '#fff',
        fontSize: 14,
    },
    card: {
        backgroundColor: COMPONENT_GRAY,
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    label: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 12,
        color: DARK_TEXT,
    },
    subLabel: {
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 8,
        color: DARK_TEXT,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    picker: {
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    dropdownButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dropdownText: {
        color: DARK_TEXT,
        fontSize: 16,
        fontWeight: '500',
    },
    dropdownPlaceholder: {
        color: TEXT_GRAY,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '85%',
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: DARK_TEXT,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalOptionSelected: {
        backgroundColor: '#D1FAE5',
    },
    modalOptionText: {
        fontSize: 16,
        color: DARK_TEXT,
    },
    modalOptionTextSelected: {
        color: PRIMARY_GREEN,
        fontWeight: '600',
    },
    dateBtn: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dateBtnText: {
        color: DARK_TEXT,
        fontSize: 16,
        fontWeight: '500',
    },
    timeRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    timePickerContainer: {
        flex: 1,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 16,
    },
    chip: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        flex: 1,
        alignItems: 'center',
    },
    chipSelected: {
        borderColor: PRIMARY_GREEN,
        backgroundColor: '#D1FAE5',
    },
    chipText: {
        color: DARK_TEXT,
        fontWeight: '600',
        fontSize: 14,
    },
    chipTextSelected: {
        color: PRIMARY_GREEN,
    },
    gameOptionsContainer: {
        marginTop: 16,
    },
    gameOptionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    gameOptionContainer: {
        flex: 1,
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#D1FAE5',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    summaryTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 12,
        color: PRIMARY_GREEN,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        color: TEXT_GRAY,
        fontSize: 14,
        fontWeight: '500',
    },
    summaryValue: {
        color: DARK_TEXT,
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'right',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    priceLabel: {
        color: DARK_TEXT,
        fontSize: 16,
        fontWeight: 'bold',
    },
    priceValue: {
        color: ORANGE_COLOR,
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    confirmBtn: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});