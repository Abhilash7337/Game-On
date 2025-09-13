
import React, { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HomeScreen() {
  const router = useRouter();
  // Simulate backend data for user, location, notifications, and upcoming games
  const [user, setUser] = useState<{ name: string; location: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const [upcomingGames, setUpcomingGames] = useState<Array<{ id: string; title: string; date: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data from backend
    setTimeout(() => {
      setUser({ name: 'GameOn', location: 'Hyderabad, India' });
      setNotifications(2); // Example: 2 notifications
      setUpcomingGames([
        // Example: [] for no games, or add objects for games
        // { id: '1', title: 'Badminton at Mahindra Court', date: '2025-08-30 18:00' },
      ]);
      setLoading(false);
    }, 700);
  }, []);

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
        <View style={styles.upcomingGamesCard}>
          {upcomingGames.length === 0 ? (
            <Text style={styles.upcomingGamesText}>
              No upcoming games. Join a game to get started!
            </Text>
          ) : (
            upcomingGames.map(game => (
              <Text key={game.id} style={styles.upcomingGamesText}>
                {game.title} - {game.date}
              </Text>
            ))
          )}
        </View>
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
});
