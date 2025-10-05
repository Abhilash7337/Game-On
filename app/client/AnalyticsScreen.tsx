import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Venue } from '@/src/common/types';
import { ClientService } from '@/src/client/services/clientApi';
import {
  analyticsStyles,
  analyticsTextStyles
} from '@/styles/screens/AnalyticsScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  topVenue: string;
  revenueGrowth: number;
  bookingGrowth: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  hourlyBookings: Array<{ hour: string; bookings: number }>;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalyticsData();
    loadVenues();
  }, [selectedVenue, timeRange]);

  const loadVenues = async () => {
    try {
      const response = await ClientService.getClientVenues();
      if (response.success && response.data) {
        setVenues(response.data);
      }
    } catch (error) {
      console.error('Failed to load venues:', error);
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock analytics data - in real app, this would come from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAnalytics: AnalyticsData = {
        totalRevenue: 45600,
        totalBookings: 234,
        averageBookingValue: 195,
        topVenue: 'My Sports Center',
        revenueGrowth: 15.2,
        bookingGrowth: 8.7,
        monthlyRevenue: [
          { month: 'Jan', revenue: 3200 },
          { month: 'Feb', revenue: 3800 },
          { month: 'Mar', revenue: 4200 },
          { month: 'Apr', revenue: 4500 },
          { month: 'May', revenue: 4800 },
          { month: 'Jun', revenue: 5200 },
        ],
        hourlyBookings: [
          { hour: '6AM', bookings: 5 },
          { hour: '8AM', bookings: 12 },
          { hour: '10AM', bookings: 18 },
          { hour: '12PM', bookings: 25 },
          { hour: '2PM', bookings: 22 },
          { hour: '4PM', bookings: 28 },
          { hour: '6PM', bookings: 35 },
          { hour: '8PM', bookings: 20 },
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, change, color = colors.primary }: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    change?: string;
    color?: string;
  }) => (
    <View style={analyticsStyles.statCard}>
      <View style={analyticsStyles.statHeader}>
        <View style={[analyticsStyles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {change && (
          <Text style={[analyticsStyles.changeText, { color: change.startsWith('+') ? colors.success : colors.error }]}>
            {change}
          </Text>
        )}
      </View>
      <Text style={analyticsStyles.statValue}>{value}</Text>
      <Text style={analyticsStyles.statTitle}>{title}</Text>
    </View>
  );

  const VenueFilter = () => (
    <View style={analyticsStyles.filterContainer}>
      <Text style={analyticsStyles.filterLabel}>Filter by Venue:</Text>
      <View style={analyticsStyles.filterRow}>
        <TouchableOpacity
          style={[
            analyticsStyles.filterChip,
            selectedVenue === 'all' && analyticsStyles.filterChipSelected
          ]}
          onPress={() => setSelectedVenue('all')}
        >
          <Text style={[
            analyticsStyles.filterChipText,
            selectedVenue === 'all' && analyticsStyles.filterChipTextSelected
          ]}>
            All Venues
          </Text>
        </TouchableOpacity>
        {venues.map((venue) => (
          <TouchableOpacity
            key={venue.id}
            style={[
              analyticsStyles.filterChip,
              selectedVenue === venue.id && analyticsStyles.filterChipSelected
            ]}
            onPress={() => setSelectedVenue(venue.id)}
          >
            <Text style={[
              analyticsStyles.filterChipText,
              selectedVenue === venue.id && analyticsStyles.filterChipTextSelected
            ]}>
              {venue.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const TimeRangeFilter = () => (
    <View style={analyticsStyles.filterContainer}>
      <Text style={analyticsStyles.filterLabel}>Time Range:</Text>
      <View style={analyticsStyles.filterRow}>
        {(['week', 'month', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              analyticsStyles.filterChip,
              timeRange === range && analyticsStyles.filterChipSelected
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              analyticsStyles.filterChipText,
              timeRange === range && analyticsStyles.filterChipTextSelected
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={analyticsStyles.container} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader 
          title="Analytics"
          subtitle="Revenue and booking insights"
        />
        <View style={analyticsStyles.loadingContainer}>
          <Text style={analyticsStyles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={analyticsStyles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Analytics"
        subtitle="Revenue and booking insights"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </AppHeader>

      <ScrollView style={analyticsStyles.content} showsVerticalScrollIndicator={false}>
        {/* Filters */}
        <VenueFilter />
        <TimeRangeFilter />

        {/* Key Metrics */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Key Metrics</Text>
          <View style={analyticsStyles.statsGrid}>
            <StatCard
              title="Total Revenue"
              value={`₹${analytics?.totalRevenue.toLocaleString()}`}
              icon="cash-outline"
              change={`+${analytics?.revenueGrowth}%`}
              color={colors.success}
            />
            <StatCard
              title="Total Bookings"
              value={analytics?.totalBookings.toString() || '0'}
              icon="calendar-outline"
              change={`+${analytics?.bookingGrowth}%`}
              color={colors.primary}
            />
            <StatCard
              title="Avg Booking Value"
              value={`₹${analytics?.averageBookingValue}`}
              icon="trending-up-outline"
              color={colors.secondary}
            />
            <StatCard
              title="Top Venue"
              value={analytics?.topVenue || 'N/A'}
              icon="location-outline"
              color={colors.info}
            />
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Revenue Trend</Text>
          <View style={analyticsStyles.chartContainer}>
            {analytics?.monthlyRevenue.map((item, index) => (
              <View key={index} style={analyticsStyles.chartBar}>
                <View 
                  style={[
                    analyticsStyles.chartBarFill,
                    { height: (item.revenue / 6000) * 100 }
                  ]}
                />
                <Text style={analyticsStyles.chartLabel}>{item.month}</Text>
                <Text style={analyticsStyles.chartValue}>₹{item.revenue}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Peak Hours */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Peak Booking Hours</Text>
          <View style={analyticsStyles.hourlyContainer}>
            {analytics?.hourlyBookings.map((item, index) => (
              <View key={index} style={analyticsStyles.hourlyItem}>
                <Text style={analyticsStyles.hourlyLabel}>{item.hour}</Text>
                <View style={analyticsStyles.hourlyBarContainer}>
                  <View 
                    style={[
                      analyticsStyles.hourlyBar,
                      { width: `${(item.bookings / 40) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={analyticsStyles.hourlyValue}>{item.bookings}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Quick Actions</Text>
          <View style={analyticsStyles.actionsContainer}>
            <Button
              title="Export Report"
              onPress={() => Alert.alert('Export', 'Export functionality coming soon!')}
              variant="outline"
              style={analyticsStyles.actionButton}
            />
            <Button
              title="Detailed Analytics"
              onPress={() => Alert.alert('Details', 'Detailed analytics coming soon!')}
              variant="primary"
              style={analyticsStyles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
