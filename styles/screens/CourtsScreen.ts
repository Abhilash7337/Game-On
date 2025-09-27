// CourtsScreen specific styles
import { buttonStyles, cardStyles } from '../components/common';
import { layoutStyles, textStyles } from '../components/layout';
import { headerStyles } from '../components/ui';

export { buttonStyles, cardStyles, headerStyles, layoutStyles, textStyles };

// CourtsScreen-specific styles
import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

export const courtsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  searchSection: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  searchInput: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radiusLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    marginRight: spacing.sm,
  },
  radiusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  radiusChipText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
  },
  venueCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xxl,
    ...shadows.md,
  },
  venueImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    resizeMode: 'cover',
  },
  venueInfo: {
    padding: spacing.lg,
  },
  venueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  venueName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  venueRating: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  venueLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  venueBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venuePrice: {
    fontSize: typography.fontSize.lg,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  bookBtn: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  bookBtnText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
});

export const courtsTextStyles = StyleSheet.create({
  // Add any text-specific styles here if needed
  // Most text styles should come from the shared textStyles
});
