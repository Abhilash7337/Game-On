import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { MyTheme } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        if (__DEV__) {
          console.error('Global Error Boundary:', error);
          console.error('Error Info:', errorInfo);
        }
        // In production, you could log to a service like Sentry
      }}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : MyTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          {/* DISABLED: Auth selection screen - users now go directly to login page */}
          {/* <Stack.Screen name="auth-selection" options={{ headerShown: false }} /> */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="client-login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="QuickBookScreen" options={{ headerShown: false }} />
          <Stack.Screen name="JoinGamesScreen" options={{ headerShown: false }} />
          <Stack.Screen name="JoinGameScreen" options={{ headerShown: false }} />
          <Stack.Screen name="VenueDetailsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="BookingFormScreen" options={{ headerShown: false }} />
          <Stack.Screen name="NotificationsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="client/BookingRequestsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="client/dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="add-venue" options={{ headerShown: false }} />
          <Stack.Screen name="EditProfileScreen" options={{ headerShown: false }} />
          <Stack.Screen name="FriendChatScreen" options={{ headerShown: false }} />
          <Stack.Screen name="GlobalChatScreen" options={{ headerShown: false }} />
          <Stack.Screen name="GameChatScreen" options={{ headerShown: false }} />
          <Stack.Screen name="SportGroupChatScreen" options={{ headerShown: false }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}