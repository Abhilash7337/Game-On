import React, { useState } from "react";
import {
    buttonStyles,
    cardStyles,
    venueDetailsStyles,
    venueDetailsTextStyles
} from '@/styles/screens/VenueDetailsScreen';
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
// 1. Import StatusBar and useSafeAreaInsets
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const images = [
  "https://via.placeholder.com/400x200",
  "https://via.placeholder.com/400x200/008000",
  "https://via.placeholder.com/400x200/cccccc",
];

export default function VenueDetailsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  // 2. Get the safe area inset values
  const insets = useSafeAreaInsets();

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
            {images.map((img, index) => (
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
            {images.map((_, i) => (
              <View
                key={i}
                style={[venueDetailsStyles.dot, i === activeIndex ? venueDetailsStyles.dotActive : venueDetailsStyles.dotInactive]}
              />
            ))}
          </View>

          {/* Venue Info */}
          <View style={venueDetailsStyles.venueInfo}>
            <Text style={venueDetailsStyles.venueName}>Mahindra Court</Text>
            <View style={venueDetailsStyles.venueLocation}>
              <Ionicons name="location-outline" size={18} color="gray" />
              <Text style={venueDetailsStyles.locationText}>Hyderabad, India</Text>
            </View>
            {/* Example Ratings with orange */}
            <View style={venueDetailsStyles.ratingContainer}>
              {[...Array(4)].map((_, i) => (
                <Ionicons key={i} name="star" size={18} color="#EA580C" />
              ))}
              <Ionicons name="star-outline" size={18} color="#EA580C" />
            </View>
          </View>

          {/* Amenities */}
          <View style={venueDetailsStyles.amenities}>
            <Text style={venueDetailsStyles.amenitiesTitle}>Amenities</Text>
            <View style={venueDetailsStyles.amenitiesGrid}>
              {[
                { icon: "car-outline", label: "Parking" },
                { icon: "sunny-outline", label: "Lighting" },
                { icon: "water-outline", label: "Washrooms" },
                { icon: "cafe-outline", label: "Refreshments" },
                { icon: "people-outline", label: "Seating" },
              ].map((item, index) => (
                <View key={index} style={venueDetailsStyles.amenityItem}>
                  <Ionicons name={item.icon as any} size={20} color="#047857" />
                  <Text style={venueDetailsStyles.amenityText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* About */}
          <View style={venueDetailsStyles.about}>
            <Text style={venueDetailsStyles.aboutTitle}>About</Text>
            <Text style={venueDetailsStyles.aboutText}>
              Mahindra Court is a premium venue with world-class facilities,
              suitable for matches, tournaments, and casual games. Book your slot
              easily and enjoy top-notch amenities.
            </Text>

            <View style={venueDetailsStyles.priceSection}>
              <Text style={venueDetailsStyles.priceTitle}>Price: ₹500/hour</Text>
              <Text style={venueDetailsStyles.priceText}>Limited Slots Available</Text>
            </View>
          </View>
        </ScrollView>

        {/* Book Button */}
        <View style={venueDetailsStyles.bookButtonContainer}>
          <TouchableOpacity style={venueDetailsStyles.bookButton}>
            <Text style={venueDetailsStyles.bookButtonText}>
              Book Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}