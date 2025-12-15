import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface SkeletonCardProps {
  /**
   * Number of skeleton cards to render
   * @default 3
   */
  count?: number;
}

/**
 * SkeletonCard Component
 * 
 * Displays animated skeleton placeholders while venue data is loading.
 * Features a shimmer animation effect for a polished loading experience.
 * 
 * @example
 * ```tsx
 * <SkeletonCard count={4} />
 * ```
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 3 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {Array.from({ length: count }).map((_, index) => (
        <SingleSkeletonCard key={index} delay={index * 100} />
      ))}
    </Animated.View>
  );
};

/**
 * SingleSkeletonCard Component
 * 
 * Individual skeleton card with shimmer animation
 */
const SingleSkeletonCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmerAnimation, delay]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const shimmerTranslate = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.card}>
      {/* Image Skeleton */}
      <View style={styles.imageContainer}>
        <View style={styles.skeletonImage}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                opacity: shimmerOpacity,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
      </View>

      {/* Content Skeleton */}
      <View style={styles.content}>
        {/* Venue Name */}
        <View style={styles.skeletonTitleLarge}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                opacity: shimmerOpacity,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>

        {/* Location */}
        <View style={styles.skeletonTextMedium}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                opacity: shimmerOpacity,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>

        {/* Distance and Rating Row */}
        <View style={styles.row}>
          <View style={styles.skeletonTextShort}>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  opacity: shimmerOpacity,
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </View>
          <View style={styles.skeletonTextShort}>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  opacity: shimmerOpacity,
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
          </View>
        </View>

        {/* Button Skeleton */}
        <View style={styles.skeletonButton}>
          <Animated.View
            style={[
              styles.shimmer,
              {
                opacity: shimmerOpacity,
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  skeletonTitleLarge: {
    height: 24,
    width: '70%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  skeletonTextMedium: {
    height: 16,
    width: '50%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  skeletonTextShort: {
    height: 16,
    width: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  skeletonButton: {
    height: 44,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
});

export default SkeletonCard;
