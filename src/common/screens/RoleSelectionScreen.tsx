import AppHeader from '@/src/common/components/AppHeader';
import {
  roleSelectionStyles,
  roleSelectionTextStyles
} from '@/styles/screens/RoleSelectionScreen';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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
        router.push('/client/dashboard');
        break;
      case 'admin':
        router.push('/admin/dashboard');
        break;
    }
  };

  const RoleCard = ({ option }: { option: RoleOption }) => (
    <TouchableOpacity
      style={[
        roleSelectionStyles.roleCard,
        selectedRole === option.role && roleSelectionStyles.selectedCard
      ]}
      onPress={() => handleRoleSelect(option.role)}
      activeOpacity={0.7}
    >
      <View style={[roleSelectionStyles.iconContainer, { backgroundColor: option.color + '20' }]}>
        <Ionicons name={option.icon} size={32} color={option.color} />
      </View>
      
      <View style={roleSelectionStyles.roleContent}>
        <Text style={roleSelectionStyles.roleTitle}>{option.title}</Text>
        <Text style={roleSelectionStyles.roleDescription}>{option.description}</Text>
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={24} 
        color={selectedRole === option.role ? option.color : '#6B7280'} 
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={roleSelectionStyles.container} edges={['left', 'right', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Welcome to GameOn"
        subtitle="Choose your role to get started"
      />

      <View style={roleSelectionStyles.rolesContainer}>
        {roleOptions.map((option) => (
          <RoleCard key={option.role} option={option} />
        ))}
      </View>

      <View style={roleSelectionStyles.footer}>
        <Text style={roleSelectionStyles.footerText}>
          You can change your role anytime in the settings
        </Text>
      </View>
    </SafeAreaView>
  );
}
