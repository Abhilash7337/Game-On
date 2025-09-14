import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  
  title: {
    color: colors.textInverse,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  
  subtitle: {
    color: colors.textInverse,
    fontSize: typography.fontSize.sm,
  },
});

export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  content: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '85%',
    maxHeight: '70%',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  
  optionSelected: {
    backgroundColor: '#D1FAE5',
  },
  
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  optionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});

export const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  
  base: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray300,
    flex: 1,
    alignItems: 'center',
  },
  
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#D1FAE5',
  },
  
  text: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.sm,
  },
  
  textSelected: {
    color: colors.primary,
  },
});