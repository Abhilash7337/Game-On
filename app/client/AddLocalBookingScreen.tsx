import { supabase } from '@/src/common/services/supabase';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Venue {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  type: string;
}

export default function AddLocalBookingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  // Form state
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    loadVenues();
  }, []);

  useEffect(() => {
    if (selectedVenue) {
      loadCourts(selectedVenue);
    }
  }, [selectedVenue]);

  const loadVenues = async () => {
    try {
      setLoadingVenues(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        router.back();
        return;
      }

      const { data, error } = await supabase
        .from('venues')
        .select('id, name')
        .eq('client_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      setVenues(data || []);
      if (data && data.length > 0) {
        setSelectedVenue(data[0].id);
      }
    } catch (error) {
      console.error('Error loading venues:', error);
      Alert.alert('Error', 'Failed to load venues');
    } finally {
      setLoadingVenues(false);
    }
  };

  const loadCourts = async (venueId: string) => {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, type')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      if (error) throw error;

      setCourts(data || []);
      if (data && data.length > 0) {
        setSelectedCourt(data[0].id);
      } else {
        setSelectedCourt('');
      }
    } catch (error) {
      console.error('Error loading courts:', error);
      Alert.alert('Error', 'Failed to load courts');
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
      // Auto-set end time to 1 hour later
      const newEndTime = new Date(selectedTime);
      newEndTime.setHours(newEndTime.getHours() + 1);
      setEndTime(newEndTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const validateBooking = () => {
    if (!selectedVenue) {
      Alert.alert('Validation Error', 'Please select a venue');
      return false;
    }
    if (!selectedCourt) {
      Alert.alert('Validation Error', 'Please select a court');
      return false;
    }
    if (startTime >= endTime) {
      Alert.alert('Validation Error', 'End time must be after start time');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateBooking()) return;

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        return;
      }

      // Format time as HH:MM:SS
      const formatTimeForDB = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}:00`;
      };

      // Calculate duration in hours
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      const duration = `${durationHours} ${durationHours === 1 ? 'hour' : 'hours'}`;

      // Get court details for pricing
      const court = courts.find(c => c.id === selectedCourt);
      
      // Create booking object - matching exact DB schema
      const bookingData = {
        user_id: user.id, // Using venue owner's ID as placeholder for local bookings
        venue_id: selectedVenue,
        court_id: selectedCourt,
        booking_date: selectedDate.toISOString().split('T')[0],
        start_time: formatTimeForDB(startTime),
        end_time: formatTimeForDB(endTime),
        duration: duration,
        booking_type: 'Walk-in', // Special type for local bookings
        status: 'confirmed', // Auto-confirm local bookings
        payment_status: 'paid', // Assume paid since it's offline
        total_amount: 0, // Will be calculated by DB trigger if needed
        player_count: 1,
        skill_level: null,
        notes: 'Local/Offline booking',
        time_slot_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (error) throw error;

      Alert.alert(
        'Success',
        'Local booking added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (loadingVenues) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading venues...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (venues.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Venues Found</Text>
          <Text style={styles.emptyText}>
            Please add a venue first before creating bookings
          </Text>
          <TouchableOpacity
            style={styles.addVenueButton}
            onPress={() => router.push('/add-venue')}
          >
            <Text style={styles.addVenueButtonText}>Add Venue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Local Booking</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Venue Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Venue</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedVenue}
              onValueChange={(value) => setSelectedVenue(value)}
              style={styles.picker}
            >
              {venues.map((venue) => (
                <Picker.Item key={venue.id} label={venue.name} value={venue.id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Court Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Court</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCourt}
              onValueChange={(value) => setSelectedCourt(value)}
              style={styles.picker}
              enabled={courts.length > 0}
            >
              {courts.length === 0 ? (
                <Picker.Item label="No courts available" value="" />
              ) : (
                courts.map((court) => (
                  <Picker.Item 
                    key={court.id} 
                    label={`${court.name} (${court.type})`} 
                    value={court.id} 
                  />
                ))
              )}
            </Picker>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.timeRow}>
          <View style={[styles.section, styles.timeSection]}>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default"
                onChange={handleStartTimeChange}
              />
            )}
          </View>

          <View style={[styles.section, styles.timeSection]}>
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={handleEndTimeChange}
              />
            )}
          </View>
        </View>

        {/* Duration Info */}
        <View style={styles.durationInfo}>
          <Ionicons name="hourglass-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.durationText}>
            Duration: {Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10} hours
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Add Booking</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addVenueButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addVenueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeSection: {
    flex: 1,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
  },
  durationText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 32,
  },
});
