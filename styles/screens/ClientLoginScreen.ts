import { StyleSheet, Platform, Dimensions } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';

const { height: screenHeight } = Dimensions.get('window');

export const clientLoginScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  orangeHeader: {
    height: 100,
    backgroundColor: colors.secondary, // Orange for client
    justifyContent: 'flex-start',
    paddingTop: spacing.md,
  },
  compactHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAppName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  playerToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.5)', // Dimmed when inactive
  },
  toggleLabelActive: {
    color: 'rgba(255, 255, 255, 1)', // Bright white when active
    fontWeight: typography.fontWeight.bold,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  scrollableContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardIndicator: {
    width: 32,
    height: 3,
    backgroundColor: colors.secondary + '30',
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  formFields: {
    marginBottom: spacing.lg,
  },
  fieldSpacing: {
    marginBottom: spacing.lg,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  actionButton: {
    marginBottom: spacing.xl,
  },
  toggleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  toggleLink: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
});
