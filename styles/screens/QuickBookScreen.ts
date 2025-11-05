import { StyleSheet } from 'react-native';
import { colors } from '../theme';

// Re-export all the component styles for easy importing
export { buttonStyles, cardStyles, inputStyles } from '../components/common';
export { layoutStyles, summaryStyles, textStyles } from '../components/layout';
export { chipStyles, headerStyles, modalStyles } from '../components/ui';

// Screen-specific styles if needed
export const quickBookStyles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  datePickerDoneButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  datePickerDoneText: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  datePickerStyle: {
    backgroundColor: colors.background,
  },
});

// BookingFormScreen specific styles
export const bookingFormStyles = StyleSheet.create({
  slotIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  slotStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  headerBackButton: {
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});