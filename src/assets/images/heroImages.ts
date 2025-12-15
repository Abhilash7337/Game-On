/**
 * Hero Image Assets for Sport Filters
 * Maps sport types to their respective hero images
 */

export const HERO_IMAGES = {
  // Default/All sports
  all: require('./hero/global-sports-hero.jpg'),
  
  // Individual sports
  basketball: require('./sports/basketball.jpg'),
  football: require('./sports/football.jpg'),
  tennis: require('./sports/tennis.jpg'),
  badminton: require('./sports/badminton.jpg'),
  cricket: require('./sports/cricket.jpg'),
  volleyball: require('./sports/volleyball.jpg'),
  
  // Fallback for unknown sports
  default: require('./hero/global-sports-hero.jpg'),
} as const;

export type SportType = keyof typeof HERO_IMAGES;

/**
 * Get hero image for a sport type
 * @param sportType - The sport filter type
 * @returns The hero image asset
 */
export const getHeroImage = (sportType: string | undefined): any => {
  console.log('🖼️ [HERO] getHeroImage called with:', sportType);
  
  if (!sportType || sportType === 'all') {
    console.log('  → Returning: global sports hero (default/all)');
    return HERO_IMAGES.all;
  }
  
  const normalizedSport = sportType.toLowerCase();
  console.log('  → Normalized to:', normalizedSport);
  
  // Check if we have a specific image for this sport
  if (normalizedSport in HERO_IMAGES) {
    console.log('  ✅ Found image for:', normalizedSport);
    return HERO_IMAGES[normalizedSport as SportType];
  }
  
  // Fallback to default
  console.log('  ⚠️ No image found, using default');
  return HERO_IMAGES.default;
};

/**
 * Get the most recent sport filter (last non-'all' filter)
 * @param sportFilters - Array of active sport filters
 * @returns The most recent sport filter
 */
export const getActiveSportForHero = (sportFilters: string[]): string => {
  console.log('🎯 [HERO] getActiveSportForHero called with:', sportFilters);
  
  // If no filters or only 'all', return 'all'
  if (!sportFilters || sportFilters.length === 0 || sportFilters.includes('all')) {
    console.log('  → Returning: all (no filters or includes "all")');
    return 'all';
  }
  
  // Return the last filter (most recently clicked)
  const activeSport = sportFilters[sportFilters.length - 1];
  console.log('  → Returning:', activeSport, '(last filter)');
  return activeSport;
};
