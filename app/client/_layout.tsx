import { Stack } from 'expo-router';
import * as React from 'react';

// Client layout for venue owner screens
export default function ClientLayout() {
  return (
    <Stack>
      <Stack.Screen name="ClientNavigationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="BookingRequestsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="VenueManagementScreen" options={{ headerShown: false }} />
      <Stack.Screen name="BookingManagementScreen" options={{ headerShown: false }} />
      <Stack.Screen name="AnalyticsScreen" options={{ headerShown: false }} />
      <Stack.Screen name="ProfileScreen" options={{ headerShown: false }} />
    </Stack>
  );
}