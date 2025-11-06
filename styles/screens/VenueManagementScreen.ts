import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

// Helper to use typography consistently
const { fontSize, fontWeight } = typography;

export const venueManagementStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
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

  // Header
  header: {
    backgroundColor: colors.background,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  headerSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.textSecondary,
    marginTop: 2,
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },

  // Venue Card
  venueCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  venueImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.gray200,
  },

  venueInfo: {
    padding: spacing.lg,
  },

  venueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },

  venueName: {
    fontSize: typography.sizes.lg,
    fontFamily: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },

  venueAddress: {
    fontSize: typography.sizes.sm,
    fontFamily: fontWeight.regular,
    color: colors.textSecondary,
  },

  statusToggle: {
    alignItems: 'flex-end',
  },

  statusLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },

  // Venue Stats
  venueStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray200,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  statText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontWeight.medium,
    color: colors.textSecondary,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: 6,
  },

  editButton: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary,
  },

  editButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontWeight.semibold,
    color: colors.primary,
  },

  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },

  deleteButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontWeight.semibold,
    color: '#EF4444',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 3,
    paddingHorizontal: spacing.xl,
  },

  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  emptyText: {
    fontSize: typography.sizes.md,
    fontFamily: fontWeight.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },

  emptyButtonText: {
    fontSize: typography.sizes.md,
    fontFamily: fontWeight.semibold,
    color: colors.background,
  },
});
