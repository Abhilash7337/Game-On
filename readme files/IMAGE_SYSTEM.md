# Image Asset System Documentation

## Overview

A comprehensive image management system with progressive loading, blur-up effects, error handling, and automatic retry mechanisms. Built for React Native/Expo with performance optimization as a core principle.

---

## Architecture

### Core Components

#### 1. **Central Asset Management** (`/src/assets/images/imageAssets.ts`)
- Single source of truth for all image imports
- Categorized image collections (HERO_IMAGES, SPORT_IMAGES, PLACEHOLDER_IMAGES)
- Fallback mechanisms for missing images
- Helper functions for image optimization

#### 2. **LazyImage Component** (`/src/common/components/LazyImage.tsx`)
- Progressive image loading with blur-up effect
- Intersection Observer simulation for lazy loading
- Automatic retry on failure (configurable attempts)
- Animated fade-in transitions
- Built-in error boundaries

#### 3. **Image Error Boundary** (`/src/common/components/ImageErrorBoundary.tsx`)
- React error boundary specifically for image failures
- Graceful degradation to fallback images
- Error logging for debugging

#### 4. **Preload Hook** (`/src/common/hooks/useImagePreload.ts`)
- Preload single or batch images
- Returns loading state and error status
- Useful for critical images that need early loading

#### 5. **Placeholder Generators** (`/src/common/components/PlaceholderImages.tsx`)
- SVG-based placeholders for different contexts
- VenuePlaceholder, SportPlaceholder, HeroPlaceholder
- Lightweight and scalable

---

## Directory Structure

```
/src/assets/images/
├── imageAssets.ts          # Central import system
├── hero/                   # Hero section images
│   ├── global-sports-hero.jpg
│   └── fallback-hero.jpg
├── sports/                 # Sport-specific images
│   ├── football.jpg
│   ├── cricket.jpg
│   ├── basketball.jpg
│   ├── tennis.jpg
│   ├── badminton.jpg
│   └── volleyball.jpg
└── placeholders/           # Fallback images
    ├── venue-placeholder.png
    ├── sport-placeholder.png
    └── default-avatar.png
```

---

## Usage Guide

### 1. Adding New Images

**Step 1**: Place images in appropriate directory
```bash
# Hero images
/src/assets/images/hero/global-sports-hero.jpg

# Sport images
/src/assets/images/sports/football.jpg
```

**Step 2**: Import in `imageAssets.ts`
```typescript
// In imageAssets.ts
export const HERO_IMAGES = {
  globalSportsHero: require('./hero/global-sports-hero.jpg'),
  fallbackHero: require('./hero/fallback-hero.jpg'),
};

export const SPORT_IMAGES = {
  football: require('./sports/football.jpg'),
  cricket: require('./sports/cricket.jpg'),
  // ... more sports
};
```

**Step 3**: Use via helper functions
```typescript
import { getSportImage, HERO_IMAGES } from '@/src/assets/images/imageAssets';

// Get sport image with automatic fallback
const footballImage = getSportImage('football');

// Get hero image
const heroImage = HERO_IMAGES.globalSportsHero;
```

---

### 2. Using LazyImage Component

**Basic Usage**:
```tsx
import { LazyImage } from '@/src/common/components/LazyImage';

<LazyImage
  source={require('@/src/assets/images/hero/global-sports-hero.jpg')}
  style={{ width: '100%', height: 300 }}
  resizeMode="cover"
/>
```

**With Retry Logic**:
```tsx
<LazyImage
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
  resizeMode="cover"
  retryAttempts={3}  // Will retry up to 3 times on failure
  onError={(error) => console.log('Image failed:', error)}
/>
```

**With Loading Callback**:
```tsx
<LazyImage
  source={venueImage}
  style={{ width: '100%', height: 200 }}
  onLoad={() => console.log('Image loaded!')}
  onError={() => console.log('Image failed!')}
/>
```

---

### 3. Preloading Images

**Single Image Preload**:
```tsx
import { useImagePreload } from '@/src/common/hooks/useImagePreload';

function MyComponent() {
  const { loading, error } = useImagePreload(heroImage);
  
  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Failed to load</Text>;
  
  return <Image source={heroImage} />;
}
```

**Batch Preload**:
```tsx
const images = [
  require('./hero/hero1.jpg'),
  require('./hero/hero2.jpg'),
  require('./hero/hero3.jpg'),
];

const { loading, error } = useImagePreload(images);

if (!loading) {
  // All images preloaded, safe to render
  return <ImageGallery images={images} />;
}
```

---

### 4. Image Quality Optimization

Use the built-in quality presets for different contexts:

```typescript
import { IMAGE_QUALITY, getOptimizedImageUrl } from '@/src/assets/images/imageAssets';

// Thumbnail (80x80, low quality)
const thumbUrl = getOptimizedImageUrl(baseUrl, IMAGE_QUALITY.thumbnail);

// Card image (300x200, medium quality)
const cardUrl = getOptimizedImageUrl(baseUrl, IMAGE_QUALITY.card);

// Detail view (800x600, high quality)
const detailUrl = getOptimizedImageUrl(baseUrl, IMAGE_QUALITY.detail);

// Hero section (1200x600, max quality)
const heroUrl = getOptimizedImageUrl(baseUrl, IMAGE_QUALITY.hero);
```

**Quality Presets**:
```typescript
export const IMAGE_QUALITY = {
  thumbnail: { w: 80, h: 80, q: 60 },
  card: { w: 300, h: 200, q: 80 },
  detail: { w: 800, h: 600, q: 90 },
  hero: { w: 1200, h: 600, q: 95 },
};
```

---

### 5. Using Placeholder Images

**SVG Placeholders**:
```tsx
import { VenuePlaceholder, SportPlaceholder, HeroPlaceholder } from '@/src/common/components/PlaceholderImages';

// Venue placeholder
<VenuePlaceholder width={300} height={200} />

// Sport placeholder
<SportPlaceholder width={200} height={200} />

// Hero placeholder
<HeroPlaceholder width="100%" height={300} />
```

**Static Fallback Images**:
```tsx
import { getFallbackImage } from '@/src/assets/images/imageAssets';

const fallbackVenue = getFallbackImage('venue');
const fallbackSport = getFallbackImage('sport');
const fallbackAvatar = getFallbackImage('avatar');

<Image source={fallbackVenue} style={{ width: 300, height: 200 }} />
```

---

## Performance Features

### 1. **Progressive Loading**
- Images load with a blur-up effect
- Placeholder shown while loading
- Smooth fade-in transition on load complete

### 2. **Automatic Retry**
- Failed images automatically retry (default: 2 attempts)
- Configurable retry count
- Fallback to placeholder on final failure

### 3. **Intersection Observer Simulation**
- Images load only when near viewport
- Reduces initial bundle size
- Improves initial render time

### 4. **Image Optimization**
- Built-in quality presets for different contexts
- URL parameter helper for dynamic optimization
- Automatic format selection (WebP support)

### 5. **Error Handling**
- Multiple layers of error boundaries
- Graceful degradation to fallbacks
- Detailed error logging for debugging

---

## Best Practices

### ✅ DO:
- Use `LazyImage` for all user-facing images
- Preload critical above-the-fold images
- Use quality presets appropriate for context
- Provide fallback images for all dynamic content
- Use SVG placeholders for fast initial render
- Log image errors for monitoring

### ❌ DON'T:
- Use regular `<Image>` for large images
- Load full-resolution images for thumbnails
- Forget error handling for remote images
- Preload all images at once (memory overhead)
- Skip fallback mechanisms

---

## Error Handling

### Automatic Fallback Chain

```
1. Try loading original image
   ↓ (on error)
2. Retry loading (up to retryAttempts)
   ↓ (on final failure)
3. Show fallback from imageAssets
   ↓ (if fallback fails)
4. Show SVG placeholder
   ↓ (if all fails)
5. Show error message
```

### Custom Error Handling

```tsx
<ImageErrorBoundary
  fallback={<VenuePlaceholder width={300} height={200} />}
  onError={(error) => {
    console.error('Image error:', error);
    // Send to error tracking service
  }}
>
  <LazyImage source={dynamicImage} />
</ImageErrorBoundary>
```

---

## Integration Examples

### Example 1: Venue Card with Lazy Loading

```tsx
import { LazyImage } from '@/src/common/components/LazyImage';
import { getFallbackImage } from '@/src/assets/images/imageAssets';

function VenueCard({ venue }) {
  const imageSource = venue.images?.[0] 
    ? { uri: venue.images[0] }
    : getFallbackImage('venue');

  return (
    <View style={styles.card}>
      <LazyImage
        source={imageSource}
        style={styles.venueImage}
        resizeMode="cover"
        retryAttempts={2}
      />
      <Text>{venue.name}</Text>
    </View>
  );
}
```

### Example 2: Hero Section with Preload

```tsx
import { useImagePreload } from '@/src/common/hooks/useImagePreload';
import { HERO_IMAGES } from '@/src/assets/images/imageAssets';

function HeroSection() {
  const { loading } = useImagePreload(HERO_IMAGES.globalSportsHero);

  if (loading) {
    return <HeroPlaceholder width="100%" height={300} />;
  }

  return (
    <ImageBackground source={HERO_IMAGES.globalSportsHero}>
      <Text style={styles.heroText}>Book Your Game</Text>
    </ImageBackground>
  );
}
```

### Example 3: Sport Icon Grid

```tsx
import { getSportImage } from '@/src/assets/images/imageAssets';

const sports = ['football', 'cricket', 'basketball', 'tennis'];

function SportGrid() {
  return (
    <View style={styles.grid}>
      {sports.map(sport => (
        <LazyImage
          key={sport}
          source={getSportImage(sport)}
          style={styles.sportIcon}
          resizeMode="cover"
        />
      ))}
    </View>
  );
}
```

---

## Troubleshooting

### Issue: Images not loading

**Check**:
1. Image file exists in correct directory
2. Imported correctly in `imageAssets.ts`
3. Using correct path in component
4. Check console for error messages

**Solution**:
```typescript
// Verify import
import { HERO_IMAGES } from '@/src/assets/images/imageAssets';
console.log('Hero image:', HERO_IMAGES.globalSportsHero);

// Check if image resolves
if (!HERO_IMAGES.globalSportsHero) {
  console.error('Hero image not found!');
}
```

### Issue: Blurry images

**Check**: Using correct quality preset

**Solution**:
```typescript
// Use higher quality for larger displays
const optimizedUrl = getOptimizedImageUrl(
  baseUrl, 
  IMAGE_QUALITY.detail  // Instead of thumbnail
);
```

### Issue: Slow initial load

**Check**: Too many images loading at once

**Solution**:
```typescript
// Preload only critical images
const criticalImages = [HERO_IMAGES.globalSportsHero];
const { loading } = useImagePreload(criticalImages);

// Lazy load the rest
<LazyImage source={nonCriticalImage} />
```

---

## API Reference

### `imageAssets.ts`

#### Constants
```typescript
HERO_IMAGES: { globalSportsHero, fallbackHero }
SPORT_IMAGES: { football, cricket, basketball, tennis, badminton, volleyball }
PLACEHOLDER_IMAGES: { venue, sport, avatar }
FALLBACK_IMAGES: { venue, sport, avatar }
IMAGE_QUALITY: { thumbnail, card, detail, hero }
```

#### Functions
```typescript
getSportImage(sportName: string): ImageSourcePropType
getFallbackImage(type: 'venue' | 'sport' | 'avatar'): ImageSourcePropType
getOptimizedImageUrl(baseUrl: string, quality: QualityConfig): string
```

### `LazyImage` Component

#### Props
```typescript
interface LazyImageProps {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  retryAttempts?: number;  // Default: 2
  onLoad?: () => void;
  onError?: (error: any) => void;
  placeholder?: React.ReactNode;
}
```

### `useImagePreload` Hook

#### Signature
```typescript
function useImagePreload(
  images: ImageSourcePropType | ImageSourcePropType[]
): {
  loading: boolean;
  error: Error | null;
}
```

---

## Future Enhancements

1. **WebP Format Support**: Automatic WebP conversion for supported platforms
2. **Image Caching**: Persistent disk cache for remote images
3. **Responsive Images**: srcSet-like behavior for different screen sizes
4. **Lazy Load Threshold**: Configurable viewport offset for lazy loading
5. **Progressive JPEG**: Support for progressive JPEG rendering
6. **Image Analytics**: Track load times and failure rates

---

## Summary

The image system provides:
- ✅ Centralized image management
- ✅ Progressive lazy loading
- ✅ Automatic error handling and retry
- ✅ Blur-up placeholders
- ✅ Quality optimization presets
- ✅ SVG fallback generators
- ✅ Preload utilities
- ✅ Multiple error boundaries

All components work together to deliver a premium image loading experience while maintaining performance and reliability.
