import { appHeaderStyles } from '@/styles/components/AppHeader';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  children?: React.ReactNode;
}

export default function AppHeader({ 
  title, 
  subtitle, 
  backgroundColor,
  showBackButton = false,
  onBackPress,
  children 
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      appHeaderStyles.header, 
      { 
        paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 20),
        backgroundColor: backgroundColor || colors.primary 
      }
    ]}>
      <View style={appHeaderStyles.headerContent}>
        {showBackButton && (
          <TouchableOpacity 
            style={appHeaderStyles.backButton} 
            onPress={onBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={[appHeaderStyles.titleSection, showBackButton && { marginLeft: 8 }]}>
          <Text style={appHeaderStyles.headerTitle}>{title}</Text>
          {subtitle && (
            <Text style={appHeaderStyles.headerSubtitle}>{subtitle}</Text>
          )}
        </View>
        {children && <View style={appHeaderStyles.rightSection}>{children}</View>}
      </View>
    </View>
  );
}
