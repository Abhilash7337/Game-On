// SocialScreen specific styles
import { buttonStyles, cardStyles } from '../components/common';
import { layoutStyles, textStyles } from '../components/layout';
import { headerStyles } from '../components/ui';

export { buttonStyles, cardStyles, headerStyles, layoutStyles, textStyles };

// SocialScreen-specific styles
import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

export const socialStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.textInverse,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    color: colors.textInverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    marginBottom: spacing.sm,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: spacing.xxl,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.xs,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: spacing.lg,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
  },
  playersTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  playersCount: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  playersPlaceholder: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: spacing.lg,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  // Games Section Styles
  gamesContainer: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  gamesSection: {
    marginBottom: spacing.xxxl,
  },
  gamesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  gamesSectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  gamesSectionCount: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  emptyState: {
    backgroundColor: colors.background,
    borderRadius: spacing.lg,
    padding: spacing.xxxxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  // Game Card Styles
  gameCard: {
    backgroundColor: colors.background,
    borderRadius: spacing.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gameVenue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gameVenueText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  gameTypeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  gameTypeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  gameCourtText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginLeft: 22,
  },
  gameDetails: {
    marginBottom: spacing.lg,
  },
  gameDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gameDetailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  gameCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  gamePriceText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xl,
  },
  joinButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  statusBadge: {
    backgroundColor: colors.gray200,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});

export const socialTextStyles = StyleSheet.create({
  // Add any text-specific styles here if needed
  // Most text styles should come from the shared textStyles
});
