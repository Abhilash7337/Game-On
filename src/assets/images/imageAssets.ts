/**
 * Central Image Assets Configuration
 * 
 * This file manages all image imports and provides fallback mechanisms.
 * All images should be imported through this file for consistency.
 */

// ============================================
// HERO IMAGES
// ============================================

// Main hero background image
// TODO: Replace with actual image once provided
export const HERO_IMAGES = {
  globalSportsHero: require('./hero/global-sports-hero.jpg'),
  // Fallback hero image (using existing asset)
  fallbackHero: require('../../../assets/images/partial-react-logo.png'),
};

// ============================================
// SPORT CATEGORY IMAGES
// ============================================

// Individual sport images for categories
// TODO: Replace with actual images once provided
export const SPORT_IMAGES = {
  football: require('./sports/football.jpg'),
  cricket: require('./sports/cricket.jpg'),
  basketball: require('./sports/basketball.jpg'),
  tennis: require('./sports/tennis.jpg'),
  badminton: require('./sports/badminton.jpg'),
  volleyball: require('./sports/volleyball.jpg'),
  // Fallback for unlisted sports
  default: require('../../../assets/images/partial-react-logo.png'),
};

// ============================================
// PLACEHOLDER IMAGES
// ============================================

// Placeholder images for loading states
// Using fallback images until custom placeholders are created
export const PLACEHOLDER_IMAGES = {
  venue: require('../../../assets/images/partial-react-logo.png'),
  court: require('../../../assets/images/partial-react-logo.png'),
  avatar: require('../../../assets/images/partial-react-logo.png'),
  sport: require('../../../assets/images/partial-react-logo.png'),
  // Blur-up placeholder (using same for now)
  blurVenue: require('../../../assets/images/partial-react-logo.png'),
  blurCourt: require('../../../assets/images/partial-react-logo.png'),
};

// ============================================
// FALLBACK IMAGES (Using existing assets)
// ============================================

export const FALLBACK_IMAGES = {
  default: require('../../../assets/images/partial-react-logo.png'),
  venue: require('../../../assets/images/partial-react-logo.png'),
  court: require('../../../assets/images/partial-react-logo.png'),
  avatar: require('../../../assets/images/partial-react-logo.png'),
};

// ============================================
// IMAGE HELPERS
// ============================================

/**
 * Get sport image by sport name with fallback
 */
export const getSportImage = (sportName: string) => {
  const normalizedSport = sportName?.toLowerCase().trim();
  
  const sportMap: { [key: string]: any } = {
    football: SPORT_IMAGES.football,
    soccer: SPORT_IMAGES.football,
    cricket: SPORT_IMAGES.cricket,
    basketball: SPORT_IMAGES.basketball,
    tennis: SPORT_IMAGES.tennis,
    badminton: SPORT_IMAGES.badminton,
    volleyball: SPORT_IMAGES.volleyball,
  };

  return sportMap[normalizedSport] || SPORT_IMAGES.default;
};

/**
 * Get placeholder image by type
 */
export const getPlaceholderImage = (type: 'venue' | 'court' | 'avatar' | 'sport' = 'venue') => {
  switch (type) {
    case 'venue':
      return PLACEHOLDER_IMAGES.venue;
    case 'court':
      return PLACEHOLDER_IMAGES.court;
    case 'avatar':
      return PLACEHOLDER_IMAGES.avatar;
    case 'sport':
      return PLACEHOLDER_IMAGES.sport;
    default:
      return FALLBACK_IMAGES.default;
  }
};

/**
 * Get blur-up placeholder for progressive loading
 */
export const getBlurPlaceholder = (type: 'venue' | 'court' = 'venue') => {
  switch (type) {
    case 'venue':
      return PLACEHOLDER_IMAGES.blurVenue;
    case 'court':
      return PLACEHOLDER_IMAGES.blurCourt;
    default:
      return FALLBACK_IMAGES.default;
  }
};

/**
 * Get fallback image by type
 */
export const getFallbackImage = (type: 'venue' | 'court' | 'avatar' | 'default' = 'default') => {
  return FALLBACK_IMAGES[type] || FALLBACK_IMAGES.default;
};

// ============================================
// IMAGE QUALITY CONFIGURATIONS
// ============================================

/**
 * Image quality settings for different use cases
 */
export const IMAGE_QUALITY = {
  thumbnail: {
    width: 150,
    height: 100,
    quality: 70,
  },
  card: {
    width: 400,
    height: 250,
    quality: 80,
  },
  detail: {
    width: 800,
    height: 600,
    quality: 90,
  },
  hero: {
    width: 1200,
    height: 800,
    quality: 85,
  },
};

/**
 * Generate optimized image URL for Supabase storage or external URLs
 */
export const getOptimizedImageUrl = (
  url: string,
  size: 'thumbnail' | 'card' | 'detail' | 'hero' = 'card'
): string => {
  if (!url) return '';
  
  // If it's a local asset, return as-is
  if (typeof url === 'number' || !url.startsWith('http')) {
    return url;
  }

  // For external URLs, add query parameters if supported
  const config = IMAGE_QUALITY[size];
  const params = new URLSearchParams({
    w: config.width.toString(),
    h: config.height.toString(),
    q: config.quality.toString(),
    fit: 'cover',
  });

  // Check if URL already has query params
  const separator = url.includes('?') ? '&' : '?';
  
  return `${url}${separator}${params.toString()}`;
};

/**
 * Validate if image URL is accessible
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    if (!url || typeof url !== 'string') return false;
    
    // For local assets (numbers), always return true
    if (typeof url === 'number') return true;
    
    // For URLs, check if accessible
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// ============================================
// EXPORTS
// ============================================

export default {
  HERO_IMAGES,
  SPORT_IMAGES,
  PLACEHOLDER_IMAGES,
  FALLBACK_IMAGES,
  getSportImage,
  getPlaceholderImage,
  getBlurPlaceholder,
  getFallbackImage,
  getOptimizedImageUrl,
  validateImageUrl,
  IMAGE_QUALITY,
};
