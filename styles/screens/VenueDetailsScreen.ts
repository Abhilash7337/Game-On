// VenueDetailsScreen specific styles
import { StyleSheet } from 'react-native';
import { buttonStyles, cardStyles } from '../components/common';
import { layoutStyles, textStyles } from '../components/layout';
import { headerStyles } from '../components/ui';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

export { buttonStyles, cardStyles, headerStyles, layoutStyles, textStyles };

export const venueDetailsStyles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.md,
  },
  distanceText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs / 2,
    fontWeight: '500',
  },
  imageCarousel: {
    width: '100%',
    height: 224,
  },
  image: {
    width: '100%',
    height: 224,
    resizeMode: 'cover',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  dot: {
    height: 8,
    width: 8,
    marginHorizontal: spacing.xs,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.secondary,
  },
  dotInactive: {
    backgroundColor: colors.gray300,
  },
  venueInfo: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  venueNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  venueName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: spacing.xs / 2,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  venueLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  operatingHours: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  hoursText: {
    marginLeft: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  star: {
    marginRight: spacing.xs,
  },
  amenities: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  amenitiesTitle: {
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  amenityIcon: {
    marginRight: spacing.sm,
  },
  amenityText: {
    marginLeft: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  courtAvailability: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  todayLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.xs / 2,
  },
  courtSection: {
    marginBottom: spacing.lg,
  },
  courtTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  timeSlotsScroll: {
    marginBottom: spacing.xs,
  },
  timeSlotsContainer: {
    paddingRight: spacing.xl,
  },
  timeSlotCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  availableSlot: {
    backgroundColor: colors.success + '08',
    borderColor: colors.success,
  },
  openToJoinSlot: {
    backgroundColor: '#FF8C00' + '08',
    borderColor: '#FF8C00',
  },
  bookedSlot: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray300,
    opacity: 0.6,
  },
  slotTime: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  slotPrice: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  availablePrice: {
    color: colors.success,
  },
  openToJoinPrice: {
    color: '#FF8C00',
  },
  bookedPrice: {
    color: colors.textSecondary,
  },
  about: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: 40,
  },
  aboutTitle: {
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  // Loading and Error States
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  errorText: {
    color: '#6B7280',
  },
  goBackButton: {
    marginTop: 16,
  },
  goBackText: {
    color: '#047857',
  },
  noCourtsText: {
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
  },
  // Date Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  datePickerContainer: {
    position: 'absolute',
    top: 320,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 280,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  datePickerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  datePickerScroll: {
    maxHeight: 300,
  },
  dateOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  dateOptionSelected: {
    backgroundColor: '#ECFDF5',
  },
  dateOptionText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '400',
  },
  dateOptionTextSelected: {
    color: '#047857',
    fontWeight: '600',
  },
  dateSubtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },
});

export const venueDetailsTextStyles = StyleSheet.create({
  // Add any text-specific styles here if needed
  // Most text styles should come from the shared textStyles
});
