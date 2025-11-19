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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  titleSection: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
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

  headerLocation: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
});
