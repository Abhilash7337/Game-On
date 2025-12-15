/**
 * Active Filter Chips Component
 * 
 * Displays active filters as removable chips/tags.
 * Shows filter name + value with X button to remove individual filters.
 */

import { VenueFilterState } from '@/src/common/contexts/VenueFilterContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ActiveFilterChipsProps {
  filters: VenueFilterState;
  totalVenues: number;
  filteredVenues: number;
  onRemoveFilter: (filterType: string, value?: any) => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  totalVenues,
  filteredVenues,
  onRemoveFilter,
}) => {
  const activeChips: Array<{ label: string; onRemove: () => void }> = [];

  // Sport filters (excluding 'all')
  const activeSports = filters.sportTypes.filter(s => s !== 'all');
  if (activeSports.length > 0) {
    activeSports.forEach(sport => {
      activeChips.push({
        label: sport.charAt(0).toUpperCase() + sport.slice(1),
        onRemove: () => onRemoveFilter('sport', sport),
      });
    });
  }

  // Distance filter (if not default)
  if (filters.distanceRange.max < 50) {
    activeChips.push({
      label: `Distance: < ${filters.distanceRange.max}km`,
      onRemove: () => onRemoveFilter('distance'),
    });
  }

  // Price filter (if not default)
  if (filters.priceRange.max < 100000) {
    const priceLabel = filters.priceRange.max >= 10000
      ? `Price: < ₹10,000`
      : `Price: < ₹${filters.priceRange.max.toLocaleString()}`;
    activeChips.push({
      label: priceLabel,
      onRemove: () => onRemoveFilter('price'),
    });
  }

  // Rating filter (if not default)
  if (filters.minRating > 0) {
    activeChips.push({
      label: `Rating: ${filters.minRating}+ ⭐`,
      onRemove: () => onRemoveFilter('rating'),
    });
  }

  // Search query
  if (filters.searchQuery) {
    activeChips.push({
      label: `"${filters.searchQuery}"`,
      onRemove: () => onRemoveFilter('search'),
    });
  }

  // Don't render if no active filters
  if (activeChips.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.resultsCount}>
          Showing {filteredVenues} venue{filteredVenues !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Results Count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsCount}>
          Showing {filteredVenues} of {totalVenues} venues
        </Text>
      </View>

      {/* Active Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {activeChips.map((chip, index) => (
          <View key={`${chip.label}-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{chip.label}</Text>
            <TouchableOpacity
              onPress={chip.onRemove}
              style={styles.chipRemoveButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsRow: {
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  chipRemoveButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActiveFilterChips;
