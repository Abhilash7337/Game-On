import React, { useEffect, useState } from "react";
import {
    buttonStyles,
    cardStyles,
    venueDetailsStyles,
    venueDetailsTextStyles
} from '@/styles/screens/VenueDetailsScreen';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
// 1. Import StatusBar and useSafeAreaInsets
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Venue } from '@/src/common/types';

const { width } = Dimensions.get("window");

export default function VenueDetailsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();
  // 2. Get the safe area inset values
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadVenueDetails();
  }, []);

  const loadVenueDetails = async () => {
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
    } catch (error) {
      console.error('Error loading venue details:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <StatusBar style="light" />

      <View style={venueDetailsStyles.container}>
        {/* 3. Header with dynamic padding for the safe area */}
        <View style={[venueDetailsStyles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color="white" />
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
            <Text style={venueDetailsStyles.venueName}>{venue.name}</Text>
            <View style={venueDetailsStyles.venueLocation}>
              <Ionicons name="location-outline" size={18} color="gray" />
              <Text style={venueDetailsStyles.locationText}>{venue.address}</Text>
            </View>
            {/* Rating Stars */}
            <View style={venueDetailsStyles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons 
                  key={i} 
                  name={i < Math.floor(venue.rating) ? "star" : "star-outline"} 
                  size={18} 
                  color="#EA580C" 
                />
              ))}
              <Text style={{ marginLeft: 8, color: '#6B7280', fontSize: 14 }}>
                {venue.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Courts Info */}
          {venue.courts.length > 0 && (
            <View style={venueDetailsStyles.amenities}>
              <Text style={venueDetailsStyles.amenitiesTitle}>Available Courts</Text>
              <View style={venueDetailsStyles.amenitiesGrid}>
                {venue.courts.map((court, index) => (
                  <View key={court.id} style={venueDetailsStyles.amenityItem}>
                    <Ionicons name="basketball-outline" size={20} color="#047857" />
                    <Text style={venueDetailsStyles.amenityText}>{court.name} ({court.type})</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

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

            <View style={venueDetailsStyles.priceSection}>
              <Text style={venueDetailsStyles.priceTitle}>
                Price: ₹{venue.pricing.basePrice}/hour
              </Text>
              <Text style={venueDetailsStyles.priceText}>
                Operating Hours: {venue.operatingHours.open} - {venue.operatingHours.close}
              </Text>
              <Text style={venueDetailsStyles.priceText}>
                Days: {venue.operatingHours.days.join(', ')}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Book Button */}
        <View style={venueDetailsStyles.bookButtonContainer}>
          <TouchableOpacity 
            style={venueDetailsStyles.bookButton}
            onPress={() => {
              // Navigate to booking form with venue data
              router.push({
                pathname: '/BookingFormScreen',
                params: {
                  venueId: venue.id,
                  venueName: venue.name,
                  venuePrice: venue.pricing.basePrice.toString(),
                  ownerId: venue.ownerId
                }
              });
            }}
          >
            <Text style={venueDetailsStyles.bookButtonText}>
              Book Now - ₹{venue.pricing.basePrice}/hour
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}