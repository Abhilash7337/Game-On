import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

const { fontSize, fontWeight } = typography;

export const revenueAnalyticsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },

  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },

  periodButtonActive: {
    backgroundColor: colors.primary,
  },

  periodButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },

  periodButtonTextActive: {
    color: colors.textInverse,
    fontWeight: fontWeight.semibold,
  },

  // Revenue Overview
  overviewContainer: {
    marginBottom: spacing.lg,
  },

  overviewCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.lg,
  },

  overviewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },

  overviewContent: {
    flex: 1,
  },

  overviewValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  overviewLabel: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },

  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  growthText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  statCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexBasis: '47%',
    alignItems: 'center',
    ...shadows.md,
  },

  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  // Venue Cards
  venueCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },

  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  venueRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  rankText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },

  venueInfo: {
    flex: 1,
    marginRight: spacing.md,
  },

  venueName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  venueAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
  },

  venueRevenue: {
    alignItems: 'flex-end',
  },

  revenueAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.success,
    marginBottom: spacing.xs,
  },

  revenueLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
  },

  // Venue Metrics
  venueMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
  },

  metric: {
    alignItems: 'center',
    flex: 1,
  },

  metricValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },

  // Venue Stats
  venueStats: {
    gap: spacing.sm,
  },

  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },

  statItemLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },

  statItemValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },

  emptyText: {
    fontSize: fontSize.base,
    color: colors.textTertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

