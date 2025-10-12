import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { ClientService } from '@/src/client/services/clientApi';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientProfileStyles } from '@/styles/screens/ClientProfileScreen';

interface ClientProfile {
  id: string;
  name: string;
  email: string;
  businessName: string;
  phone: string;
  address: string;
  isVerified: boolean;
  memberSince: Date;
  totalVenues: number;
  totalBookings: number;
  averageRating: number;
}

export default function ClientProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await ClientService.getProfile();
      if (response.success && response.data) {
        // Transform user data to client profile format
        setProfile({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          businessName: 'Demo Business', // This would come from client-specific data
          phone: response.data.phone,
          address: response.data.location || 'Not provided',
          isVerified: true,
          memberSince: response.data.createdAt,
          totalVenues: 0, // This would come from venue count
          totalBookings: 0, // This would come from booking count
          averageRating: 4.5, // This would come from venue ratings
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/client/EditProfileScreen');
  };

  const handleChangePassword = () => {
    router.push('/client/ChangePasswordScreen');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement logout logic
            router.push('/role-selection');
          }
        }
      ]
    );
  };

  const ProfileStatCard = ({ 
    title, 
    value, 
    icon, 
    color = colors.primary 
  }: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
  }) => (
    <View style={clientProfileStyles.statCard}>
      <View style={[clientProfileStyles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={clientProfileStyles.statValue}>{value}</Text>
      <Text style={clientProfileStyles.statTitle}>{title}</Text>
    </View>
  );

  const MenuItem = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    showArrow = true 
  }: {
    title: string;
    subtitle?: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={clientProfileStyles.menuItem} onPress={onPress}>
      <View style={clientProfileStyles.menuItemLeft}>
        <View style={clientProfileStyles.menuIcon}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <View style={clientProfileStyles.menuContent}>
          <Text style={clientProfileStyles.menuTitle}>{title}</Text>
          {subtitle && <Text style={clientProfileStyles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  if (loading || !profile) {
    return (
      <SafeAreaView style={clientProfileStyles.container} edges={['left', 'right', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="Profile" subtitle="Your business profile" />
        <View style={clientProfileStyles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={clientProfileStyles.container} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Profile"
        subtitle="Manage your business profile"
      />

      <ScrollView style={clientProfileStyles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={clientProfileStyles.profileHeader}>
          <View style={clientProfileStyles.avatarContainer}>
            <View style={clientProfileStyles.avatar}>
              <Text style={clientProfileStyles.avatarText}>
                {profile.businessName.charAt(0).toUpperCase()}
              </Text>
            </View>
            {profile.isVerified && (
              <View style={clientProfileStyles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>
          <Text style={clientProfileStyles.businessName}>{profile.businessName}</Text>
          <Text style={clientProfileStyles.ownerName}>{profile.name}</Text>
          <Text style={clientProfileStyles.email}>{profile.email}</Text>
          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            variant="outline"
            style={clientProfileStyles.editButton}
          />
        </View>

        {/* Business Stats */}
        <View style={clientProfileStyles.section}>
          <Text style={clientProfileStyles.sectionTitle}>Business Overview</Text>
          <View style={clientProfileStyles.statsGrid}>
            <ProfileStatCard
              title="Venues"
              value={profile.totalVenues.toString()}
              icon="location-outline"
              color={colors.primary}
            />
            <ProfileStatCard
              title="Bookings"
              value={profile.totalBookings.toString()}
              icon="calendar-outline"
              color={colors.success}
            />
            <ProfileStatCard
              title="Rating"
              value={profile.averageRating.toFixed(1)}
              icon="star-outline"
              color={colors.warning}
            />
            <ProfileStatCard
              title="Member Since"
              value={new Date(profile.memberSince).getFullYear().toString()}
              icon="time-outline"
              color={colors.info}
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={clientProfileStyles.section}>
          <Text style={clientProfileStyles.sectionTitle}>Account Settings</Text>
          <View style={clientProfileStyles.menuContainer}>
            <MenuItem
              title="Personal Information"
              subtitle="Update your personal details"
              icon="person-outline"
              onPress={handleEditProfile}
            />
            <MenuItem
              title="Business Information"
              subtitle="Update business details"
              icon="business-outline"
              onPress={() => router.push('/client/BusinessInfoScreen')}
            />
            <MenuItem
              title="Change Password"
              subtitle="Update your password"
              icon="lock-closed-outline"
              onPress={handleChangePassword}
            />
            <MenuItem
              title="Payment Methods"
              subtitle="Manage payment settings"
              icon="card-outline"
              onPress={() => router.push('/client/PaymentMethodsScreen')}
            />
          </View>
        </View>

        {/* Business Management */}
        <View style={clientProfileStyles.section}>
          <Text style={clientProfileStyles.sectionTitle}>Business Management</Text>
          <View style={clientProfileStyles.menuContainer}>
            <MenuItem
              title="Venue Management"
              subtitle="Manage your venues"
              icon="location-outline"
              onPress={() => router.push('/client/VenueManagementScreen')}
            />
            <MenuItem
              title="Booking Management"
              subtitle="View and manage bookings"
              icon="calendar-outline"
              onPress={() => router.push('/client/BookingManagementScreen')}
            />
            <MenuItem
              title="Analytics & Reports"
              subtitle="View business analytics"
              icon="analytics-outline"
              onPress={() => router.push('/client/AnalyticsScreen')}
            />
            <MenuItem
              title="Reviews & Ratings"
              subtitle="Manage customer reviews"
              icon="star-outline"
              onPress={() => router.push('/client/ReviewsScreen')}
            />
          </View>
        </View>

        {/* Support & Help */}
        <View style={clientProfileStyles.section}>
          <Text style={clientProfileStyles.sectionTitle}>Support & Help</Text>
          <View style={clientProfileStyles.menuContainer}>
            <MenuItem
              title="Help Center"
              subtitle="Get help and support"
              icon="help-circle-outline"
              onPress={() => router.push('/client/HelpScreen')}
            />
            <MenuItem
              title="Contact Support"
              subtitle="Get in touch with our team"
              icon="mail-outline"
              onPress={() => router.push('/client/ContactSupportScreen')}
            />
            <MenuItem
              title="Terms & Conditions"
              subtitle="Read our terms"
              icon="document-text-outline"
              onPress={() => router.push('/client/TermsScreen')}
            />
            <MenuItem
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              icon="shield-checkmark-outline"
              onPress={() => router.push('/client/PrivacyScreen')}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={clientProfileStyles.section}>
          <TouchableOpacity style={clientProfileStyles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={clientProfileStyles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
