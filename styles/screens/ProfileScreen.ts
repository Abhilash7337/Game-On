// ProfileScreen specific styles
import { buttonStyles, cardStyles } from '../components/common';
import { layoutStyles, textStyles } from '../components/layout';
import { headerStyles } from '../components/ui';

export { buttonStyles, cardStyles, headerStyles, layoutStyles, textStyles };

// ProfileScreen-specific styles
import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

export const profileStyles = StyleSheet.create({
  userInfoSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: spacing.lg,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.textInverse,
  },
  defaultAvatar: {
    backgroundColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textInverse,
  },
  email: {
    color: '#d1fae5',
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  badge: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    alignSelf: 'center',
    marginBottom: 0,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  levelBox: {
    backgroundColor: colors.textInverse,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  levelText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.gray300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.textInverse,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBtnText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  tabBtnTextActive: {
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.textInverse,
    borderRadius: borderRadius.md,
    flexBasis: '47%',
    marginBottom: spacing.sm,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.textInverse,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  sportBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  sportBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  activityTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    fontSize: typography.fontSize.sm,
  },
  activityDate: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: spacing.sm,
    padding: spacing.sm,
  },
  gameTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    fontSize: typography.fontSize.sm,
  },
  gameDate: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  playersBadge: {
    backgroundColor: '#bbf7d0',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  playersBadgeText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: spacing.sm,
    padding: spacing.sm,
  },
  bookingTitle: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    fontSize: typography.fontSize.sm,
  },
  bookingDate: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  bookingAmount: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  bookingStatus: {
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bookingStatusText: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: spacing.sm,
    padding: spacing.sm,
  },
  achievementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  achievementTitle: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  achievementDesc: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
  achievementBadge: {
    backgroundColor: colors.secondary,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  achievementBadgeText: {
    color: colors.textInverse,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
  },
});

export const profileTextStyles = StyleSheet.create({
  // Add any text-specific styles here if needed
  // Most text styles should come from the shared textStyles
});
