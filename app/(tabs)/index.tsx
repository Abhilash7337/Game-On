
import AppHeader from '@/src/common/components/AppHeader';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { dataPrefetchService } from '@/src/common/services/dataPrefetch';
import {
    homeStyles,
    homeTextStyles
} from '@/styles/screens/HomeScreen';
import { spacing } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; location: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);

  useEffect(() => {
    loadUserData();
    
    // ✅ OPTIMIZATION: Prefetch immediately if no cache exists!
    const cache = dataPrefetchService.getCache();
    
    if (!cache) {
      console.log('📦 [HOME] No cache available - STARTING PREFETCH NOW!');
      // Start prefetch immediately (don't wait for login animation)
      dataPrefetchService.prefetchAll().then(() => {
        console.log('✅ [HOME] Prefetch completed from home screen!');
      }).catch(err => {
        console.warn('[HOME] Prefetch failed:', err);
      });
    } else {
      // Cache exists - check if stale and refresh in background
      const cacheAge = dataPrefetchService.getCacheAge();
      const cacheAgeSeconds = Math.floor(cacheAge / 1000);
      console.log(`📊 [HOME] Cache age: ${cacheAgeSeconds}s`);
      
      if (!dataPrefetchService.isCacheFresh()) {
        console.log('🔄 [HOME] Cache is stale, refreshing in background...');
        dataPrefetchService.prefetchAll().catch(err => {
          console.warn('[HOME] Background cache refresh failed:', err);
        });
      } else {
        console.log('✅ [HOME] Cache is fresh, no refresh needed');
      }
    }
  }, []);

  const loadUserData = async () => {
    // ✅ OPTIMIZATION: Load user data synchronously (no await needed)
    setUser({ name: 'GameOn', location: 'Hyderabad, India' });
    setNotifications(0); // Notifications disabled
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={homeStyles.container} edges={['left', 'right', 'bottom']}>
        {/* Disable Expo Router default header */}
        <Stack.Screen options={{ headerShown: false }} />

      <AppHeader 
        title={user?.name ?? 'GameOn'} 
        subtitle="Sports Hub"
      >
        {/* Header content with location and icons */}
        <View style={{ marginTop: spacing.sm }}>
          <Text style={homeTextStyles.headerLocation}>{user?.location ?? ''}</Text>
        </View>
        
        {/* Right side icons positioned absolutely */}
        <View style={homeStyles.headerRightSection}>
          <TouchableOpacity 
            style={homeStyles.notificationIconContainer}
            onPress={() => router.push('/role-selection')}
          >
            <Ionicons name="swap-horizontal" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={homeStyles.notificationIconContainer}
            onPress={() => router.push('/NotificationsScreen')}
          >
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            {/* Notification badge, show only if there are notifications */}
            {notifications > 0 && <View style={homeStyles.notificationBadge} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={homeStyles.profileIconContainer}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </AppHeader>

      {/* Body Content */}
      <View style={homeStyles.body}>
        <Text style={homeTextStyles.sectionTitle}>Quick Actions</Text>
        <View style={homeStyles.quickActionsRow}>
          <TouchableOpacity 
            style={[homeStyles.quickActionCard, homeStyles.quickBookCard]} 
            onPress={() => router.push('/(tabs)/courts')}
          >
            <Text style={homeTextStyles.quickActionTitle}>Quick Book</Text>
            <Text style={homeTextStyles.quickActionSubtitle}>Book a court</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[homeStyles.quickActionCard, homeStyles.joinGameCard]} 
            onPress={() => router.push('/(tabs)/courts')}
          >
            <Text style={homeTextStyles.quickActionTitle}>Join Game</Text>
            <Text style={homeTextStyles.quickActionSubtitle}>Join existing games</Text>
          </TouchableOpacity>
        </View>

        {/* "Your Upcoming Games" section removed */}
      </View>
    </SafeAreaView>
    </ErrorBoundary>
  );
}
