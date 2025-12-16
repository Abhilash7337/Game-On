import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { MyTheme } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { imagePreloader } from '@/src/common/utils/imagePreloader';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Handle deep links for email verification and OAuth callbacks
  useEffect(() => {
    // Handle URL when app is opened from a link
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 [DEEP LINK] Received URL:', event.url);
      
      // Check if it's an auth callback URL
      if (event.url.includes('auth/callback') || event.url.includes('access_token')) {
        // Navigate to auth callback screen which will handle the tokens
        router.push('/auth/callback');
      }
    };

    // Check if app was opened with a URL
    const checkInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('🔗 [DEEP LINK] Initial URL:', initialUrl);
        handleDeepLink({ url: initialUrl });
      }
    };

    // Add listener for URL events (when app is already open)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL after app loads
    if (loaded && imagesLoaded) {
      checkInitialURL();
    }

    return () => {
      subscription.remove();
    };
  }, [loaded, imagesLoaded, router]);

  useEffect(() => {
    if (loaded) {
      // Preload critical images in background
      const preloadImages = async () => {
        try {
          console.log('🚀 [APP] Starting image preload...');
          
          // Preload critical static assets first (fast)
          await imagePreloader.preloadCriticalAssets();
          
          // Preload venue images in background (slower, don't block app)
          imagePreloader.preloadVenueImages().then(() => {
            console.log('✅ [APP] All venue images preloaded');
          }).catch(err => {
            console.warn('⚠️ [APP] Venue image preload failed:', err);
          });
          
          setImagesLoaded(true);
          SplashScreen.hideAsync();
        } catch (error) {
          console.error('❌ [APP] Image preload error:', error);
          // Don't block app launch on image preload failure
          setImagesLoaded(true);
          SplashScreen.hideAsync();
        }
      };

      preloadImages();
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