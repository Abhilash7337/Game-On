// VenueDetailsScreen specific styles
import { buttonStyles, cardStyles } from '../components/common';
import { layoutStyles, textStyles } from '../components/layout';
import { headerStyles } from '../components/ui';

export { buttonStyles, cardStyles, headerStyles, layoutStyles, textStyles };

// VenueDetailsScreen-specific styles
import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../theme';

export const venueDetailsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.textInverse,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.textInverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.md,
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
  venueName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  venueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationText: {
    marginLeft: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: spacing.sm,
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
  about: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    marginBottom: 80,
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
  priceSection: {
    marginTop: spacing.lg,
  },
  priceTitle: {
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  priceText: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
  },
  bookButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.textInverse,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: spacing.lg,
  },
  bookButtonText: {
    color: colors.textInverse,
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});

export const venueDetailsTextStyles = StyleSheet.create({
  // Add any text-specific styles here if needed
  // Most text styles should come from the shared textStyles
});
