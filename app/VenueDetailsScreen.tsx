import {
  venueDetailsStyles
} from '@/styles/screens/VenueDetailsScreen';
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
// 1. Import StatusBar and useSafeAreaInsets
import { Venue } from '@/src/common/types';
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function VenueDetailsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();
  // 2. Get the safe area inset values
  const insets = useSafeAreaInsets();

  const loadVenueDetails = useCallback(async () => {
    try {
      const { VenueStorageService } = await import('@/src/common/services/venueStorage');
      const venues = await VenueStorageService.getAllVenues();
      const venueId = params.venueId as string;
      
      const foundVenue = venues.find(v => v.id === venueId);
      if (foundVenue) {
        setVenue(foundVenue);
      } else {
        // Fallback to default venue if not found
        setVenue({
          id: '1',
          name: 'Mahindra Court',
          address: 'Mahindra University, Bahadurpally, Hyderabad',
          location: { latitude: 17.5449, longitude: 78.5718 },
          description: 'Premium sports facility with modern amenities and professional courts suitable for matches, tournaments, and casual games.',
          amenities: ['Parking', 'Lighting', 'Washrooms', 'Refreshments', 'Seating'],
          images: ['https://via.placeholder.com/400x200/047857/ffffff?text=Mahindra+Court'],
          pricing: { basePrice: 500, peakHourMultiplier: 1.5, currency: 'INR' },
          operatingHours: { open: '06:00', close: '22:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
          courts: [],
          ownerId: 'sample-owner',
          rating: 4.2,
          isActive: true,
          createdAt: new Date(),
        });
      }
    } catch {
      // Error loading venue details - using fallback venue
    } finally {
      setLoading(false);
    }
  }, [params.venueId]);

  useEffect(() => {
    loadVenueDetails();
  }, [loadVenueDetails]);

  if (loading) {
    return (
      <View style={[venueDetailsStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#047857" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading venue details...</Text>
      </View>
    );
  }

  if (!venue) {
    return (
      <View style={[venueDetailsStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: '#6B7280' }}>Venue not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#047857' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImages = venue.images.length > 0 ? venue.images : [
    'https://via.placeholder.com/400x200/047857/ffffff?text=No+Image'
  ];

  const amenityIcons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    'Parking': 'car-outline',
    'Lighting': 'sunny-outline',
    'Washrooms': 'water-outline',
    'Refreshments': 'cafe-outline',
    'Seating': 'people-outline',
    'Cafeteria': 'restaurant-outline',
    'Locker Rooms': 'lock-closed-outline',
    'Air Conditioning': 'snow-outline',
    'WiFi': 'wifi-outline',
    'Shower Facilities': 'water-outline',
    'Equipment Rental': 'basketball-outline',
    'First Aid': 'medical-outline',
    'Pro Shop': 'storefront-outline'
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View style={venueDetailsStyles.container}>
        {/* White Header matching Social Hub design */}
        <View style={[venueDetailsStyles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={venueDetailsStyles.headerTitle}>Venue Details</Text>
        </View>

        <ScrollView>
          {/* Image Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {displayImages.map((img: string, index: number) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={[venueDetailsStyles.image, { width, height: 224 }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          <View style={venueDetailsStyles.dotsContainer}>
            {displayImages.map((_: string, i: number) => (
              <View
                key={i}
                style={[venueDetailsStyles.dot, i === activeIndex ? venueDetailsStyles.dotActive : venueDetailsStyles.dotInactive]}
              />
            ))}
          </View>

          {/* Venue Info */}
          <View style={venueDetailsStyles.venueInfo}>
            <View style={venueDetailsStyles.venueNameRow}>
              <Text style={venueDetailsStyles.venueName}>{venue.name}</Text>
              <View style={venueDetailsStyles.ratingContainer}>
                <Ionicons name="star" size={16} color="#EA580C" />
                <Text style={venueDetailsStyles.ratingText}>
                  {venue.rating.toFixed(1)} ({Math.floor(Math.random() * 50) + 10})
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={venueDetailsStyles.venueLocation}
              onPress={() => {
                // In a real app, use Linking.openURL with Google Maps URL
                // Maps functionality will be implemented with proper linking
              }}
            >
              <Ionicons name="map-outline" size={18} color="#047857" />
              <Text style={venueDetailsStyles.locationText}>{venue.address}</Text>
              <Text style={venueDetailsStyles.distanceText}>• 2.5 km</Text>
            </TouchableOpacity>
            
            {/* Operating Hours */}
            <View style={venueDetailsStyles.operatingHours}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={venueDetailsStyles.hoursText}>
                {venue.operatingHours.open} - {venue.operatingHours.close} • {venue.operatingHours.days.join(', ')}
              </Text>
            </View>
          </View>


          {/* Amenities */}
          <View style={venueDetailsStyles.amenities}>
            <Text style={venueDetailsStyles.amenitiesTitle}>Amenities</Text>
            <View style={venueDetailsStyles.amenitiesGrid}>
              {venue.amenities.map((amenity, index) => (
                <View key={index} style={venueDetailsStyles.amenityItem}>
                  <Ionicons 
                    name={amenityIcons[amenity] || "checkmark-circle-outline"} 
                    size={20} 
                    color="#047857" 
                  />
                  <Text style={venueDetailsStyles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* About */}
          <View style={venueDetailsStyles.about}>
            <Text style={venueDetailsStyles.aboutTitle}>About</Text>
            <Text style={venueDetailsStyles.aboutText}>
              {venue.description}
            </Text>
          </View>

          {/* Advanced Court Availability */}
          <View style={venueDetailsStyles.courtAvailability}>
            <View style={venueDetailsStyles.availabilityHeader}>
              <Text style={venueDetailsStyles.amenitiesTitle}>Court Availability</Text>
              <TouchableOpacity 
                style={venueDetailsStyles.dateSelector}
                onPress={() => {
                  // TODO: Implement date picker modal for next 15 days
                  // Date selection functionality will be added
                }}
              >
                <Text style={venueDetailsStyles.todayLabel}>Today</Text>
                <Ionicons name="chevron-down-outline" size={16} color="#047857" />
              </TouchableOpacity>
            </View>
            
            {/* Courts with Horizontal Scrollable Time Slots */}
            {['Court A1', 'Court B1', 'Court C1'].map((courtName, courtIndex) => (
              <View key={courtIndex} style={venueDetailsStyles.courtSection}>
                <Text style={venueDetailsStyles.courtTitle}>{courtName}</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={venueDetailsStyles.timeSlotsScroll}
                  contentContainerStyle={venueDetailsStyles.timeSlotsContainer}
                >
                  {[
                    { time: '6:00 AM', status: 'available', price: 500 },
                    { time: '7:00 AM', status: 'booked', price: 500 },
                    { time: '8:00 AM', status: 'available', price: 500 },
                    { time: '9:00 AM', status: 'openToJoin', price: 500 },
                    { time: '10:00 AM', status: 'booked', price: 500 },
                    { time: '11:00 AM', status: 'available', price: 500 },
                    { time: '12:00 PM', status: 'openToJoin', price: 500 },
                    { time: '1:00 PM', status: 'booked', price: 500 },
                    { time: '2:00 PM', status: 'available', price: 500 },
                  ].map((slot, timeIndex) => (
                    <TouchableOpacity
                      key={timeIndex}
                      style={[
                        venueDetailsStyles.timeSlotCard,
                        slot.status === 'available' ? venueDetailsStyles.availableSlot : 
                        slot.status === 'openToJoin' ? venueDetailsStyles.openToJoinSlot : 
                        venueDetailsStyles.bookedSlot
                      ]}
                      onPress={() => {
                        if (slot.status === 'available' || slot.status === 'openToJoin') {
                          router.push({
                            pathname: '/BookingFormScreen',
                            params: {
                              venueId: venue.id,
                              venueName: venue.name,
                              venuePrice: slot.price.toString(),
                              ownerId: venue.ownerId,
                              court: courtName,
                              timeSlot: slot.time
                            }
                          });
                        }
                      }}
                      disabled={slot.status === 'booked'}
                    >
                      <Text style={venueDetailsStyles.slotTime}>{slot.time}</Text>
                      <Text style={[
                        venueDetailsStyles.slotPrice,
                        slot.status === 'available' ? venueDetailsStyles.availablePrice : 
                        slot.status === 'openToJoin' ? venueDetailsStyles.openToJoinPrice :
                        venueDetailsStyles.bookedPrice
                      ]}>
                        {slot.status === 'available' ? `₹${slot.price}` : 
                         slot.status === 'openToJoin' ? 'Join Game' : 'Booked'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}