// Home screen specific styles
import { cardStyles, buttonStyles } from '../components/common';
import { layoutStyles, textStyles } from '../components/layout';
import { headerStyles } from '../components/ui';

export { cardStyles, buttonStyles };
export { layoutStyles, textStyles };
export { headerStyles };

// Home-specific styles
import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';

export const homeStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  
  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  
  quickBookCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  
  joinGameCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  
  // Games section
  gamesScrollContainer: {
    paddingRight: spacing.xl,
  },
  
  gameCard: {
  backgroundColor: '#fff',  // explicitly override RN Web purple
  borderRadius: borderRadius.xl,
  padding: spacing.sm,
  marginRight: spacing.md,
  width: 280,
  borderWidth: 1,
  borderColor: colors.gray100,
  ...shadows.lg,
},


  
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  
  gameTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  
  gamePriceTag: {
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  
  gameVenueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  
  gameTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  
  gameSkillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  
  skillBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  
  skillBeginner: {
    backgroundColor: '#DBEAFE',
  },
  
  skillIntermediate: {
    backgroundColor: '#FEF3C7',
  },
  
  skillAdvanced: {
    backgroundColor: '#FECACA',
  },
  
  gameDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  
  // Empty state
  emptyGamesCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  
  emptyGamesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  
  // Notification
  headerRightSection: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  notificationIconContainer: {
    marginRight: spacing.md,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA580C',
    borderWidth: 1,
    borderColor: colors.textInverse,
  },
  
  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const homeTextStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xl,
  },
  
  quickActionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  quickActionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Header text
  headerLocation: {
    color: colors.primaryLight,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  
  // Game card text
  gameType: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  
  gamePrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#DC2626', // Red color for price
  },
  
  gameVenue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  
  gameCourt: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  gameTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  
  gameDuration: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  
  skillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  
  skillTextBeginner: {
    color: '#1E40AF',
  },
  
  skillTextIntermediate: {
    color: '#D97706',
  },
  
  skillTextAdvanced: {
    color: '#DC2626',
  },
  
  playersNeeded: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  
  gameDetailsButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  
  // Empty state text
  emptyGamesTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  emptyGamesText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  
  emptyGamesButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
});