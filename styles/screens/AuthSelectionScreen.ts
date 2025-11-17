import { Dimensions, Platform, StyleSheet } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../theme';

const { height: screenHeight } = Dimensions.get('window');

const dynamicHeights = {
  collapsed: screenHeight * 0.42,
  expanded: screenHeight * 0.7,
  keyboard: screenHeight * 0.84,
};

const baseStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
    letterSpacing: -0.3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  toggleLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255,255,255,0.5)',
  },
  toggleLabelActive: {
    color: '#fff',
  },
  toggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 3,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: typography.fontSize.base,
    color: 'rgba(255,255,255,0.85)',
  },
  cardContainer: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: -spacing.md,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#fff',
    paddingBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  cardHandleWrapper: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  cardHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray300,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  methodButton: {
    width: 72,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: '#fff',
  },
  methodButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(15, 157, 88, 0.08)',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: spacing.xs * 0.5,
  },
  methodLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  methodLabelActive: {
    color: colors.textPrimary,
  },
  formArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  formContent: {
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  authModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.xl,
    padding: 4,
  },
  authModeButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  authModeButtonActive: {
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  authModeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  authModeTextActive: {
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  formButton: {
    marginTop: spacing.sm,
  },
  supportLink: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  centeredContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  placeholderText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xl,
  },
});

export const authSelectionStyles = { ...baseStyles, dynamicHeights };
