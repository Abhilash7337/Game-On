import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorStateProps {
  /**
   * Error message to display
   * @default "We couldn't load the venues. Please try again."
   */
  message?: string;
  
  /**
   * Callback when retry button is pressed
   */
  onRetry: () => void;
  
  /**
   * Whether to show support contact message
   * @default true
   */
  showSupport?: boolean;
  
  /**
   * Custom error title
   * @default "Something went wrong"
   */
  title?: string;
}

/**
 * ErrorState Component
 * 
 * Displays an error state with retry functionality when API calls fail
 * or other errors occur. Provides clear user feedback and recovery options.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   onRetry={handleRetry}
 *   message="Failed to load venues from the server"
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "We couldn't load the venues. Please try again.",
  onRetry,
  showSupport = true,
  title = "Something went wrong",
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      {/* Error Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconBackground}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
        </View>
      </View>
      
      {/* Error Title */}
      <Text style={styles.title}>{title}</Text>
      
      {/* Error Message */}
      <Text style={styles.message}>{message}</Text>
      
      {/* Retry Button */}
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
      
      {/* Support Message */}
      {showSupport && (
        <View style={styles.supportContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.supportText}>
            If the problem persists, please contact support
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
    paddingHorizontal: 16,
  },
  supportText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    flex: 1,
  },
});

export default ErrorState;
