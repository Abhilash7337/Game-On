import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export const appHeaderStyles = StyleSheet.create({
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
