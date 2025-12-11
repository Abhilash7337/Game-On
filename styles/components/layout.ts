import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 180,
  },
  
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  
  timePickerContainer: {
    flex: 1,
  },
  
  gameOptionsContainer: {
    marginTop: spacing.lg,
  },
  
  gameOptionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  
  gameOptionContainer: {
    flex: 1,
  },
  
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});

export const textStyles = StyleSheet.create({
  label: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  
  subLabel: {
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  
  summaryTitle: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.md,
    color: colors.primary,
  },
  
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  summaryValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
    textAlign: 'right',
  },
  
  priceLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  
  priceValue: {
    color: colors.secondary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});

export const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});