// SocialScreen specific styles
import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

export const socialStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'left',
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.backgroundSecondary,
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
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  
  // Friends Tab
  friendsContainer: {
    flex: 1,
  },
  friendCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  friendAvatar: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundTertiary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  
  // Global Tab
  globalContainer: {
    flex: 1,
  },
  sportGroupCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  sportGroupInfo: {
    flex: 1,
  },
  sportGroupName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sportGroupMembers: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // City Section
  cityCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cityMembers: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  cityGroups: {
    marginTop: spacing.md,
  },
  cityGroupsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  // Game Chats Tab
  gameChatsContainer: {
    flex: 1,
  },
  gameChatCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  gameChatInfo: {
    flex: 1,
  },
  gameChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  gameChatVenue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  hostBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  hostBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  gameChatTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  gameChatParticipants: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

export const socialTextStyles = StyleSheet.create({
  // Add any text-specific styles here if needed
  // Most text styles should come from the shared textStyles
});
