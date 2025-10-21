import { colors } from '@/styles/theme';
import { appHeaderStyles } from '@/styles/components/AppHeader';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export default function AppHeader({ 
  title, 
  subtitle, 
  backgroundColor,
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
        <View style={appHeaderStyles.titleSection}>
          <Text style={appHeaderStyles.headerTitle}>{title}</Text>
          {subtitle && (
            <Text style={appHeaderStyles.headerSubtitle}>{subtitle}</Text>
          )}
        </View>
        {children}
      </View>
    </View>
  );
}
