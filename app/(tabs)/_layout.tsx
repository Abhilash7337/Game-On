// In app/(tabs)/_layout.tsx

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

        // 1. Set the active icon color directly to your green
        tabBarActiveTintColor: '#208C4D',

        // 2. Set an inactive color so the other icons are visible
        tabBarInactiveTintColor: '#8e8e93', // A standard grey color

        // 3. Set the background color directly. This replaces the need
        //    for your custom TabBarBackground component and complex styling.
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
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="people" color={color} />,
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