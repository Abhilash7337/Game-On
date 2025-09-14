// JoinGamesScreen specific styles
import { cardStyles, buttonStyles } from '../components/common';
import { layoutStyles, textStyles } from '../components/layout';
import { headerStyles } from '../components/ui';

export { cardStyles, buttonStyles };
export { layoutStyles, textStyles };
export { headerStyles };

// JoinGames-specific styles
import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../theme';

export const joinGamesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: spacing.xxxl,
    borderBottomRightRadius: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  
  // Filter dropdown
  filterContainer: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  
  // Game cards
  gameCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  
  gameCardImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    resizeMode: 'cover',
  },
  
  gameCardInfo: {
    padding: spacing.lg,
  },
  
  gameCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  
  gameJoinButton: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  
  playerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  
  statusChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.sm,
  },
  
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    margin: spacing.xl,
    maxHeight: '80%',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  
  sportOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  
  sportOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  
  dateTimeSection: {
    marginBottom: spacing.lg,
  },
  
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  
  timeButton: {
    flex: 1,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
});

export const joinGamesTextStyles = StyleSheet.create({
  // Header text
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
  
  filterDropdownText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Game card text
  venueName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  
  joinButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  
  gameDetails: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  
  playerCount: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginRight: spacing.sm,
  },
  
  statusChipText: {
    color: '#B45309',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  
  priceText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  
  organizerLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    marginRight: 2,
  },
  
  organizerName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  
  detailsLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.xs,
    textDecorationLine: 'underline',
  },
  
  // Modal text
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  sportOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  sportOptionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  
  timeButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
});