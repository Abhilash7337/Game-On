/**
 * Venue Filter Context
 * 
 * Centralized state management for venue filtering, sorting, and searching.
 * Provides optimized filtering with useMemo and helper functions.
 * 
 * Usage:
 *   const { filters, updateFilter, clearFilters, filteredVenues } = useVenueFilter();
 */

import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface VenueFilterState {
  sportTypes: string[];
  distanceRange: {
    min: number;
    max: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
  minRating: number;
  sortBy: SortOption;
  searchQuery: string;
}

export type SortOption = 
  | 'distance-asc' 
  | 'distance-desc' 
  | 'price-asc' 
  | 'price-desc' 
  | 'rating-desc' 
  | 'rating-asc' 
  | 'popular' 
  | 'name-asc' 
  | 'name-desc';

export interface Venue {
  id: string;
  name: string;
  rating: number;
  reviews?: number;
  location: string;
  price: number;
  image: string | any;
  images?: string[];
  distance?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  sportType?: string;
  sportTypes?: string[];
  amenities?: string[];
  bookings?: number;
  distanceKm?: number; // Numeric distance for sorting
  ownerId?: string; // Owner ID for booking
}

interface VenueFilterContextValue {
  // Current filter state
  filters: VenueFilterState;
  
  // Raw venues data
  venues: Venue[];
  setVenues: (venues: Venue[]) => void;
  
  // Filtered and sorted venues (memoized)
  filteredVenues: Venue[];
  
  // Filter count
  activeFilterCount: number;
  
  // Filter update functions
  updateFilter: (filterName: keyof VenueFilterState, value: any) => void;
  toggleSportFilter: (sport: string) => void;
  updatePriceRange: (min: number, max: number) => void;
  updateDistanceRange: (min: number, max: number) => void;
  setMinRating: (rating: number) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SortOption) => void;
  
  // Clear functions
  clearAllFilters: () => void;
  clearSportFilters: () => void;
  
  // Utility functions
  hasActiveFilters: boolean;
  resetToDefaults: () => void;
}

// ============================================
// DEFAULT STATE
// ============================================

const DEFAULT_FILTER_STATE: VenueFilterState = {
  sportTypes: ['all'],
  distanceRange: {
    min: 0,
    max: 50, // km
  },
  priceRange: {
    min: 0,
    max: 100000, // rupees
  },
  minRating: 0,
  sortBy: 'distance-asc',
  searchQuery: '',
};

// ============================================
// CONTEXT CREATION
// ============================================

const VenueFilterContext = createContext<VenueFilterContextValue | undefined>(undefined);

// ============================================
// FILTER FUNCTIONS
// ============================================

/**
 * Apply all filters to venue list
 */
const applyFilters = (venues: Venue[], filters: VenueFilterState): Venue[] => {
  let filtered = [...venues];

  // Sport type filter (multi-select)
  if (filters.sportTypes.length > 0 && !filters.sportTypes.includes('all')) {
    console.log('🎾 [VenueFilter] Active sport filters:', filters.sportTypes);
    
    filtered = filtered.filter(venue => {
      // Check if venue has sportType or sportTypes array
      const venueSports = venue.sportTypes || (venue.sportType ? [venue.sportType] : []);
      
      console.log(`🏟️  Venue "${venue.name}":`, {
        sportType: venue.sportType,
        sportTypes: venue.sportTypes,
        venueSports,
        filterSports: filters.sportTypes,
      });
      
      // If venue has no sports defined, exclude it when sport filters are active
      if (venueSports.length === 0) {
        console.log(`  ❌ Excluded - no sports defined`);
        return false;
      }
      
      // Check if any of the venue's sports match the filter
      const matches = filters.sportTypes.some(filterSport => 
        venueSports.includes(filterSport)
      );
      
      console.log(`  ${matches ? '✅' : '❌'} ${matches ? 'Included' : 'Excluded'} - sports ${matches ? 'match' : 'do not match'}`);
      
      return matches;
    });
  }

  // Distance filter (parse distance string to number)
  filtered = filtered.filter(venue => {
    // Parse distance string (e.g., "2.5 km" or "500 m") to kilometers
    const distanceKm = venue.distanceKm || parseDistanceToKm(venue.distance);
    
    if (distanceKm === null) return true; // Include if distance unknown
    
    return distanceKm >= filters.distanceRange.min && 
           distanceKm <= filters.distanceRange.max;
  });

  // Price filter
  filtered = filtered.filter(venue => 
    venue.price >= filters.priceRange.min && 
    venue.price <= filters.priceRange.max
  );

  // Rating filter
  if (filters.minRating > 0) {
    filtered = filtered.filter(venue => 
      venue.rating >= filters.minRating
    );
  }

  // Search query (case-insensitive, searches name, location, and sport type)
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase().trim();
    filtered = filtered.filter(venue => {
      // Search in name and location
      const matchesNameOrLocation = 
        venue.name.toLowerCase().includes(query) ||
        venue.location?.toLowerCase().includes(query);
      
      // Search in sportType (single) or sportTypes (array)
      const matchesSport = 
        venue.sportType?.toLowerCase().includes(query) ||
        venue.sportTypes?.some(sport => sport.toLowerCase().includes(query));
      
      return matchesNameOrLocation || matchesSport;
    });
  }

  return filtered;
};

/**
 * Apply sorting to venue list
 */
const applySorting = (venues: Venue[], sortBy: SortOption): Venue[] => {
  const sorted = [...venues];

  switch (sortBy) {
    case 'distance-asc':
      return sorted.sort((a, b) => {
        const distA = a.distanceKm || parseDistanceToKm(a.distance) || Infinity;
        const distB = b.distanceKm || parseDistanceToKm(b.distance) || Infinity;
        return distA - distB;
      });
      
    case 'distance-desc':
      return sorted.sort((a, b) => {
        const distA = a.distanceKm || parseDistanceToKm(a.distance) || 0;
        const distB = b.distanceKm || parseDistanceToKm(b.distance) || 0;
        return distB - distA;
      });
      
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
      
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
      
    case 'rating-desc':
      return sorted.sort((a, b) => b.rating - a.rating);
      
    case 'rating-asc':
      return sorted.sort((a, b) => a.rating - b.rating);
      
    case 'popular':
      return sorted.sort((a, b) => (b.bookings || 0) - (a.bookings || 0));
      
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
      
    default:
      return sorted;
  }
};

/**
 * Parse distance string to kilometers
 * Examples: "2.5 km" -> 2.5, "500 m" -> 0.5
 */
const parseDistanceToKm = (distance?: string): number | null => {
  if (!distance || distance === 'N/A') return null;
  
  const match = distance.match(/^([\d.]+)\s*(km|m)$/i);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  return unit === 'km' ? value : value / 1000;
};

// ============================================
// PROVIDER COMPONENT
// ============================================

interface VenueFilterProviderProps {
  children: ReactNode;
  initialVenues?: Venue[];
}

export const VenueFilterProvider: React.FC<VenueFilterProviderProps> = ({ 
  children,
  initialVenues = []
}) => {
  const [filters, setFilters] = useState<VenueFilterState>(DEFAULT_FILTER_STATE);
  const [venues, setVenues] = useState<Venue[]>(initialVenues);

  // ============================================
  // MEMOIZED FILTERED & SORTED VENUES
  // ============================================

  const filteredVenues = useMemo(() => {
    console.log('🔍 [VenueFilter] Applying filters and sorting...');
    const startTime = Date.now();
    
    // Step 1: Apply filters
    const filtered = applyFilters(venues, filters);
    
    // Step 2: Apply sorting
    const sorted = applySorting(filtered, filters.sortBy);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [VenueFilter] Filtered ${venues.length} → ${sorted.length} venues in ${duration}ms`);
    
    return sorted;
  }, [venues, filters]);

  // ============================================
  // ACTIVE FILTER COUNT
  // ============================================

  const activeFilterCount = useMemo(() => {
    let count = 0;
    
    // Sport filters (exclude 'all')
    if (filters.sportTypes.length > 0 && !filters.sportTypes.includes('all')) {
      count++;
    }
    
    // Distance filter (non-default)
    if (filters.distanceRange.min !== DEFAULT_FILTER_STATE.distanceRange.min ||
        filters.distanceRange.max !== DEFAULT_FILTER_STATE.distanceRange.max) {
      count++;
    }
    
    // Price filter (non-default)
    if (filters.priceRange.min !== DEFAULT_FILTER_STATE.priceRange.min ||
        filters.priceRange.max !== DEFAULT_FILTER_STATE.priceRange.max) {
      count++;
    }
    
    // Rating filter
    if (filters.minRating > 0) {
      count++;
    }
    
    // Search query
    if (filters.searchQuery.trim() !== '') {
      count++;
    }
    
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  // ============================================
  // UPDATE FUNCTIONS
  // ============================================

  const updateFilter = useCallback((filterName: keyof VenueFilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  }, []);

  const toggleSportFilter = useCallback((sport: string) => {
    setFilters(prev => {
      const currentSports = prev.sportTypes;
      
      // If clicking 'all', set to ['all']
      if (sport === 'all') {
        return { ...prev, sportTypes: ['all'] };
      }
      
      // Remove 'all' if present and add specific sport
      let newSports = currentSports.filter(s => s !== 'all');
      
      // Toggle the sport
      if (newSports.includes(sport)) {
        newSports = newSports.filter(s => s !== sport);
      } else {
        newSports = [...newSports, sport];
      }
      
      // If no sports selected, default to 'all'
      if (newSports.length === 0) {
        newSports = ['all'];
      }
      
      return { ...prev, sportTypes: newSports };
    });
  }, []);

  const updatePriceRange = useCallback((min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: { min, max },
    }));
  }, []);

  const updateDistanceRange = useCallback((min: number, max: number) => {
    setFilters(prev => ({
      ...prev,
      distanceRange: { min, max },
    }));
  }, []);

  const setMinRating = useCallback((rating: number) => {
    setFilters(prev => ({
      ...prev,
      minRating: rating,
    }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
    }));
  }, []);

  // ============================================
  // CLEAR FUNCTIONS
  // ============================================

  const clearAllFilters = useCallback(() => {
    console.log('🧹 [VenueFilter] Clearing all filters');
    setFilters(DEFAULT_FILTER_STATE);
  }, []);

  const clearSportFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      sportTypes: ['all'],
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    console.log('🔄 [VenueFilter] Resetting to defaults');
    setFilters(DEFAULT_FILTER_STATE);
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: VenueFilterContextValue = {
    filters,
    venues,
    setVenues,
    filteredVenues,
    activeFilterCount,
    updateFilter,
    toggleSportFilter,
    updatePriceRange,
    updateDistanceRange,
    setMinRating,
    setSearchQuery,
    setSortBy,
    clearAllFilters,
    clearSportFilters,
    hasActiveFilters,
    resetToDefaults,
  };

  return (
    <VenueFilterContext.Provider value={value}>
      {children}
    </VenueFilterContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK
// ============================================

/**
 * Custom hook to use venue filter context
 */
export const useVenueFilter = (): VenueFilterContextValue => {
  const context = useContext(VenueFilterContext);
  
  if (!context) {
    throw new Error('useVenueFilter must be used within VenueFilterProvider');
  }
  
  return context;
};

// ============================================
// EXPORTS
// ============================================

export default VenueFilterContext;
