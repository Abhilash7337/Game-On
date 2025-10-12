import AppHeader from '@/src/common/components/AppHeader';
import { ClientService } from '@/src/client/services/clientApi';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsStyles } from '@/styles/screens/AnalyticsScreen';

interface RevenueStats {
  today: number;
  thisMonth: number;
  growth: number;
}

interface BookingStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    today: 0,
    thisMonth: 0,
    growth: 0,
  });
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      // Load revenue stats
      const revenueResponse = await ClientService.getRevenueStats();
      if (revenueResponse.success && revenueResponse.data) {
        setRevenueStats(revenueResponse.data);
      }

      // Load booking stats
      const bookingResponse = await ClientService.getBookingStats();
      if (bookingResponse.success && bookingResponse.data) {
        setBookingStats(bookingResponse.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = colors.primary,
    subtitle,
    trend 
  }: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    subtitle?: string;
    trend?: string;
  }) => (
    <View style={analyticsStyles.statCard}>
      <View style={[analyticsStyles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={analyticsStyles.statContent}>
        <Text style={analyticsStyles.statValue}>{value}</Text>
        <Text style={analyticsStyles.statTitle}>{title}</Text>
        {subtitle && <Text style={analyticsStyles.statSubtitle}>{subtitle}</Text>}
        {trend && (
          <View style={analyticsStyles.trendContainer}>
            <Ionicons 
              name={trend.startsWith('+') ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={trend.startsWith('+') ? colors.success : colors.error} 
            />
            <Text style={[
              analyticsStyles.trendText,
              { color: trend.startsWith('+') ? colors.success : colors.error }
            ]}>
              {trend}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const ChartPlaceholder = ({ title, description }: { title: string; description: string }) => (
    <View style={analyticsStyles.chartCard}>
      <Text style={analyticsStyles.chartTitle}>{title}</Text>
      <View style={analyticsStyles.chartPlaceholder}>
        <Ionicons name="bar-chart-outline" size={48} color={colors.textTertiary} />
        <Text style={analyticsStyles.chartDescription}>{description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={analyticsStyles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Analytics"
        subtitle="Track your business performance"
      />

      <ScrollView style={analyticsStyles.content} showsVerticalScrollIndicator={false}>
        {/* Revenue Overview */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Revenue Overview</Text>
          <View style={analyticsStyles.statsGrid}>
            <StatCard
              title="Today's Revenue"
              value={`₹${revenueStats.today.toLocaleString()}`}
              icon="cash-outline"
              color={colors.success}
              subtitle="From all venues"
            />
            <StatCard
              title="Monthly Revenue"
              value={`₹${revenueStats.thisMonth.toLocaleString()}`}
              icon="calendar-outline"
              color={colors.primary}
              subtitle="This month"
              trend={`+${revenueStats.growth}%`}
            />
          </View>
        </View>

        {/* Booking Statistics */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Booking Statistics</Text>
          <View style={analyticsStyles.statsGrid}>
            <StatCard
              title="Total Bookings"
              value={bookingStats.totalBookings.toString()}
              icon="calendar-outline"
              color={colors.info}
              subtitle="All time"
            />
            <StatCard
              title="Completed"
              value={bookingStats.completedBookings.toString()}
              icon="checkmark-circle-outline"
              color={colors.success}
              subtitle={`${bookingStats.totalBookings > 0 ? 
                Math.round((bookingStats.completedBookings / bookingStats.totalBookings) * 100) : 0}% completion rate`}
            />
            <StatCard
              title="Cancelled"
              value={bookingStats.cancelledBookings.toString()}
              icon="close-circle-outline"
              color={colors.error}
              subtitle={`${bookingStats.totalBookings > 0 ? 
                Math.round((bookingStats.cancelledBookings / bookingStats.totalBookings) * 100) : 0}% cancellation rate`}
            />
            <StatCard
              title="Revenue"
              value={`₹${bookingStats.revenue.toLocaleString()}`}
              icon="trending-up-outline"
              color={colors.warning}
              subtitle="From bookings"
            />
          </View>
        </View>

        {/* Charts Section */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Performance Charts</Text>
          <ChartPlaceholder
            title="Revenue Trend"
            description="Track your revenue growth over time"
          />
          <ChartPlaceholder
            title="Booking Volume"
            description="Monitor booking patterns and peak hours"
          />
          <ChartPlaceholder
            title="Venue Performance"
            description="Compare performance across your venues"
          />
        </View>

        {/* Quick Actions */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Quick Actions</Text>
          <View style={analyticsStyles.actionButtons}>
            <TouchableOpacity style={analyticsStyles.actionButton}>
              <Ionicons name="download-outline" size={20} color={colors.primary} />
              <Text style={analyticsStyles.actionButtonText}>Export Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={analyticsStyles.actionButton}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
              <Text style={analyticsStyles.actionButtonText}>Email Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={analyticsStyles.actionButton}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
              <Text style={analyticsStyles.actionButtonText}>Report Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insights */}
        <View style={analyticsStyles.section}>
          <Text style={analyticsStyles.sectionTitle}>Business Insights</Text>
          <View style={analyticsStyles.insightsContainer}>
            <View style={analyticsStyles.insightCard}>
              <Ionicons name="bulb-outline" size={24} color={colors.warning} />
              <View style={analyticsStyles.insightContent}>
                <Text style={analyticsStyles.insightTitle}>Peak Hours</Text>
                <Text style={analyticsStyles.insightText}>
                  Most bookings occur between 6-8 PM on weekends
                </Text>
              </View>
            </View>
            <View style={analyticsStyles.insightCard}>
              <Ionicons name="trending-up-outline" size={24} color={colors.success} />
              <View style={analyticsStyles.insightContent}>
                <Text style={analyticsStyles.insightTitle}>Growth Opportunity</Text>
                <Text style={analyticsStyles.insightText}>
                  Consider adding more courts during peak hours
                </Text>
              </View>
            </View>
            <View style={analyticsStyles.insightCard}>
              <Ionicons name="people-outline" size={24} color={colors.info} />
              <View style={analyticsStyles.insightContent}>
                <Text style={analyticsStyles.insightTitle}>Customer Retention</Text>
                <Text style={analyticsStyles.insightText}>
                  Focus on repeat customers for steady revenue
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
