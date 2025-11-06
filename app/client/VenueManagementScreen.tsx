import { Venue } from '@/src/common/types';
import { venueManagementStyles } from '@/styles/screens/VenueManagementScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const styles = venueManagementStyles;

export default function VenueManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { VenueStorageService } = await import('@/src/common/services/venueStorage');
      const { supabase } = await import('@/src/common/services/supabase');
      
      // Get current client ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to view your venues');
        return;
      }

      const clientVenues = await VenueStorageService.getVenuesByOwner(user.id);
      setVenues(clientVenues);
    } catch (error) {
      console.error('Error loading venues:', error);
      Alert.alert('Error', 'Failed to load venues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleStatus = async (venueId: string, currentStatus: boolean) => {
    try {
      const { VenueStorageService } = await import('@/src/common/services/venueStorage');
      const newStatus = await VenueStorageService.toggleVenueStatus(venueId);
      
      // Update local state
      setVenues(prev => prev.map(v => 
        v.id === venueId ? { ...v, isActive: newStatus } : v
      ));

      Alert.alert(
        'Success',
        `Venue is now ${newStatus ? 'active' : 'inactive'}`
      );
    } catch (error) {
      console.error('Error toggling venue status:', error);
      Alert.alert('Error', 'Failed to update venue status');
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
              const { VenueStorageService } = await import('@/src/common/services/venueStorage');
              await VenueStorageService.deleteVenue(venue.id);
              
              // Remove from local state
              setVenues(prev => prev.filter(v => v.id !== venue.id));
              
              Alert.alert('Success', 'Venue deleted successfully');
            } catch (error) {
              console.error('Error deleting venue:', error);
              Alert.alert('Error', 'Failed to delete venue');
            }
          }
        }
      ]
    );
  };

  const handleEditVenue = (venue: Venue) => {
    // Navigate to edit screen (to be implemented)
    Alert.alert('Coming Soon', 'Venue editing will be available soon');
    // TODO: router.push({ pathname: '/client/EditVenueScreen', params: { venueId: venue.id } });
  };

  const renderVenueItem = ({ item }: { item: Venue }) => (
    <View style={styles.venueCard}>
      {/* Venue Image */}
      <Image 
        source={{ uri: item.images[0] || 'https://via.placeholder.com/300x200/047857/ffffff?text=No+Image' }}
        style={styles.venueImage}
        resizeMode="cover"
      />

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
            <Text style={styles.statText}>{item.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="basketball-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.courts.length} courts</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.statText}>₹{item.pricing.basePrice}/hr</Text>
          </View>
        </View>

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar style="dark" />
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading venues...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Venues</Text>
            <Text style={styles.headerSubtitle}>{venues.length} venue{venues.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/add-venue')}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Venue List */}
      <FlatList
        data={venues}
        keyExtractor={(item) => item.id}
        renderItem={renderVenueItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadVenues(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
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
        }
      />
    </View>
  );
}
