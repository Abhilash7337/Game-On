/**
 * useVenueFilterUtils Hook
 * 
 * Additional utility functions and helpers for venue filtering.
 * Provides computed values, statistics, and advanced filtering operations.
 */

import { useMemo } from 'react';
import { useVenueFilter, Venue, VenueFilterState } from '../contexts/VenueFilterContext';

interface FilterStatistics {
  totalVenues: number;
  filteredVenues: number;
  filteredPercentage: number;
  priceStats: {
    min: number;
    max: number;
    average: number;
  };
  distanceStats: {
    min: number;
    max: number;
    average: number;
  };
  ratingStats: {
    min: number;
    max: number;
    average: number;
  };
  sportDistribution: Record<string, number>;
}

interface FilterPreset {
  name: string;
  description: string;
  filters: Partial<VenueFilterState>;
}

export const useVenueFilterUtils = () => {
  const {
    venues,
    filteredVenues,
    filters,
    updateFilter,
    toggleSportFilter,
    updatePriceRange,
    updateDistanceRange,
    setMinRating,
    setSearchQuery,
    setSortBy,
    clearAllFilters,
    activeFilterCount,
    hasActiveFilters,
  } = useVenueFilter();

  // ============================================
  // COMPUTED STATISTICS
  // ============================================

  const statistics = useMemo<FilterStatistics>(() => {
    const totalVenues = venues.length;
    const filtered = filteredVenues.length;

    // Price statistics
    const prices = filteredVenues.map(v => v.price);
    const priceStats = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
      average: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    };

    // Distance statistics (parse distance strings)
    const distances = filteredVenues
      .map(v => parseDistanceToKm(v.distance))
      .filter(d => d !== null) as number[];
    
    const distanceStats = {
      min: distances.length > 0 ? Math.min(...distances) : 0,
      max: distances.length > 0 ? Math.max(...distances) : 0,
      average: distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : 0,
    };

    // Rating statistics
    const ratings = filteredVenues.map(v => v.rating);
    const ratingStats = {
      min: ratings.length > 0 ? Math.min(...ratings) : 0,
      max: ratings.length > 0 ? Math.max(...ratings) : 0,
      average: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    };

    // Sport type distribution
    const sportDistribution: Record<string, number> = {};
    filteredVenues.forEach(venue => {
      const sports = venue.sportTypes || (venue.sportType ? [venue.sportType] : ['other']);
      sports.forEach(sport => {
        sportDistribution[sport] = (sportDistribution[sport] || 0) + 1;
      });
    });

    return {
      totalVenues,
      filteredVenues: filtered,
      filteredPercentage: totalVenues > 0 ? (filtered / totalVenues) * 100 : 0,
      priceStats,
      distanceStats,
      ratingStats,
      sportDistribution,
    };
  }, [venues, filteredVenues]);

  // ============================================
  // FILTER PRESETS
  // ============================================

  const filterPresets: FilterPreset[] = useMemo(() => [
    {
      name: 'Nearby & Affordable',
      description: 'Within 5km, under ₹500',
      filters: {
        distanceRange: { min: 0, max: 5 },
        priceRange: { min: 0, max: 500 },
        sortBy: 'distance-asc',
      },
    },
    {
      name: 'Top Rated',
      description: '4+ stars, sorted by rating',
      filters: {
        minRating: 4,
        sortBy: 'rating-desc',
      },
    },
    {
      name: 'Budget Friendly',
      description: 'Under ₹300, sorted by price',
      filters: {
        priceRange: { min: 0, max: 300 },
        sortBy: 'price-asc',
      },
    },
    {
      name: 'Premium Venues',
      description: 'High-end venues with top ratings',
      filters: {
        minRating: 4.5,
        priceRange: { min: 500, max: 100000 },
        sortBy: 'rating-desc',
      },
    },
    {
      name: 'Popular Choices',
      description: 'Most booked venues',
      filters: {
        sortBy: 'popular',
      },
    },
  ], []);

  // ============================================
  // APPLY PRESET
  // ============================================

  const applyPreset = (presetName: string) => {
    const preset = filterPresets.find(p => p.name === presetName);
    if (!preset) {
      console.warn(`Preset "${presetName}" not found`);
      return;
    }

    console.log(`🎯 [FilterUtils] Applying preset: ${presetName}`);
    
    // Apply each filter from the preset
    Object.entries(preset.filters).forEach(([key, value]) => {
      updateFilter(key as keyof VenueFilterState, value);
    });
  };

  // ============================================
  // SMART RECOMMENDATIONS
  // ============================================

  const getRecommendedVenues = (limit: number = 5): Venue[] => {
    // Smart algorithm: nearby + high rated + affordable
    const scored = filteredVenues.map(venue => {
      const distKm = parseDistanceToKm(venue.distance) || 50;
      
      // Scoring factors (normalized 0-1)
      const distanceScore = Math.max(0, 1 - (distKm / 50)); // Closer is better
      const ratingScore = venue.rating / 5; // Higher is better
      const priceScore = Math.max(0, 1 - (venue.price / 1000)); // Cheaper is better
      
      // Weighted score
      const totalScore = 
        distanceScore * 0.4 + 
        ratingScore * 0.4 + 
        priceScore * 0.2;
      
      return { venue, score: totalScore };
    });

    // Sort by score and return top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.venue);
  };

  // ============================================
  // AVAILABLE SPORTS (from current venues)
  // ============================================

  const availableSports = useMemo(() => {
    const sportsSet = new Set<string>();
    
    venues.forEach(venue => {
      const sports = venue.sportTypes || (venue.sportType ? [venue.sportType] : []);
      sports.forEach(sport => sportsSet.add(sport));
    });
    
    return Array.from(sportsSet).sort();
  }, [venues]);

  // ============================================
  // PRICE RANGE BOUNDS (from actual data)
  // ============================================

  const actualPriceBounds = useMemo(() => {
    const prices = venues.map(v => v.price);
    return {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 10000,
    };
  }, [venues]);

  // ============================================
  // DISTANCE RANGE BOUNDS (from actual data)
  // ============================================

  const actualDistanceBounds = useMemo(() => {
    const distances = venues
      .map(v => parseDistanceToKm(v.distance))
      .filter(d => d !== null) as number[];
    
    return {
      min: 0,
      max: distances.length > 0 ? Math.ceil(Math.max(...distances)) : 50,
    };
  }, [venues]);

  // ============================================
  // QUICK FILTERS
  // ============================================

  const quickFilters = {
    showNearby: () => {
      updateDistanceRange(0, 5);
      setSortBy('distance-asc');
    },
    
    showAffordable: () => {
      updatePriceRange(0, 500);
      setSortBy('price-asc');
    },
    
    showTopRated: () => {
      setMinRating(4);
      setSortBy('rating-desc');
    },
    
    showPopular: () => {
      setSortBy('popular');
    },
  };

  // ============================================
  // FILTER SUMMARY TEXT
  // ============================================

  const getFilterSummary = (): string => {
    const parts: string[] = [];
    
    if (filters.sportTypes.length > 0 && !filters.sportTypes.includes('all')) {
      parts.push(`${filters.sportTypes.length} sport(s)`);
    }
    
    if (filters.distanceRange.max < 50) {
      parts.push(`within ${filters.distanceRange.max}km`);
    }
    
    if (filters.priceRange.max < 100000) {
      parts.push(`under ₹${filters.priceRange.max}`);
    }
    
    if (filters.minRating > 0) {
      parts.push(`${filters.minRating}+ stars`);
    }
    
    if (filters.searchQuery) {
      parts.push(`"${filters.searchQuery}"`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'All venues';
  };

  return {
    // Statistics
    statistics,
    
    // Presets
    filterPresets,
    applyPreset,
    
    // Recommendations
    getRecommendedVenues,
    
    // Available options
    availableSports,
    actualPriceBounds,
    actualDistanceBounds,
    
    // Quick filters
    quickFilters,
    
    // Summary
    getFilterSummary,
    
    // Re-export from context for convenience
    filters,
    filteredVenues,
    activeFilterCount,
    hasActiveFilters,
    updateFilter,
    toggleSportFilter,
    updatePriceRange,
    updateDistanceRange,
    setMinRating,
    setSearchQuery,
    setSortBy,
    clearAllFilters,
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse distance string to kilometers
 */
const parseDistanceToKm = (distance?: string): number | null => {
  if (!distance || distance === 'N/A') return null;
  
  const match = distance.match(/^([\d.]+)\s*(km|m)$/i);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  return unit === 'km' ? value : value / 1000;
};

export default useVenueFilterUtils;
