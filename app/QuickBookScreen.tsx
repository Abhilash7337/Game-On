import React, { useState, useEffect } from 'react';
import { useNavigation } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
// 1. Import the useSafeAreaInsets hook
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY_GREEN = '#047857';
const MUTED_GREEN = '#6EE7B7';
const COMPONENT_GRAY = '#F3F4F6';


function QuickBookScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [venues, setVenues] = useState<string[]>([]);
    const [courts, setCourts] = useState<string[]>([]);
    const [times, setTimes] = useState<string[]>([]);
    const [durations, setDurations] = useState<string[]>([]);
    const [skillLevels, setSkillLevels] = useState<string[]>([]);
    const [playersRequired, setPlayersRequired] = useState<string[]>([]);
    const [venue, setVenue] = useState();
    const [court, setCourt] = useState();
    const [date, setDate] = useState(new Date());
    const [showDate, setShowDate] = useState(false);
    const [time, setTime] = useState();
    const [duration, setDuration] = useState();
    const [bookingType, setBookingType] = useState<'Open Game' | 'Private Game' | undefined>();
    const [skillLevel, setSkillLevel] = useState();
    const [players, setPlayers] = useState();

    useEffect(() => {
        setVenues(['Mahindra Court', 'Venue B', 'Venue C']);
        setCourts(['Court 1', 'Court 2', 'Court 3']);
        setTimes(['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM']);
        setDurations(['30 min', '1 hr', '1.5 hr']);
        setSkillLevels(['Beginner', 'Intermediate', 'Advanced']);
        setPlayersRequired(['2', '4', '6', '8']);
    }, []);

    const isFormValid =
        !!venue &&
        !!court &&
        !!date &&
        !!time &&
        !!duration &&
        !!bookingType &&
        (bookingType === 'Private Game' || (!!skillLevel && !!players));

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <StatusBar style="light" />

                {/* 3. Apply the dynamic padding directly to the header component */}
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
                            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>{'←'}</Text>
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Book a Court</Text>
                            <Text style={styles.headerSubtitle}>Schedule your next game</Text>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 200 }}>
                    {/* Venue Selection */}
                    <View style={styles.card}>
                        <Text style={styles.label}>Select Venue</Text>
                        <Picker
                            selectedValue={venue}
                            onValueChange={setVenue}
                            style={styles.picker}
                            prompt="Choose a venue..."
                        >
                            {/* Removed placeholder option */}
                            {venues.map((v: string) => <Picker.Item key={v} label={v} value={v} />)}
                        </Picker>
                    </View>

                    {/* Court Selection */}
                    {venue && (
                        <View style={styles.card}>
                            <Text style={styles.label}>Select Court</Text>
                            <Picker
                                selectedValue={court}
                                onValueChange={setCourt}
                                style={styles.picker}
                                prompt="Choose a court..."
                            >
                                {/* Removed placeholder option */}
                                {courts.map((c: string) => <Picker.Item key={c} label={c} value={c} />)}
                            </Picker>
                        </View>
                    )}

                    {/* Date & Time */}
                    {court && (
                        <View style={styles.card}>
                            <Text style={styles.label}>Date & Time</Text>
                            <TouchableOpacity onPress={() => setShowDate(true)} style={styles.dateBtn}>
                                <Text style={{ color: '#111' }}>{date.toDateString()}</Text>
                            </TouchableOpacity>
                            {showDate && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    onChange={(e, d) => {
                                        setShowDate(false);
                                        if (d) setDate(d);
                                    }}
                                />
                            )}
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Picker
                                        selectedValue={time}
                                        onValueChange={setTime}
                                        style={styles.picker}
                                        prompt="Select Time"
                                    >
                                        {/* Removed placeholder option */}
                                        {times.map((t: string) => <Picker.Item key={t} label={t} value={t} />)}
                                    </Picker>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Picker
                                        selectedValue={duration}
                                        onValueChange={setDuration}
                                        style={styles.picker}
                                        prompt="Select Duration"
                                    >
                                        {/* Removed placeholder option */}
                                        {durations.map((d: string) => <Picker.Item key={d} label={d} value={d} />)}
                                    </Picker>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Booking Details */}
                    {court && (
                        <View style={styles.card}>
                            <Text style={styles.label}>Booking Type</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}>
                                <TouchableOpacity
                                    style={[styles.chip, bookingType === 'Open Game' && styles.chipSelected]}
                                    onPress={() => setBookingType('Open Game')}
                                >
                                    <Text style={{ color: bookingType === 'Open Game' ? PRIMARY_GREEN : '#111' }}>
                                        Open Game
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.chip, bookingType === 'Private Game' && styles.chipSelected]}
                                    onPress={() => setBookingType('Private Game')}
                                >
                                    <Text style={{ color: bookingType === 'Private Game' ? PRIMARY_GREEN : '#111' }}>
                                        Private Game
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Conditional Inputs */}
                            {bookingType === 'Open Game' && (
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <Picker
                                            selectedValue={skillLevel}
                                            onValueChange={setSkillLevel}
                                            style={styles.picker}
                                            prompt="Choose skill level"
                                        >
                                            {/* Removed placeholder option */}
                                            {skillLevels.map((s: string) => <Picker.Item key={s} label={s} value={s} />)}
                                        </Picker>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Picker
                                            selectedValue={players}
                                            onValueChange={setPlayers}
                                            style={styles.picker}
                                            prompt="Select a number"
                                        >
                                            {/* Removed placeholder option */}
                                            {playersRequired.map((p: string) => <Picker.Item key={p} label={p} value={p} />)}
                                        </Picker>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Booking Summary */}
                    {isFormValid && (
                        <View style={[styles.card, { marginTop: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1fae5' }]}> 
                            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#047857' }}>Booking Summary</Text>
                            <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Venue:</Text> {venue}</Text>
                            <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Court:</Text> {court}</Text>
                            <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Date:</Text> {date.toDateString()}</Text>
                            <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Time:</Text> {time}</Text>
                            <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Duration:</Text> {duration}</Text>
                            <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Booking Type:</Text> {bookingType}</Text>
                            {bookingType === 'Open Game' && (
                                <>
                                    <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Skill Level:</Text> {skillLevel}</Text>
                                    <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Players Required:</Text> {players}</Text>
                                </>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: isFormValid ? '#007926' : '#d1fae5' }]}
                        disabled={!isFormValid}
                        onPress={() => { }}
                    >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Confirm Booking</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
}

export default QuickBookScreen;

const styles = StyleSheet.create({
    header: {
        backgroundColor: PRIMARY_GREEN,
        // 4. The old paddingTop is removed from here. It is now handled dynamically.
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
        marginBottom: 8,
    },
    picker: {
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    dateBtn: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    chip: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    chipSelected: {
        borderColor: PRIMARY_GREEN,
        backgroundColor: '#d1fae5',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    confirmBtn: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
});