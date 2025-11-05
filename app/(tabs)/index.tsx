
import AppHeader from '@/src/common/components/AppHeader';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { LoadingState } from '@/src/common/components/LoadingState';
import {
    buttonStyles,
    homeStyles,
    homeTextStyles
} from '@/styles/screens/HomeScreen';
import { spacing } from '@/styles/theme';
import { Booking, bookingStore } from '@/utils/bookingStore';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HomeScreen() {
  const router = useRouter();
  // Simulate backend data for user, location, notifications, and upcoming games
  const [user, setUser] = useState<{ name: string; location: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const [upcomingGames, setUpcomingGames] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Simulate fetching user data
      setUser({ name: 'GameOn', location: 'Hyderabad, India' });
      
      // Load actual notification count
      const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
      const unreadCount = await ClientNotificationService.getUnreadCount(undefined, 'current-user');
      setNotifications(unreadCount);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setNotifications(0);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to booking updates
  useFocusEffect(
    React.useCallback(() => {
      const updateUpcomingGames = () => {
        setUpcomingGames(bookingStore.getUpcomingBookings());
      };
      
      updateUpcomingGames();
      const unsubscribe = bookingStore.subscribe(updateUpcomingGames);
      
      return unsubscribe;
    }, [])
  );

  const formatGameTime = (date: Date, time: string) => {
    const gameDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateStr = '';
    if (gameDate.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (gameDate.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = gameDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return `${dateStr} at ${time}`;
  };

  const getGameTypeIcon = (bookingType: string) => {
    return bookingType === 'Open Game' ? 'people' : 'lock-closed';
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <SafeAreaView style={homeStyles.container} edges={['left', 'right', 'bottom']}>
          <LoadingState message="Loading your dashboard..." />
        </SafeAreaView>
      </ErrorBoundary>
    );
  }

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
          <TouchableOpacity style={[homeStyles.quickActionCard, homeStyles.quickBookCard]} onPress={() => router.push('/QuickBookScreen')}>
            <Text style={homeTextStyles.quickActionTitle}>Quick Book</Text>
            <Text style={homeTextStyles.quickActionSubtitle}>Book a court</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[homeStyles.quickActionCard, homeStyles.joinGameCard]} onPress={() => router.push('/JoinGamesScreen')}>
            <Text style={homeTextStyles.quickActionTitle}>Join Game</Text>
            <Text style={homeTextStyles.quickActionSubtitle}>Join existing games</Text>
          </TouchableOpacity>
        </View>

        <Text style={[homeTextStyles.sectionTitle, { marginTop: 32 }]}>Your Upcoming Games</Text>
        
        {upcomingGames.length === 0 ? (
          <View style={homeStyles.emptyGamesCard}>
            <View style={homeStyles.emptyGamesIcon}>
              <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
            </View>
            <Text style={homeTextStyles.emptyGamesTitle}>No upcoming games</Text>
            <Text style={homeTextStyles.emptyGamesText}>
              Book a court or join a game to get started!
            </Text>
            <TouchableOpacity 
              style={buttonStyles.primary}
              onPress={() => router.push('/QuickBookScreen')}
            >
              <Text style={homeTextStyles.emptyGamesButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={homeStyles.gamesScrollContainer}
          >
            {upcomingGames.map((game) => (
              <TouchableOpacity 
                key={game.id} 
                style={homeStyles.gameCard}
                activeOpacity={0.8}
              >
                {/* Top Section: Venue Name & Type Badge */}
                <View style={homeStyles.gameCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={homeTextStyles.gameVenueName} numberOfLines={1}>
                      {game.venue}
                    </Text>
                    <Text style={homeTextStyles.gameCourtName} numberOfLines={1}>
                      {game.court}
                    </Text>
                  </View>
                  <View style={[
                    homeStyles.gameTypeBadge,
                    game.bookingType === 'Open Game' 
                      ? { backgroundColor: '#FEF3C7' } 
                      : { backgroundColor: '#DBEAFE' }
                  ]}>
                    <Ionicons 
                      name={getGameTypeIcon(game.bookingType)} 
                      size={12} 
                      color={game.bookingType === 'Open Game' ? '#D97706' : '#2563EB'}
                    />
                    <Text style={[
                      homeTextStyles.gameTypeBadgeText,
                      game.bookingType === 'Open Game' 
                        ? { color: '#D97706' } 
                        : { color: '#2563EB' }
                    ]}>
                      {game.bookingType === 'Open Game' ? 'Open' : 'Private'}
                    </Text>
                  </View>
                </View>

                {/* Divider Line */}
                <View style={homeStyles.gameCardDivider} />

                {/* Middle Section: Date, Time & Duration */}
                <View style={homeStyles.gameCardMiddle}>
                  <View style={homeStyles.gameInfoRow}>
                    <View style={homeStyles.gameInfoIconCircle}>
                      <Ionicons name="calendar" size={16} color="#047857" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={homeTextStyles.gameInfoLabel}>Date</Text>
                      <Text style={homeTextStyles.gameInfoValue}>
                        {formatGameTime(game.date, game.time).split(' at ')[0]}
                      </Text>
                    </View>
                  </View>

                  <View style={homeStyles.gameInfoRow}>
                    <View style={homeStyles.gameInfoIconCircle}>
                      <Ionicons name="time" size={16} color="#047857" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={homeTextStyles.gameInfoLabel}>Time</Text>
                      <Text style={homeTextStyles.gameInfoValue}>
                        {game.time} • {game.duration}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bottom Section: Price, Skill Level, Players */}
                <View style={homeStyles.gameCardBottom}>
                  <View style={homeStyles.gamePriceSection}>
                    <Text style={homeTextStyles.gamePriceLabel}>Total</Text>
                    <Text style={homeTextStyles.gamePriceAmount}>₹{game.price}</Text>
                  </View>

                  {game.bookingType === 'Open Game' && (
                    <View style={homeStyles.gameMetaSection}>
                      {game.skillLevel && (
                        <View style={[
                          homeStyles.skillChip,
                          game.skillLevel === 'Beginner' && { backgroundColor: '#D1FAE5', borderColor: '#10B981' },
                          game.skillLevel === 'Intermediate' && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
                          game.skillLevel === 'Advanced' && { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
                        ]}>
                          <Text style={[
                            homeTextStyles.skillChipText,
                            game.skillLevel === 'Beginner' && { color: '#047857' },
                            game.skillLevel === 'Intermediate' && { color: '#D97706' },
                            game.skillLevel === 'Advanced' && { color: '#DC2626' },
                          ]}>
                            {game.skillLevel}
                          </Text>
                        </View>
                      )}
                      {game.players && (
                        <View style={homeStyles.playersChip}>
                          <Ionicons name="people" size={12} color="#6B7280" />
                          <Text style={homeTextStyles.playersChipText}>
                            {game.players}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Action Button */}
                <TouchableOpacity style={homeStyles.gameActionButton}>
                  <Text style={homeTextStyles.gameActionButtonText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#047857" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
    </ErrorBoundary>
  );
}
