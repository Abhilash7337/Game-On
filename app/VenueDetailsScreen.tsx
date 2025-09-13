import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
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

      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* 3. Header with dynamic padding for the safe area */}
        <View style={{
  backgroundColor: '#047857',
  paddingHorizontal: 20,
  paddingTop: insets.top + 16, // Adds extra space below the status bar
  paddingBottom: 16,
  flexDirection: 'row',
  alignItems: 'center'
}}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 12 }}>Venue Details</Text>
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
                style={{ width, height: 224 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
            {images.map((_, i) => (
              <View
                key={i}
                style={{ height: 8, width: 8, marginHorizontal: 4, borderRadius: 4, backgroundColor: i === activeIndex ? '#EA580C' : '#d1d5db' }}
              />
            ))}
          </View>

          {/* Venue Info */}
          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Mahindra Court</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="location-outline" size={18} color="gray" />
              <Text style={{ marginLeft: 4, color: '#4b5563' }}>Hyderabad, India</Text>
            </View>
            {/* Example Ratings with orange */}
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {[...Array(4)].map((_, i) => (
                <Ionicons key={i} name="star" size={18} color="#EA580C" />
              ))}
              <Ionicons name="star-outline" size={18} color="#EA580C" />
            </View>
          </View>

          {/* Amenities */}
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <Text style={{ fontWeight: '600', fontSize: 18, marginBottom: 8 }}>Amenities</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[
                { icon: "car-outline", label: "Parking" },
                { icon: "sunny-outline", label: "Lighting" },
                { icon: "water-outline", label: "Washrooms" },
                { icon: "cafe-outline", label: "Refreshments" },
                { icon: "people-outline", label: "Seating" },
              ].map((item, index) => (
                <View key={index} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name={item.icon as any} size={20} color="#047857" />
                  <Text style={{ marginLeft: 8, color: '#374151' }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* About */}
          <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 80 }}>
            <Text style={{ fontWeight: '600', fontSize: 18, marginBottom: 8 }}>About</Text>
            <Text style={{ color: '#4b5563' }}>
              Mahindra Court is a premium venue with world-class facilities,
              suitable for matches, tournaments, and casual games. Book your slot
              easily and enjoy top-notch amenities.
            </Text>

            <Text style={{ marginTop: 16, fontWeight: '600', fontSize: 18 }}>Price: ₹500/hour</Text>
            <Text style={{ color: '#EA580C', fontWeight: '500', marginTop: 4 }}>Limited Slots Available</Text>
          </View>
        </ScrollView>

        {/* Book Button */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
          <TouchableOpacity style={{ backgroundColor: '#047857', paddingVertical: 16, borderRadius: 18 }}>
            <Text style={{ color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
              Book Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}