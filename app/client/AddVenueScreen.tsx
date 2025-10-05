import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Input } from '@/src/common/components/Input';
import { Venue } from '@/src/common/types';
import { ClientService } from '@/src/client/services/clientApi';
import {
  addVenueStyles,
  addVenueTextStyles
} from '@/styles/screens/AddVenueScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddVenueScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    amenities: [] as string[],
    basePrice: '',
    currency: 'INR',
    openTime: '06:00',
    closeTime: '23:00',
    operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as string[],
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>(formData.operatingDays);

  const availableAmenities = [
    'Parking', 'Cafeteria', 'Pro Shop', 'Locker Rooms', 'Lighting',
    'Air Conditioning', 'WiFi', 'First Aid', 'Water Facility', 'Seating'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.basePrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const venueData: Partial<Venue> = {
        name: formData.name,
        address: formData.address,
        description: formData.description,
        amenities: selectedAmenities,
        pricing: {
          basePrice: parseFloat(formData.basePrice),
          peakHourMultiplier: 1.4,
          currency: formData.currency
        },
        operatingHours: {
          open: formData.openTime,
          close: formData.closeTime,
          days: selectedDays
        },
        location: { latitude: 0, longitude: 0 }, // Will be set via location picker
        images: [],
        courts: [],
        ownerId: 'currentClient',
        rating: 0,
        isActive: true
      };

      const response = await ClientService.createVenue(venueData);
      
      if (response.success) {
        Alert.alert(
          'Success! 🎉',
          'Your venue has been added successfully and is pending approval.',
          [
            {
              text: 'View Dashboard',
              onPress: () => router.push('/client/dashboard')
            },
            {
              text: 'Add Another',
              onPress: () => {
                setFormData({
                  name: '',
                  address: '',
                  description: '',
                  amenities: [],
                  basePrice: '',
                  currency: 'INR',
                  openTime: '06:00',
                  closeTime: '23:00',
                  operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                });
                setSelectedAmenities([]);
                setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to create venue');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create venue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={addVenueStyles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Add Venue"
        subtitle="Create your sports facility"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </AppHeader>

      <ScrollView style={addVenueStyles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={addVenueStyles.section}>
          <Text style={addVenueStyles.sectionTitle}>Basic Information</Text>
          
          <View style={addVenueStyles.inputGroup}>
            <Text style={addVenueStyles.label}>Venue Name *</Text>
            <Input
              placeholder="Enter venue name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              style={addVenueStyles.input}
            />
          </View>

          <View style={addVenueStyles.inputGroup}>
            <Text style={addVenueStyles.label}>Address *</Text>
            <Input
              placeholder="Enter complete address"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              style={addVenueStyles.input}
              multiline
            />
          </View>

          <View style={addVenueStyles.inputGroup}>
            <Text style={addVenueStyles.label}>Description</Text>
            <Input
              placeholder="Describe your venue"
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              style={addVenueStyles.input}
              multiline
            />
          </View>
        </View>

        {/* Pricing */}
        <View style={addVenueStyles.section}>
          <Text style={addVenueStyles.sectionTitle}>Pricing</Text>
          
          <View style={addVenueStyles.inputRow}>
            <View style={addVenueStyles.inputGroup}>
              <Text style={addVenueStyles.label}>Base Price (₹) *</Text>
              <Input
                placeholder="0"
                value={formData.basePrice}
                onChangeText={(value) => handleInputChange('basePrice', value)}
                keyboardType="numeric"
                style={addVenueStyles.input}
              />
            </View>
          </View>
        </View>

        {/* Operating Hours */}
        <View style={addVenueStyles.section}>
          <Text style={addVenueStyles.sectionTitle}>Operating Hours</Text>
          
          <View style={addVenueStyles.inputRow}>
            <View style={addVenueStyles.inputGroup}>
              <Text style={addVenueStyles.label}>Opening Time</Text>
              <Input
                placeholder="06:00"
                value={formData.openTime}
                onChangeText={(value) => handleInputChange('openTime', value)}
                style={addVenueStyles.input}
              />
            </View>
            <View style={addVenueStyles.inputGroup}>
              <Text style={addVenueStyles.label}>Closing Time</Text>
              <Input
                placeholder="23:00"
                value={formData.closeTime}
                onChangeText={(value) => handleInputChange('closeTime', value)}
                style={addVenueStyles.input}
              />
            </View>
          </View>

          <View style={addVenueStyles.inputGroup}>
            <Text style={addVenueStyles.label}>Operating Days</Text>
            <View style={addVenueStyles.chipContainer}>
              {daysOfWeek.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    addVenueStyles.chip,
                    selectedDays.includes(day) && addVenueStyles.chipSelected
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[
                    addVenueStyles.chipText,
                    selectedDays.includes(day) && addVenueStyles.chipTextSelected
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View style={addVenueStyles.section}>
          <Text style={addVenueStyles.sectionTitle}>Amenities</Text>
          <Text style={addVenueStyles.sectionSubtitle}>Select available amenities</Text>
          
          <View style={addVenueStyles.chipContainer}>
            {availableAmenities.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  addVenueStyles.chip,
                  selectedAmenities.includes(amenity) && addVenueStyles.chipSelected
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text style={[
                  addVenueStyles.chipText,
                  selectedAmenities.includes(amenity) && addVenueStyles.chipTextSelected
                ]}>
                  {amenity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={addVenueStyles.footer}>
        <Button
          title={loading ? "Creating..." : "Create Venue"}
          onPress={handleSubmit}
          disabled={loading}
          variant="primary"
          style={addVenueStyles.submitButton}
        />
      </View>
    </SafeAreaView>
  );
}
