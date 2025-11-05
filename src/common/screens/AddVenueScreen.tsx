import { Button } from '@/src/common/components/Button';
import { Input } from '@/src/common/components/Input';
import { LocationPicker } from '@/src/common/components/LocationPicker';
import { CourtType } from '@/src/common/types';
import { addVenueScreenStyles } from '@/styles/screens/AddVenueScreen';
import { colors, spacing } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const styles = addVenueScreenStyles;

interface Court {
  id: string;
  name: string;
  type: CourtType;
  isActive: boolean;
}

interface VenueFormData {
  name: string;
  address: string;
  location: { latitude: number; longitude: number };
  description: string;
  basePrice: string;
  peakHourMultiplier: string;
  openTime: string;
  closeTime: string;
  operatingDays: string[];
  amenities: string[];
  images: string[];
  courts: Court[];
}

const COURT_TYPES: { label: string; value: CourtType }[] = [
  { label: 'Badminton', value: 'badminton' },
  { label: 'Tennis', value: 'tennis' },
  { label: 'Squash', value: 'squash' },
  { label: 'Basketball', value: 'basketball' },
];

const COMMON_AMENITIES = [
  'Parking', 'Locker Rooms', 'Cafeteria', 'Pro Shop', 'Air Conditioning',
  'WiFi', 'Shower Facilities', 'Equipment Rental', 'First Aid', 'Lighting'
];

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'Mon' },
  { label: 'Tuesday', value: 'Tue' },
  { label: 'Wednesday', value: 'Wed' },
  { label: 'Thursday', value: 'Thu' },
  { label: 'Friday', value: 'Fri' },
  { label: 'Saturday', value: 'Sat' },
  { label: 'Sunday', value: 'Sun' },
];

export default function AddVenueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [editingCourtType, setEditingCourtType] = useState<string | null>(null);
  const [customCourtType, setCustomCourtType] = useState('');
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    address: '',
    location: { latitude: 0, longitude: 0 },
    description: '',
    basePrice: '',
    peakHourMultiplier: '1.5',
    openTime: '06:00',
    closeTime: '22:00',
    operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    amenities: [],
    images: [],
    courts: [],
  });

  const handleInputChange = (field: keyof VenueFormData, value: string | string[] | Court[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImagePicker = async () => {
    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload venue images.');
        return;
      }

      // Show options for camera or gallery
      Alert.alert(
        'Select Image Source',
        'Choose how you want to add images',
        [
          {
            text: 'Camera',
            onPress: () => openCamera()
          },
          {
            text: 'Photo Library',
            onPress: () => openImageLibrary()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage].slice(0, 8) // Limit to 8 images
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset: ImagePicker.ImagePickerAsset) => asset.uri);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages].slice(0, 8) // Limit to 8 images
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images from library');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const toggleOperatingDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day]
    }));
  };

  const addCourt = () => {
    const newCourt: Court = {
      id: Date.now().toString(),
      name: `Court ${formData.courts.length + 1}`,
      type: 'badminton',
      isActive: true,
    };
    setFormData(prev => ({
      ...prev,
      courts: [...prev.courts, newCourt]
    }));
  };

  const updateCourt = (courtId: string, field: keyof Court, value: string | CourtType | boolean) => {
    setFormData(prev => ({
      ...prev,
      courts: prev.courts.map(court =>
        court.id === courtId ? { ...court, [field]: value } : court
      )
    }));
  };

  const removeCourt = (courtId: string) => {
    setFormData(prev => ({
      ...prev,
      courts: prev.courts.filter(court => court.id !== courtId)
    }));
  };

  const handleCustomCourtType = (courtId: string) => {
    if (customCourtType.trim()) {
      updateCourt(courtId, 'type', customCourtType.trim().toLowerCase().replace(/\s+/g, '') as CourtType);
      setEditingCourtType(null);
      setCustomCourtType('');
    }
  };

  const cancelCustomCourtType = () => {
    setEditingCourtType(null);
    setCustomCourtType('');
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        const hasBasicInfo = formData.name.trim() && formData.address.trim() && formData.description.trim();
        const hasLocation = formData.location.latitude !== 0 && formData.location.longitude !== 0;
        return hasBasicInfo && hasLocation;
      case 2:
        return formData.basePrice && parseFloat(formData.basePrice) > 0;
      case 3:
        return formData.courts.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      Alert.alert('Incomplete Information', 'Please fill in all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      Alert.alert('Incomplete Information', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const { VenueStorageService } = await import('@/src/common/services/venueStorage');
      const { ClientSessionManager } = await import('@/src/client/services/clientSession');
      
      // Get current client ID
      const clientId = ClientSessionManager.getCurrentClientId() || 'current-client';
      
      // Create the venue object
      const venueData = {
        name: formData.name,
        address: formData.address,
        location: { latitude: 0, longitude: 0 }, // Will be geocoded later
        description: formData.description,
        amenities: formData.amenities,
        images: formData.images,
        pricing: {
          basePrice: parseFloat(formData.basePrice),
          peakHourMultiplier: parseFloat(formData.peakHourMultiplier),
          currency: 'INR'
        },
        operatingHours: {
          open: formData.openTime,
          close: formData.closeTime,
          days: formData.operatingDays
        },
        courts: formData.courts.map(court => ({
          ...court,
          venueId: '', // Will be set by the service
        })),
        ownerId: clientId,
        rating: 0,
        isActive: true,
      };

      await VenueStorageService.addVenue(venueData);
      
      Alert.alert(
        'Success!', 
        'Your venue has been added successfully and is now live!',
        [
          {
            text: 'Continue',
            onPress: () => router.push('/client/dashboard')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create venue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      
      <View style={styles.fieldSpacing}>
        <Input
          label="Venue Name"
          placeholder="Enter venue name"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          leftIcon="business-outline"
          required
        />
      </View>

      <View style={styles.fieldSpacing}>
        <Input
          label="Address"
          placeholder="Enter complete address"
          value={formData.address}
          onChangeText={(value) => handleInputChange('address', value)}
          leftIcon="location-outline"
          multiline
          required
        />
      </View>

      <View style={styles.fieldSpacing}>
        <Text style={styles.sectionLabel}>Venue Location</Text>
        <Text style={styles.sectionSubtext}>Select your venue's exact location on the map</Text>
        <LocationPicker
          onLocationSelect={(location) => {
            setFormData(prev => ({
              ...prev,
              location: { latitude: location.latitude, longitude: location.longitude },
              address: location.address || prev.address,
            }));
          }}
          initialLocation={formData.location.latitude !== 0 ? formData.location : undefined}
          address={formData.address}
        />
      </View>

      <View style={styles.fieldSpacing}>
        <Input
          label="Description"
          placeholder="Describe your venue, facilities, and what makes it special"
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          leftIcon="document-text-outline"
          multiline
          numberOfLines={4}
          required
        />
      </View>

      {/* Image Upload Section */}
      <View style={styles.imageSection}>
        <Text style={styles.sectionLabel}>Venue Images</Text>
        <Text style={styles.sectionSubtext}>Add up to 8 high-quality images of your venue</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollContainer}>
          {formData.images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.venueImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          {formData.images.length < 8 && (
            <TouchableOpacity style={styles.addImageButton} onPress={handleImagePicker}>
              <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
              <Text style={styles.addImageText}>Add Photos</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pricing & Hours</Text>
      
      <View style={styles.pricingRow}>
        <View style={[styles.fieldSpacing, { flex: 1, marginRight: spacing.md }]}>
          <Input
            label="Base Price (₹/hour)"
            placeholder="100"
            value={formData.basePrice}
            onChangeText={(value) => handleInputChange('basePrice', value)}
            leftIcon="cash-outline"
            keyboardType="numeric"
            required
          />
        </View>
        
        <View style={[styles.fieldSpacing, { flex: 1 }]}>
          <Input
            label="Peak Hour Multiplier"
            placeholder="1.5"
            value={formData.peakHourMultiplier}
            onChangeText={(value) => handleInputChange('peakHourMultiplier', value)}
            leftIcon="trending-up-outline"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={[styles.fieldSpacing, { flex: 1, marginRight: spacing.md }]}>
          <Input
            label="Opening Time"
            placeholder="06:00"
            value={formData.openTime}
            onChangeText={(value) => handleInputChange('openTime', value)}
            leftIcon="time-outline"
          />
        </View>
        
        <View style={[styles.fieldSpacing, { flex: 1 }]}>
          <Input
            label="Closing Time"
            placeholder="22:00"
            value={formData.closeTime}
            onChangeText={(value) => handleInputChange('closeTime', value)}
            leftIcon="time-outline"
          />
        </View>
      </View>

      <View style={styles.daysSection}>
        <Text style={styles.sectionLabel}>Operating Days</Text>
        <View style={styles.daysContainer}>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayChip,
                formData.operatingDays.includes(day.value) && styles.dayChipSelected
              ]}
              onPress={() => toggleOperatingDay(day.value)}
            >
              <Text style={[
                styles.dayChipText,
                formData.operatingDays.includes(day.value) && styles.dayChipTextSelected
              ]}>
                {day.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.amenitiesSection}>
        <Text style={styles.sectionLabel}>Amenities</Text>
        <View style={styles.amenitiesContainer}>
          {COMMON_AMENITIES.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[
                styles.amenityChip,
                formData.amenities.includes(amenity) && styles.amenityChipSelected
              ]}
              onPress={() => toggleAmenity(amenity)}
            >
              <Text style={[
                styles.amenityChipText,
                formData.amenities.includes(amenity) && styles.amenityChipTextSelected
              ]}>
                {amenity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Courts & Facilities</Text>
      <Text style={styles.stepSubtitle}>Add the courts available at your venue</Text>
      
      {formData.courts.map((court, index) => (
        <View key={court.id} style={styles.courtCard}>
          <View style={styles.courtHeader}>
            <Text style={styles.courtTitle}>Court {index + 1}</Text>
            <TouchableOpacity onPress={() => removeCourt(court.id)}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.courtRow}>
            <View style={[styles.fieldSpacing, { flex: 1, marginRight: spacing.md }]}>
              <Input
                label="Court Name"
                placeholder="Court 1"
                value={court.name}
                onChangeText={(value) => updateCourt(court.id, 'name', value)}
                leftIcon="basketball-outline"
              />
            </View>
            
            <View style={[styles.fieldSpacing, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Court Type</Text>
              
              {editingCourtType === court.id ? (
                <View style={styles.customCourtTypeContainer}>
                  <Input
                    placeholder="Enter custom court type"
                    value={customCourtType}
                    onChangeText={setCustomCourtType}
                    leftIcon="basketball-outline"
                    style={styles.customCourtTypeInput}
                  />
                  <View style={styles.customCourtTypeActions}>
                    <TouchableOpacity 
                      style={styles.customTypeActionButton}
                      onPress={cancelCustomCourtType}
                    >
                      <Ionicons name="close-outline" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.customTypeActionButton, styles.customTypeActionButtonPrimary]}
                      onPress={() => handleCustomCourtType(court.id)}
                    >
                      <Ionicons name="checkmark-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.courtTypeContainer}>
                  {COURT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.courtTypeChip,
                        court.type === type.value && styles.courtTypeChipSelected
                      ]}
                      onPress={() => updateCourt(court.id, 'type', type.value)}
                    >
                      <Text style={[
                        styles.courtTypeChipText,
                        court.type === type.value && styles.courtTypeChipTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Show custom type if it's not in predefined types */}
                  {!COURT_TYPES.some(type => type.value === court.type) && (
                    <View style={[styles.courtTypeChip, styles.courtTypeChipSelected, styles.customCourtTypeChip]}>
                      <Text style={[styles.courtTypeChipText, styles.courtTypeChipTextSelected]}>
                        {court.type.charAt(0).toUpperCase() + court.type.slice(1)}
                      </Text>
                    </View>
                  )}
                  
                  {/* Custom button at the end */}
                  <TouchableOpacity 
                    style={styles.customCourtTypeButton}
                    onPress={() => setEditingCourtType(court.id)}
                  >
                    <Ionicons name="add-outline" size={16} color={colors.primary} />
                    <Text style={styles.customCourtTypeButtonText}>Custom</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      ))}
      
      <TouchableOpacity style={styles.addCourtButton} onPress={addCourt}>
        <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        <Text style={styles.addCourtText}>Add Another Court</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepSubtitle}>Please review your venue information before submitting</Text>
      
      <View style={styles.reviewCard}>
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Venue Details</Text>
          <Text style={styles.reviewText}>Name: {formData.name}</Text>
          <Text style={styles.reviewText}>Address: {formData.address}</Text>
          <Text style={styles.reviewText}>Base Price: ₹{formData.basePrice}/hour</Text>
        </View>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Operating Hours</Text>
          <Text style={styles.reviewText}>{formData.openTime} - {formData.closeTime}</Text>
          <Text style={styles.reviewText}>Days: {formData.operatingDays.join(', ')}</Text>
        </View>
        
        <View style={styles.reviewSection}>
          <Text style={styles.reviewSectionTitle}>Courts ({formData.courts.length})</Text>
          {formData.courts.map((court, index) => (
            <Text key={court.id} style={styles.reviewText}>
              {court.name} - {court.type}
            </Text>
          ))}
        </View>
        
        {formData.amenities.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewSectionTitle}>Amenities</Text>
            <Text style={styles.reviewText}>{formData.amenities.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* White Elevated Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Venue</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSubtitle}>Step {currentStep} of 4</Text>
      </View>

      {/* Progress Indicator - 4 Dashed Lines */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.progressStep,
              step <= currentStep && styles.progressStepActive
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 1 && (
            <Button
              title="Previous"
              onPress={handlePrevious}
              variant="outline"
              style={styles.prevButton}
            />
          )}
          
          {currentStep < 4 ? (
            <Button
              title="Next"
              onPress={handleNext}
              variant="primary"
              style={styles.navButton}
            />
          ) : (
            <Button
              title="Submit Venue"
              onPress={handleSubmit}
              variant="primary"
              loading={loading}
              style={styles.navButton}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
