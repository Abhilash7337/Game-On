import AppHeader from '@/src/common/components/AppHeader';
import { colors, spacing } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type UserRole = 'user' | 'client' | 'admin';

interface RoleOption {
  role: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'user',
    title: 'Player',
    description: 'Book courts, join games, and connect with other players',
    icon: 'person',
    color: '#2563eb'
  },
  {
    role: 'client',
    title: 'Venue Owner',
    description: 'Manage your venue, courts, and bookings',
    icon: 'business',
    color: '#7c3aed'
  },
  {
    role: 'admin',
    title: 'Administrator',
    description: 'System administration and platform management',
    icon: 'settings',
    color: '#dc2626'
  }
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    
    // Store the selected role (you might want to use AsyncStorage or context)
    // For now, we'll just navigate based on the role
    switch (role) {
      case 'user':
        router.push('/(tabs)');
        break;
      case 'client':
        router.push('/client/ClientNavigationScreen');
        break;
      case 'admin':
        router.push('/admin/dashboard');
        break;
    }
  };

  const RoleCard = ({ option }: { option: RoleOption }) => (
    <TouchableOpacity
      style={[
        styles.roleCard,
        selectedRole === option.role && styles.selectedCard
      ]}
      onPress={() => handleRoleSelect(option.role)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
        <Ionicons name={option.icon} size={32} color={option.color} />
      </View>
      
      <View style={styles.roleContent}>
        <Text style={styles.roleTitle}>{option.title}</Text>
        <Text style={styles.roleDescription}>{option.description}</Text>
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={24} 
        color={selectedRole === option.role ? option.color : colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Welcome to GameOn"
        subtitle="Choose your role to get started"
      />

      <View style={styles.rolesContainer}>
        {roleOptions.map((option) => (
          <RoleCard key={option.role} option={option} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can change your role anytime in the settings
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  rolesContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});