
import AppHeader from '@/src/common/components/AppHeader';
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
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HomeScreen() {
  const router = useRouter();
  // Simulate backend data for user, location, notifications, and upcoming games
  const [user, setUser] = useState<{ name: string; location: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const [upcomingGames, setUpcomingGames] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data from backend
    setTimeout(() => {
      setUser({ name: 'GameOn', location: 'Hyderabad, India' });
      setNotifications(2); // Example: 2 notifications
      setLoading(false);
    }, 700);
  }, []);

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
      <SafeAreaView style={homeStyles.container} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color="#047857" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
      </SafeAreaView>
    );
  }

  return (
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
          <View style={homeStyles.notificationIconContainer}>
            <Ionicons name="notifications-outline" size={26} color="#fff" />
            {/* Notification badge, show only if there are notifications */}
            {notifications > 0 && <View style={homeStyles.notificationBadge} />}
          </View>
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
              <View key={game.id} style={homeStyles.gameCard}>
                <View style={homeStyles.gameCardContent}>
                  <View style={homeStyles.gameCardHeader}>
                    <View style={homeStyles.gameTypeContainer}>
                      <Ionicons 
                        name={getGameTypeIcon(game.bookingType)} 
                        size={14} 
                        color="#047857" 
                      />
                      <Text style={homeTextStyles.gameType}>{game.bookingType}</Text>
                    </View>
                    <View style={homeStyles.gamePriceTag}>
                      <Text style={homeTextStyles.gamePrice}>₹{game.price}</Text>
                    </View>
                  </View>
                  
                  <Text style={homeTextStyles.gameCourt}>{game.court}</Text>
                  <View style={homeStyles.gameVenueContainer}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={homeTextStyles.gameVenue}>{game.venue}</Text>
                  </View>
                  
                  <View style={homeStyles.gameTimeContainer}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={homeTextStyles.gameTime}>{formatGameTime(game.date, game.time)}</Text>
                    <Text style={homeTextStyles.gameDuration}>• {game.duration}</Text>
                  </View>
                  
                  {game.bookingType === 'Open Game' && game.skillLevel && (
                    <View style={homeStyles.gameSkillContainer}>
                      <View style={[
                        homeStyles.skillBadge,
                        game.skillLevel === 'Beginner' && homeStyles.skillBeginner,
                        game.skillLevel === 'Intermediate' && homeStyles.skillIntermediate,
                        game.skillLevel === 'Advanced' && homeStyles.skillAdvanced,
                      ]}>
                        <Text style={[
                          homeTextStyles.skillText,
                          game.skillLevel === 'Beginner' && homeTextStyles.skillTextBeginner,
                          game.skillLevel === 'Intermediate' && homeTextStyles.skillTextIntermediate,
                          game.skillLevel === 'Advanced' && homeTextStyles.skillTextAdvanced,
                        ]}>
                          {game.skillLevel}
                        </Text>
                      </View>
                      {game.players && (
                        <Text style={homeTextStyles.playersNeeded}>{game.players} needed</Text>
                      )}
                    </View>
                  )}
                </View>
                
                <TouchableOpacity style={homeStyles.gameDetailsButton}>
                  <Text style={homeTextStyles.gameDetailsButtonText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
