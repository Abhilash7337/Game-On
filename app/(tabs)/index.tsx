
import React, { useState, useEffect } from 'react';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingStore, Booking } from '@/utils/bookingStore';


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
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color="#047857" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.headerTitle}>{user?.name ?? ''}</Text>
            <Text style={styles.headerSubtitle}>Sports Hub</Text>
            <View style={{ height: 12 }} />
            <Text style={styles.headerLocation}>{user?.location ?? ''}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications-outline" size={26} color="#fff" />
              {/* Notification badge, show only if there are notifications */}
              {notifications > 0 && <View style={styles.notificationBadge} />}
            </View>
            <View style={styles.profileIconContainer}>
              <Ionicons name="person" size={28} color="#fff" />
            </View>
          </View>
        </View>
      </View>

      {/* Body Content */}
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickBookBtn} onPress={() => router.push('/QuickBookScreen')}>
            <Text style={styles.quickActionTitle}>Quick Book</Text>
            <Text style={styles.quickActionSubtitle}>Book a court</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinGameBtn} onPress={() => router.push('/JoinGamesScreen')}>
            <Text style={styles.quickActionTitle}>Join Game</Text>
            <Text style={styles.quickActionSubtitle}>Join existing games</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Your Upcoming Games</Text>
        
        {upcomingGames.length === 0 ? (
          <View style={styles.emptyGamesCard}>
            <View style={styles.emptyGamesIcon}>
              <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyGamesTitle}>No upcoming games</Text>
            <Text style={styles.emptyGamesText}>
              Book a court or join a game to get started!
            </Text>
            <TouchableOpacity 
              style={styles.emptyGamesButton}
              onPress={() => router.push('/QuickBookScreen')}
            >
              <Text style={styles.emptyGamesButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gamesScrollContainer}
          >
            {upcomingGames.map((game) => (
              <View key={game.id} style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                  <View style={styles.gameTypeContainer}>
                    <Ionicons 
                      name={getGameTypeIcon(game.bookingType)} 
                      size={16} 
                      color="#047857" 
                    />
                    <Text style={styles.gameType}>{game.bookingType}</Text>
                  </View>
                  <View style={styles.gamePriceTag}>
                    <Text style={styles.gamePrice}>₹{game.price}</Text>
                  </View>
                </View>
                
                <View style={styles.gameVenueContainer}>
                  <Ionicons name="location" size={18} color="#6B7280" />
                  <Text style={styles.gameVenue}>{game.venue}</Text>
                </View>
                
                <Text style={styles.gameCourt}>{game.court}</Text>
                
                <View style={styles.gameTimeContainer}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.gameTime}>{formatGameTime(game.date, game.time)}</Text>
                </View>
                
                <View style={styles.gameDurationContainer}>
                  <Ionicons name="hourglass" size={16} color="#6B7280" />
                  <Text style={styles.gameDuration}>{game.duration}</Text>
                </View>
                
                {game.bookingType === 'Open Game' && game.skillLevel && (
                  <View style={styles.gameSkillContainer}>
                    <View style={[
                      styles.skillBadge,
                      game.skillLevel === 'Beginner' && styles.skillBeginner,
                      game.skillLevel === 'Intermediate' && styles.skillIntermediate,
                      game.skillLevel === 'Advanced' && styles.skillAdvanced,
                    ]}>
                      <Text style={[
                        styles.skillText,
                        game.skillLevel === 'Beginner' && styles.skillTextBeginner,
                        game.skillLevel === 'Intermediate' && styles.skillTextIntermediate,
                        game.skillLevel === 'Advanced' && styles.skillTextAdvanced,
                      ]}>
                        {game.skillLevel}
                      </Text>
                    </View>
                    {game.players && (
                      <Text style={styles.playersNeeded}>{game.players} players needed</Text>
                    )}
                  </View>
                )}
                
                <TouchableOpacity style={styles.gameDetailsButton}>
                  <Text style={styles.gameDetailsButtonText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#047857" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notificationIconContainer: {
    marginRight: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA580C',
    borderWidth: 1,
    borderColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#047857',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 38,
    marginBottom: 12,
  },
  headerLocation: {
    color: '#D1FAE5',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 2,
  },
  profileIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: 8,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickBookBtn: {
    flex: 1,
    backgroundColor: '#EA580C',
    borderRadius: 16,
    marginRight: 8,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinGameBtn: {
    flex: 1,
    backgroundColor: '#047857',
    borderRadius: 16,
    marginLeft: 8,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
  },
  upcomingGamesCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 12,
  },
  upcomingGamesText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyGamesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyGamesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyGamesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyGamesText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyGamesButton: {
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyGamesButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gamesScrollContainer: {
    paddingLeft: 24,
    paddingRight: 12,
    paddingTop: 12,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gameType: {
    color: '#047857',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  gamePriceTag: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gamePrice: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameVenueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gameVenue: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  gameCourt: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  gameTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gameTime: {
    color: '#374151',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  gameDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameDuration: {
    color: '#374151',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  gameSkillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillBeginner: {
    backgroundColor: '#DCFCE7',
  },
  skillIntermediate: {
    backgroundColor: '#FEF3C7',
  },
  skillAdvanced: {
    backgroundColor: '#FEE2E2',
  },
  skillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  skillTextBeginner: {
    color: '#166534',
  },
  skillTextIntermediate: {
    color: '#B45309',
  },
  skillTextAdvanced: {
    color: '#991B1B',
  },
  playersNeeded: {
    color: '#6B7280',
    fontSize: 12,
  },
  gameDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
  },
  gameDetailsButtonText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
});
