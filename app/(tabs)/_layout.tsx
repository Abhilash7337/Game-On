// In app/(tabs)/_layout.tsx

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
// We don't need TabBarBackground or useColorScheme anymore

export default function TabLayout() {
  // We've removed useColorScheme as the colors are now static
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,

        // 1. Set the active icon color to design system primary (hsl(220 70% 25%))
        tabBarActiveTintColor: '#1E3A8A',

        // 2. Set inactive color to muted foreground (hsl(220 10% 45%))
        tabBarInactiveTintColor: '#6B7280',

        // 3. Set the background color to white
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="courts"
        options={{
          title: 'Courts',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="tennisball" color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <MaterialIcons name="people" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}