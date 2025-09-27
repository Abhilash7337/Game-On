import { AdminService } from '@/src/admin/services/adminApi';
import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { User, Venue } from '@/src/common/types';
import {
    buttonStyles,
    cardStyles,
    adminDashboardStyles,
    adminDashboardTextStyles
} from '@/styles/screens/AdminDashboardScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
    <View style={adminDashboardStyles.statCard}>
      <View style={[adminDashboardStyles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={adminDashboardStyles.statValue}>{value}</Text>
      <Text style={adminDashboardStyles.statTitle}>{title}</Text>
    </View>
  );

  const UserItem = ({ user }: { user: User }) => (
    <View style={adminDashboardStyles.listItem}>
      <View style={adminDashboardStyles.userAvatar}>
        <Text style={adminDashboardStyles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={adminDashboardStyles.itemContent}>
        <Text style={adminDashboardStyles.itemTitle}>{user.name}</Text>
        <Text style={adminDashboardStyles.itemSubtitle}>{user.email}</Text>
        <Text style={adminDashboardStyles.itemRole}>{user.role.toUpperCase()}</Text>
      </View>
      <TouchableOpacity style={adminDashboardStyles.actionButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const VenueItem = ({ venue }: { venue: Venue }) => (
    <View style={adminDashboardStyles.listItem}>
      <View style={[adminDashboardStyles.venueIcon, { backgroundColor: venue.isActive ? colors.success + '20' : colors.error + '20' }]}>
        <Ionicons 
          name="location" 
          size={20} 
          color={venue.isActive ? colors.success : colors.error} 
        />
      </View>
      <View style={adminDashboardStyles.itemContent}>
        <Text style={adminDashboardStyles.itemTitle}>{venue.name}</Text>
        <Text style={adminDashboardStyles.itemSubtitle}>{venue.address}</Text>
        <Text style={adminDashboardStyles.itemRole}>{venue.courts.length} courts</Text>
      </View>
      <TouchableOpacity style={adminDashboardStyles.actionButton}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={adminDashboardStyles.container} edges={['left', 'right', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Admin Dashboard"
        subtitle="System overview and management"
      >
        {/* Notification button positioned absolutely in top right */}
        <TouchableOpacity style={adminDashboardStyles.headerNotificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </AppHeader>

      <ScrollView style={adminDashboardStyles.content} showsVerticalScrollIndicator={false}>

        {/* Stats Overview */}
        <View style={adminDashboardStyles.statsContainer}>
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
        <View style={adminDashboardStyles.section}>
          <Text style={adminDashboardStyles.sectionTitle}>Quick Actions</Text>
          <View style={adminDashboardStyles.quickActions}>
            <Button
              title="Manage Users"
              onPress={() => Alert.alert('Users', 'User management functionality coming soon!')}
              variant="primary"
              style={adminDashboardStyles.actionButtonWide}
            />
            <Button
              title="Venue Approvals"
              onPress={() => Alert.alert('Venues', 'Venue approval functionality coming soon!')}
              variant="outline"
              style={adminDashboardStyles.actionButtonWide}
            />
          </View>
          <View style={adminDashboardStyles.quickActions}>
            <Button
              title="System Reports"
              onPress={() => Alert.alert('Reports', 'System reports functionality coming soon!')}
              variant="secondary"
              style={adminDashboardStyles.actionButtonWide}
            />
            <Button
              title="Settings"
              onPress={() => Alert.alert('Settings', 'Admin settings functionality coming soon!')}
              variant="outline"
              style={adminDashboardStyles.actionButtonWide}
            />
          </View>
        </View>

        {/* Recent Users */}
        <View style={adminDashboardStyles.section}>
          <View style={adminDashboardStyles.sectionHeader}>
            <Text style={adminDashboardStyles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity onPress={() => Alert.alert('Users', 'View all users functionality coming soon!')}>
              <Text style={adminDashboardStyles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentUsers.length === 0 ? (
            <View style={adminDashboardStyles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
              <Text style={adminDashboardStyles.emptyText}>No recent users</Text>
            </View>
          ) : (
            recentUsers.map((user) => (
              <UserItem key={user.id} user={user} />
            ))
          )}
        </View>

        {/* Recent Venues */}
        <View style={adminDashboardStyles.section}>
          <View style={adminDashboardStyles.sectionHeader}>
            <Text style={adminDashboardStyles.sectionTitle}>Recent Venues</Text>
            <TouchableOpacity onPress={() => Alert.alert('Venues', 'View all venues functionality coming soon!')}>
              <Text style={adminDashboardStyles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentVenues.length === 0 ? (
            <View style={adminDashboardStyles.emptyState}>
              <Ionicons name="location-outline" size={48} color={colors.textTertiary} />
              <Text style={adminDashboardStyles.emptyText}>No recent venues</Text>
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