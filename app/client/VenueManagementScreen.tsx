import AppHeader from '@/src/common/components/AppHeader';
import { supabase } from '@/src/common/services/supabase';
import { Venue } from '@/src/common/types';
import { venueManagementStyles } from '@/styles/screens/VenueManagementScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = venueManagementStyles;

export default function VenueManagementScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Venue>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    initializeAndLoadVenues();
  }, []);

  // Refresh venues when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (clientId) {
        console.log('🏢 [VENUE MANAGEMENT] Screen focused, refreshing venues...');
        loadVenues();
      }
    }, [clientId])
  );

  const initializeAndLoadVenues = async () => {
    try {
      // Get current client ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        Alert.alert('Error', 'Please log in to manage venues');
        router.replace('/client-login');
        return;
      }

      setClientId(user.id);
      await loadVenues(user.id);
    } catch (error) {
      console.error('❌ [VENUE MANAGEMENT] Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize venue management');
    }
  };

  const loadVenues = async (userId?: string, isRefresh = false) => {
    const currentClientId = userId || clientId;
    if (!currentClientId) return;

    if (isRefresh || venues.length > 0) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🏢 [VENUE MANAGEMENT] Loading venues for client:', currentClientId);

      // Fetch client's venues from Supabase with courts
      const { data: venueData, error } = await supabase
        .from('venues')
        .select(`
          *,
          courts(*)
        `)
        .eq('client_id', currentClientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [VENUE MANAGEMENT] Supabase error:', error);
        throw error;
      }

      // Transform Supabase data to match Venue interface
      const transformedVenues: Venue[] = (venueData || []).map(v => {
        // Parse location safely
        let location = { latitude: 0, longitude: 0 };
        if (v.location) {
          try {
            if (typeof v.location === 'string') {
              const parsed = JSON.parse(v.location);
              if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
                location = parsed;
              }
            } else if (typeof v.location === 'object' && v.location.latitude && v.location.longitude) {
              location = v.location;
            }
          } catch (parseError) {
            console.log(`Invalid location format for venue ${v.id}, using default coordinates`);
          }
        }

        // Transform courts data
        const venueCourts = (v.courts || []).map((court: any) => ({
          id: court.id,
          name: court.name,
          venueId: court.venue_id,
          type: court.type,
          isActive: court.is_active !== false,
        }));

        return {
          id: v.id,
          name: v.name,
          address: v.address,
          location: location,
          description: v.description || '',
          amenities: Array.isArray(v.facilities) ? v.facilities : [],
          images: Array.isArray(v.images) ? v.images : [],
          pricing: v.pricing || { basePrice: 0, peakHourMultiplier: 1.5, currency: 'INR' },
          operatingHours: v.availability || { open: '06:00', close: '22:00', days: [] },
          courts: venueCourts,
          ownerId: v.client_id,
          rating: v.rating || 0,
          isActive: v.is_active !== false,
          createdAt: new Date(v.created_at),
        };
      });

      setVenues(transformedVenues);
      console.log(`✅ [VENUE MANAGEMENT] Loaded ${transformedVenues.length} venues`);
    } catch (error) {
      console.error('❌ [VENUE MANAGEMENT] Error loading venues:', error);
      Alert.alert('Error', 'Failed to load venues. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (venueId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      // Update venue in Supabase
      const { error } = await supabase
        .from('venues')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', venueId)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }
      
      // Update local state
      setVenues(prev => prev.map(v => 
        v.id === venueId ? { ...v, isActive: newStatus } : v
      ));

      Alert.alert(
        'Success',
        `Venue is now ${newStatus ? 'active' : 'inactive'}`
      );
    } catch (error) {
      console.error('❌ [VENUE MANAGEMENT] Error toggling venue status:', error);
      Alert.alert('Error', 'Failed to update venue status');
    }
  };

  const handleEditVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setEditForm({
      name: venue.name,
      description: venue.description,
      address: venue.address,
      amenities: venue.amenities,
      images: venue.images,
      pricing: venue.pricing,
      operatingHours: venue.operatingHours,
    });
    setShowEditModal(true);
  };

  const handleSaveVenue = async () => {
    if (!selectedVenue || !clientId) return;

    try {
      setUploading(true);

      // Update venue in Supabase
      const { error } = await supabase
        .from('venues')
        .update({
          name: editForm.name,
          description: editForm.description,
          address: editForm.address,
          facilities: editForm.amenities,
          images: editForm.images,
          pricing: editForm.pricing,
          availability: editForm.operatingHours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedVenue.id)
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Venue updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowEditModal(false);
            loadVenues(undefined, true); // Refresh the venues list
          }
        }
      ]);
    } catch (error) {
      console.error('❌ [VENUE MANAGEMENT] Save error:', error);
      Alert.alert('Error', 'Failed to update venue. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVenue = async (venue: Venue) => {
    Alert.alert(
      'Delete Venue',
      `Are you sure you want to delete "${venue.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Soft delete - just mark as inactive
              const { error } = await supabase
                .from('venues')
                .update({ 
                  is_active: false,
                  updated_at: new Date().toISOString()
                })
                .eq('id', venue.id)
                .eq('client_id', clientId);

              if (error) {
                throw error;
              }
              
              // Remove from local state
              setVenues(prev => prev.filter(v => v.id !== venue.id));
              
              Alert.alert('Success', 'Venue deleted successfully');
            } catch (error) {
              console.error('❌ [VENUE MANAGEMENT] Error deleting venue:', error);
              Alert.alert('Error', 'Failed to delete venue');
            }
          }
        }
      ]
    );
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera roll permission is needed to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setEditForm(prev => ({
          ...prev,
          images: [...(prev.images || []), newImage]
        }));
      }
    } catch (error) {
      console.error('❌ [VENUE MANAGEMENT] Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setEditForm(prev => {
      const currentAmenities = prev.amenities || [];
      const isSelected = currentAmenities.includes(amenity);
      
      return {
        ...prev,
        amenities: isSelected 
          ? currentAmenities.filter(a => a !== amenity)
          : [...currentAmenities, amenity]
      };
    });
  };

  const renderVenueItem = ({ item }: { item: Venue }) => (
    <View style={styles.venueCard}>
      {/* Venue Image */}
      <View style={styles.venueImageContainer}>
        <Image 
          source={{ 
            uri: item.images && item.images.length > 0 
              ? item.images[0] 
              : 'https://via.placeholder.com/300x200/047857/ffffff?text=No+Image'
          }}
          style={styles.venueImage}
          resizeMode="cover"
        />
        
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isActive ? colors.success + '20' : colors.error + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.isActive ? colors.success : colors.error }
          ]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Venue Info */}
      <View style={styles.venueInfo}>
        <View style={styles.venueHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.venueName}>{item.name}</Text>
            <Text style={styles.venueAddress} numberOfLines={1}>{item.address}</Text>
          </View>
          
          {/* Active Status Toggle */}
          <View style={styles.statusToggle}>
            <Text style={styles.statusLabel}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggleStatus(item.id, item.isActive)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {/* Venue Stats */}
        <View style={styles.venueStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.statText}>{item.rating?.toFixed(1) || 'N/A'}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="basketball-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.courts?.length || 0} courts</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>₹{item.pricing?.basePrice || 0}/hr</Text>
          </View>
        </View>

        {/* Amenities Preview */}
        {item.amenities && item.amenities.length > 0 && (
          <View style={styles.amenitiesContainer}>
            {item.amenities.slice(0, 3).map((amenity, index) => (
              <View key={index} style={styles.amenityChip}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
            {item.amenities.length > 3 && (
              <View style={styles.amenityChip}>
                <Text style={styles.amenityText}>+{item.amenities.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditVenue(item)}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteVenue(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const COMMON_AMENITIES = [
    'Parking', 'Locker Rooms', 'Cafeteria', 'Pro Shop', 'Air Conditioning',
    'WiFi', 'Shower Facilities', 'Equipment Rental', 'First Aid', 'Lighting'
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading venues...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Venue Management"
        subtitle={`Managing ${venues.length} venue${venues.length !== 1 ? 's' : ''}`}
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        {/* Quick Actions Header */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.addVenueButton}
            onPress={() => router.push('/add-venue')}
          >
            <Ionicons name="add-circle" size={20} color={colors.textInverse} />
            <Text style={styles.addVenueButtonText}>Add New Venue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => loadVenues(undefined, true)}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh-outline" 
              size={20} 
              color={refreshing ? colors.textTertiary : colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Venues List */}
        {venues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>No Venues Yet</Text>
            <Text style={styles.emptyText}>
              Add your first venue to start receiving bookings
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/add-venue')}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.background} />
              <Text style={styles.emptyButtonText}>Add Venue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={venues}
            keyExtractor={(item) => item.id}
            renderItem={renderVenueItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadVenues(undefined, true)}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Edit Venue Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Venue</Text>
            <TouchableOpacity onPress={handleSaveVenue} disabled={uploading}>
              <Text style={[
                styles.modalSaveText,
                uploading && { opacity: 0.5 }
              ]}>
                {uploading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Venue Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Venue Name</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name || ''}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter venue name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editForm.description || ''}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                placeholder="Describe your venue..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.address || ''}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, address: text }))}
                placeholder="Enter venue address"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Base Price */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Base Price (per hour)</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.pricing?.basePrice?.toString() || ''}
                onChangeText={(text) => setEditForm(prev => ({ 
                  ...prev, 
                  pricing: { 
                    ...prev.pricing, 
                    basePrice: parseFloat(text) || 0,
                    peakHourMultiplier: prev.pricing?.peakHourMultiplier || 1.5,
                    currency: 'INR'
                  } 
                }))}
                placeholder="Enter base price"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>

            {/* Images */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Images</Text>
              <ScrollView horizontal style={styles.imagesContainer} showsHorizontalScrollIndicator={false}>
                {editForm.images?.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: image }} style={styles.editImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity 
                  style={styles.addImageButton}
                  onPress={handleImagePicker}
                >
                  <Ionicons name="add" size={32} color={colors.textTertiary} />
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Amenities */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {COMMON_AMENITIES.map((amenity) => (
                  <TouchableOpacity
                    key={amenity}
                    style={[
                      styles.amenityOption,
                      editForm.amenities?.includes(amenity) && styles.amenityOptionSelected
                    ]}
                    onPress={() => toggleAmenity(amenity)}
                  >
                    <Text style={[
                      styles.amenityOptionText,
                      editForm.amenities?.includes(amenity) && styles.amenityOptionTextSelected
                    ]}>
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
