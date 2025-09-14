import { colors, spacing, typography } from '@/styles/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
      styles.header, 
      { 
        paddingTop: insets.top + 20,
        backgroundColor: backgroundColor || colors.primary 
      }
    ]}>
      <View style={styles.headerContent}>
        <View style={styles.titleSection}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          )}
        </View>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: spacing.xxxl,
    borderBottomRightRadius: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  
  headerContent: {
    width: '100%',
  },
  
  titleSection: {
    width: '100%',
  },
  
  headerTitle: {
    color: colors.textInverse,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  
  headerSubtitle: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
  },
});