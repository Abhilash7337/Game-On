import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type EmptyStateVariant = 'no-results' | 'no-venues' | 'no-search-results';

interface EmptyStateProps {
  /**
   * Variant of empty state to display
   */
  variant: EmptyStateVariant;
  
  /**
   * Search query (for no-search-results variant)
   */
  searchQuery?: string;
  
  /**
   * Number of venues hidden by filters (for no-results variant)
   */
  hiddenVenuesCount?: number;
  
  /**
   * Total number of available venues (for no-results variant)
   */
  totalVenues?: number;
  
  /**
   * Callback when "Clear All Filters" button is pressed
   */
  onClearFilters?: () => void;
  
  /**
   * Callback when "Clear Search" button is pressed
   */
  onClearSearch?: () => void;
}

/**
 * EmptyState Component
 * 
 * Displays contextual empty states with appropriate messaging and actions.
 * Supports three variants:
 * - no-results: When filters return 0 results
 * - no-venues: When no venues exist in database
 * - no-search-results: When search returns nothing
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   variant="no-results"
 *   hiddenVenuesCount={12}
 *   totalVenues={45}
 *   onClearFilters={handleClearFilters}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  variant,
  searchQuery,
  hiddenVenuesCount = 0,
  totalVenues = 0,
  onClearFilters,
  onClearSearch,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const renderContent = () => {
    switch (variant) {
      case 'no-results':
        return (
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <Ionicons name="filter-outline" size={64} color="#9CA3AF" />
            </View>
            
            <Text style={styles.heading}>No venues found</Text>
            
            <Text style={styles.message}>
              We couldn't find any venues matching your filters
            </Text>
            
            {hiddenVenuesCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {hiddenVenuesCount} of {totalVenues} venues hidden by current filters
                </Text>
              </View>
            )}
            
            <View style={styles.suggestions}>
              <Text style={styles.suggestionTitle}>Try:</Text>
              <View style={styles.suggestionItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Adjusting your filters</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Expanding your search distance</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Removing some filters</Text>
              </View>
            </View>
            
            {onClearFilters && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onClearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      
      case 'no-venues':
        return (
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={64} color="#9CA3AF" />
            </View>
            
            <Text style={styles.heading}>No venues available</Text>
            
            <Text style={styles.message}>
              We don't have any venues in your area yet
            </Text>
            
            <View style={styles.suggestions}>
              <View style={styles.suggestionItem}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Check back soon for new venues</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Contact support to add your venue</Text>
              </View>
            </View>
          </View>
        );
      
      case 'no-search-results':
        return (
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <Ionicons name="search-outline" size={64} color="#9CA3AF" />
            </View>
            
            <Text style={styles.heading}>
              No results for "{searchQuery}"
            </Text>
            
            <Text style={styles.message}>
              Try searching for something else
            </Text>
            
            <View style={styles.suggestions}>
              <Text style={styles.suggestionTitle}>Suggestions:</Text>
              <View style={styles.suggestionItem}>
                <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Check your spelling</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Try more general keywords</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.suggestionText}>Search by venue name or location</Text>
              </View>
            </View>
            
            {onClearSearch && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onClearSearch}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={20} color="#FF6B35" />
                <Text style={styles.secondaryButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.wrapper, 
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      {renderContent()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
  },
  container: {
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  countBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  countText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  suggestions: {
    width: '100%',
    marginBottom: 32,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  suggestionText: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
});

export default EmptyState;
