/**
 * Modern Sport Filter Pills Component
 * 
 * Horizontal scrollable filter bar with sport-specific images.
 * Features pill-style buttons with smooth transitions, active states,
 * and multi-select capability.
 */

import { getSportImage } from '@/src/assets/images/imageAssets';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export interface SportFilter {
  id: string;
  name: string;
  image: any | null;
}

interface SportFilterPillsProps {
  activeSports: string[];
  onToggleSport: (sportId: string) => void;
  onClearFilters?: () => void;
  showFilterCount?: boolean;
  onOpenAdvancedFilters?: () => void;
  advancedFilterCount?: number;
}

const SPORT_FILTERS: SportFilter[] = [
  { id: 'all', name: 'All Sports', image: null },
  { id: 'football', name: 'Football', image: getSportImage('football') },
  { id: 'cricket', name: 'Cricket', image: getSportImage('cricket') },
  { id: 'basketball', name: 'Basketball', image: getSportImage('basketball') },
  { id: 'tennis', name: 'Tennis', image: getSportImage('tennis') },
  { id: 'badminton', name: 'Badminton', image: getSportImage('badminton') },
  { id: 'volleyball', name: 'Volleyball', image: getSportImage('volleyball') },
];

export const SportFilterPills: React.FC<SportFilterPillsProps> = ({
  activeSports,
  onToggleSport,
  onClearFilters,
  showFilterCount = true,
  onOpenAdvancedFilters,
  advancedFilterCount = 0,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const pillRefs = useRef<{ [key: string]: number }>({});

  // Calculate active filter count (excluding 'all')
  const activeFilterCount = activeSports.filter(s => s !== 'all').length;
  const hasActiveFilters = activeFilterCount > 0;

  // Auto-scroll to newly activated pill
  const scrollToPill = (sportId: string) => {
    const xPosition = pillRefs.current[sportId];
    if (xPosition !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: Math.max(0, xPosition - 20), // Add 20px padding
        animated: true,
      });
    }
  };

  // Handle pill press with ripple effect
  const handlePillPress = (sportId: string) => {
    onToggleSport(sportId);
    
    // Scroll to activated pill after slight delay
    setTimeout(() => {
      if (activeSports.includes(sportId) || sportId === 'all') {
        scrollToPill(sportId);
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      {/* Filter Count Badge */}
      {showFilterCount && hasActiveFilters && (
        <View style={styles.filterCountBadge}>
          <Text style={styles.filterCountText}>
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {SPORT_FILTERS.map((sport, index) => {
          const isActive = activeSports.includes(sport.id);
          const isAllSports = sport.id === 'all';

          return (
            <Pressable
              key={sport.id}
              onPress={() => handlePillPress(sport.id)}
              onLayout={(event) => {
                pillRefs.current[sport.id] = event.nativeEvent.layout.x;
              }}
              style={({ pressed }) => [
                styles.pill,
                isActive && styles.pillActive,
                pressed && styles.pillPressed,
              ]}
              android_ripple={{
                color: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,107,53,0.1)',
                borderless: false,
              }}
            >
              {/* Sport Icon/Image */}
              {isAllSports ? (
                <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                  <Ionicons 
                    name="grid-outline" 
                    size={20} 
                    color={isActive ? '#FFFFFF' : '#6B7280'} 
                  />
                </View>
              ) : (
                <Image
                  source={sport.image}
                  style={styles.sportImage}
                  resizeMode="cover"
                />
              )}

              {/* Sport Name */}
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {sport.name}
              </Text>

              {/* Active Indicator Dot */}
              {isActive && !isAllSports && (
                <View style={styles.activeDot} />
              )}
            </Pressable>
          );
        })}

        {/* More Filters Button */}
        {onOpenAdvancedFilters && (
          <TouchableOpacity
            onPress={onOpenAdvancedFilters}
            style={styles.moreFiltersButton}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color="#FF6B35" />
            <Text style={styles.moreFiltersText}>More Filters</Text>
            {advancedFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{advancedFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && onClearFilters && (
          <TouchableOpacity
            onPress={onClearFilters}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={18} color="#EF4444" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterCountBadge: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 20,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  scrollView: {
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    // Smooth transition
    ...Platform.select({
      ios: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  pillActive: {
    backgroundColor: '#FF6B35',
    borderWidth: 0,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  sportImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: 0.2,
  },
  moreFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4ED',
    borderWidth: 1,
    borderColor: '#FF6B35',
    gap: 8,
  },
  moreFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    letterSpacing: 0.2,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default SportFilterPills;
