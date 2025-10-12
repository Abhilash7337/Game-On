import AppHeader from '@/src/common/components/AppHeader';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientNavigationStyles } from '@/styles/screens/ClientNavigationScreen';

export default function ClientNavigationScreen() {
  const router = useRouter();

  const navigationItems = [
    {
      title: 'Dashboard',
      subtitle: 'Overview and quick stats',
      icon: 'grid-outline',
      route: '/client/dashboard',
      color: colors.primary,
    },
    {
      title: 'Venue Management',
      subtitle: 'Manage your venues and courts',
      icon: 'location-outline',
      route: '/client/VenueManagementScreen',
      color: colors.success,
    },
    {
      title: 'Booking Management',
      subtitle: 'View and manage all bookings',
      icon: 'calendar-outline',
      route: '/client/BookingManagementScreen',
      color: colors.info,
    },
    {
      title: 'Booking Requests',
      subtitle: 'Pending approval requests',
      icon: 'time-outline',
      route: '/client/BookingRequestsScreen',
      color: colors.warning,
    },
    {
      title: 'Analytics',
      subtitle: 'Business insights and reports',
      icon: 'analytics-outline',
      route: '/client/AnalyticsScreen',
      color: colors.secondary,
    },
    {
      title: 'Profile',
      subtitle: 'Account and business settings',
      icon: 'person-outline',
      route: '/client/ProfileScreen',
      color: colors.textSecondary,
    },
  ];

  const NavigationCard = ({ item }: { item: typeof navigationItems[0] }) => (
    <TouchableOpacity
      style={clientNavigationStyles.navigationCard}
      onPress={() => router.push(item.route as any)}
    >
      <View style={[clientNavigationStyles.cardIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <View style={clientNavigationStyles.cardContent}>
        <Text style={clientNavigationStyles.cardTitle}>{item.title}</Text>
        <Text style={clientNavigationStyles.cardSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={clientNavigationStyles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Client Portal"
        subtitle="Manage your business"
      />

      <ScrollView style={clientNavigationStyles.content} showsVerticalScrollIndicator={false}>
        <View style={clientNavigationStyles.welcomeSection}>
          <Text style={clientNavigationStyles.welcomeTitle}>Welcome to your Business Portal</Text>
          <Text style={clientNavigationStyles.welcomeText}>
            Manage your venues, bookings, and grow your business with our comprehensive tools.
          </Text>
        </View>

        <View style={clientNavigationStyles.section}>
          <Text style={clientNavigationStyles.sectionTitle}>Business Management</Text>
          <View style={clientNavigationStyles.navigationGrid}>
            {navigationItems.slice(0, 4).map((item, index) => (
              <NavigationCard key={index} item={item} />
            ))}
          </View>
        </View>

        <View style={clientNavigationStyles.section}>
          <Text style={clientNavigationStyles.sectionTitle}>Analytics & Settings</Text>
          <View style={clientNavigationStyles.navigationGrid}>
            {navigationItems.slice(4).map((item, index) => (
              <NavigationCard key={index + 4} item={item} />
            ))}
          </View>
        </View>

        <View style={clientNavigationStyles.quickActionsSection}>
          <Text style={clientNavigationStyles.sectionTitle}>Quick Actions</Text>
          <View style={clientNavigationStyles.quickActions}>
            <TouchableOpacity 
              style={clientNavigationStyles.quickActionButton}
              onPress={() => router.push('/add-venue')}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={clientNavigationStyles.quickActionText}>Add New Venue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={clientNavigationStyles.quickActionButton}
              onPress={() => router.push('/client/AnalyticsScreen')}
            >
              <Ionicons name="download" size={20} color={colors.primary} />
              <Text style={clientNavigationStyles.quickActionText}>Export Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
