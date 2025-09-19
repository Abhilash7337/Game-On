import { AdminService } from '@/src/admin/services/adminApi';
import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { User, Venue } from '@/src/common/types';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    totalBookings: 0,
    revenue: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentVenues, setRecentVenues] = useState<Venue[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load overview stats
      const statsResponse = await AdminService.getOverviewStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Load recent users
      const usersResponse = await AdminService.getRecentUsers();
      if (usersResponse.success && usersResponse.data) {
        setRecentUsers(usersResponse.data);
      }

      // Load recent venues
      const venuesResponse = await AdminService.getRecentVenues();
      if (venuesResponse.success && venuesResponse.data) {
        setRecentVenues(venuesResponse.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = colors.primary }: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const UserItem = ({ user }: { user: User }) => (
    <View style={styles.listItem}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{user.name}</Text>
        <Text style={styles.itemSubtitle}>{user.email}</Text>
        <Text style={styles.itemRole}>{user.role.toUpperCase()}</Text>
      </View>
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const VenueItem = ({ venue }: { venue: Venue }) => (
    <View style={styles.listItem}>
      <View style={[styles.venueIcon, { backgroundColor: venue.isActive ? colors.success + '20' : colors.error + '20' }]}>
        <Ionicons 
          name="location" 
          size={20} 
          color={venue.isActive ? colors.success : colors.error} 
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{venue.name}</Text>
        <Text style={styles.itemSubtitle}>{venue.address}</Text>
        <Text style={styles.itemRole}>{venue.courts.length} courts</Text>
      </View>
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Admin Dashboard"
        subtitle="System overview and management"
      >
        {/* Notification button positioned absolutely in top right */}
        <TouchableOpacity style={styles.headerNotificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </AppHeader>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon="people-outline"
            color={colors.primary}
          />
          <StatCard
            title="Active Venues"
            value={stats.totalVenues.toLocaleString()}
            icon="location-outline"
            color={colors.secondary}
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings.toLocaleString()}
            icon="calendar-outline"
            color={colors.info}
          />
          <StatCard
            title="Platform Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            icon="cash-outline"
            color={colors.success}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              title="Manage Users"
              onPress={() => Alert.alert('Users', 'User management functionality coming soon!')}
              variant="primary"
              style={styles.actionButtonWide}
            />
            <Button
              title="Venue Approvals"
              onPress={() => Alert.alert('Venues', 'Venue approval functionality coming soon!')}
              variant="outline"
              style={styles.actionButtonWide}
            />
          </View>
          <View style={styles.quickActions}>
            <Button
              title="System Reports"
              onPress={() => Alert.alert('Reports', 'System reports functionality coming soon!')}
              variant="secondary"
              style={styles.actionButtonWide}
            />
            <Button
              title="Settings"
              onPress={() => Alert.alert('Settings', 'Admin settings functionality coming soon!')}
              variant="outline"
              style={styles.actionButtonWide}
            />
          </View>
        </View>

        {/* Recent Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity onPress={() => Alert.alert('Users', 'View all users functionality coming soon!')}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No recent users</Text>
            </View>
          ) : (
            recentUsers.map((user) => (
              <UserItem key={user.id} user={user} />
            ))
          )}
        </View>

        {/* Recent Venues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Venues</Text>
            <TouchableOpacity onPress={() => Alert.alert('Venues', 'View all venues functionality coming soon!')}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentVenues.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No recent venues</Text>
            </View>
          ) : (
            recentVenues.map((venue) => (
              <VenueItem key={venue.id} venue={venue} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  headerBackButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 8,
    zIndex: 10,
  },
  headerNotificationButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
    zIndex: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButtonWide: {
    flex: 1,
  },
  listItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.textInverse,
    fontWeight: 'bold',
    fontSize: 16,
  },
  venueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  itemRole: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textTertiary,
    marginTop: 12,
  },
});
