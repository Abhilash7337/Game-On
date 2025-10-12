import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Venue } from '@/src/common/types';
import { ClientService } from '@/src/client/services/clientApi';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { venueManagementStyles } from '@/styles/screens/VenueManagementScreen';

export default function VenueManagementScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      const response = await ClientService.getClientVenues();
      if (response.success && response.data) {
        setVenues(response.data);
      }
    } catch (error) {
      console.error('Error loading venues:', error);
      Alert.alert('Error', 'Failed to load venues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEditVenue = (venue: Venue) => {
    router.push({
      pathname: '/add-venue',
      params: { venueId: venue.id, mode: 'edit' }
    });
  };

  const handleDeleteVenue = (venue: Venue) => {
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
              const response = await ClientService.deleteVenue(venue.id);
              if (response.success) {
                Alert.alert('Success', 'Venue deleted successfully');
                loadVenues();
              } else {
                Alert.alert('Error', response.message || 'Failed to delete venue');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete venue');
            }
          }
        }
      ]
    );
  };

  const VenueCard = ({ venue }: { venue: Venue }) => (
    <View style={venueManagementStyles.venueCard}>
      <View style={venueManagementStyles.venueHeader}>
        <View style={venueManagementStyles.venueInfo}>
          <Text style={venueManagementStyles.venueName}>{venue.name}</Text>
          <Text style={venueManagementStyles.venueAddress}>{venue.address}</Text>
          <Text style={venueManagementStyles.venueCourts}>{venue.courts.length} courts</Text>
        </View>
        <View style={[
          venueManagementStyles.statusBadge,
          { backgroundColor: venue.isActive ? colors.success + '20' : colors.error + '20' }
        ]}>
          <Text style={[
            venueManagementStyles.statusText,
            { color: venue.isActive ? colors.success : colors.error }
          ]}>
            {venue.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <View style={venueManagementStyles.venueStats}>
        <View style={venueManagementStyles.statItem}>
          <Ionicons name="star" size={16} color={colors.warning} />
          <Text style={venueManagementStyles.statText}>{venue.rating.toFixed(1)}</Text>
        </View>
        <View style={venueManagementStyles.statItem}>
          <Ionicons name="calendar" size={16} color={colors.primary} />
          <Text style={venueManagementStyles.statText}>0 bookings</Text>
        </View>
        <View style={venueManagementStyles.statItem}>
          <Ionicons name="cash" size={16} color={colors.success} />
          <Text style={venueManagementStyles.statText}>₹0 revenue</Text>
        </View>
      </View>
      
      <View style={venueManagementStyles.actionButtons}>
        <TouchableOpacity
          style={[venueManagementStyles.actionButton, venueManagementStyles.editButton]}
          onPress={() => handleEditVenue(venue)}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={venueManagementStyles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[venueManagementStyles.actionButton, venueManagementStyles.deleteButton]}
          onPress={() => handleDeleteVenue(venue)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={[venueManagementStyles.actionButtonText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={venueManagementStyles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Venue Management"
        subtitle="Manage your venues and courts"
      >
        <TouchableOpacity
          style={venueManagementStyles.addButton}
          onPress={() => router.push('/add-venue')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </AppHeader>

      <View style={venueManagementStyles.content}>
        <View style={venueManagementStyles.headerSection}>
          <Text style={venueManagementStyles.sectionTitle}>Your Venues</Text>
          <Text style={venueManagementStyles.sectionSubtitle}>
            {venues.length} venue{venues.length !== 1 ? 's' : ''} • {venues.filter(v => v.isActive).length} active
          </Text>
        </View>

        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VenueCard venue={item} />}
          contentContainerStyle={venueManagementStyles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadVenues(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={venueManagementStyles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color={colors.textTertiary} />
              <Text style={venueManagementStyles.emptyTitle}>No Venues Yet</Text>
              <Text style={venueManagementStyles.emptyText}>
                Add your first venue to start accepting bookings
              </Text>
              <Button
                title="Add Venue"
                onPress={() => router.push('/add-venue')}
                variant="primary"
                style={venueManagementStyles.emptyButton}
              />
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
