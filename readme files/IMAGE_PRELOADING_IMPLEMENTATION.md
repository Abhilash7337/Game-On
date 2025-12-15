# Image Preloading Implementation

## Problem
Venue images were loading slowly when opening the Courts section, causing a poor user experience with delayed image rendering.

## Solution
Implemented a comprehensive image preloading system that loads venue images when the app launches, not when the Courts screen is accessed.

## Changes Made

### 1. Image Preloader Utility (`/src/common/utils/imagePreloader.ts`)
Created a service that:
- **Preloads remote images** (venue photos from URLs) with timeout protection (10s)
- **Preloads static assets** (bundled images like hero image, logos)
- **Caches preloaded images** to avoid redundant loading
- **Provides statistics** on cached images and loading status
- **Non-blocking architecture** - venue images load in background without blocking app launch

Key Features:
- `preloadVenueImages()` - Automatically fetches venues and preloads all images
- `preloadCriticalAssets()` - Preloads essential app images (hero, placeholders)
- `isImagePreloaded()` - Check if image is already cached
- `getStats()` - Monitor preload performance

### 2. App Initialization (`/app/_layout.tsx`)
Integrated preloading into app startup:
```typescript
// Preload critical static assets first (fast)
await imagePreloader.preloadCriticalAssets();

// Preload venue images in background (slower, don't block app)
imagePreloader.preloadVenueImages()
```

**Strategy:**
- Critical assets (hero image, placeholders) load synchronously before splash screen hides
- Venue images load asynchronously in background without blocking app
- Errors don't prevent app launch

### 3. Enhanced Image Component (`/app/(tabs)/courts.tsx`)
Replaced React Native `Image` with `expo-image` for better caching:

**Before:**
```tsx
<Image 
  source={{ uri: imageUrl }} 
  resizeMode="cover"
  defaultSource={require('...')}
/>
```

**After:**
```tsx
<Image 
  source={{ uri: imageUrl }} 
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  placeholder={require('...')}
  priority="high"
/>
```

**Benefits of expo-image:**
- **Persistent disk caching** - Images cached across app restarts
- **Memory + Disk cache** - Fast retrieval from memory, fallback to disk
- **Smooth transitions** - 200ms fade-in animation
- **Placeholder support** - Instant placeholder while loading
- **Priority levels** - High priority for main images, normal for gallery

## Performance Impact

### Before:
- ❌ Images loaded when Courts screen opened
- ❌ Each image fetched individually on-demand
- ❌ No caching strategy
- ❌ Slow initial render with blank images

### After:
- ✅ Images preloaded when app launches
- ✅ Batch preloading with timeout protection
- ✅ Memory + Disk caching (expo-image)
- ✅ Instant image display when Courts screen opens
- ✅ 200ms smooth fade-in animation
- ✅ Non-blocking background loading

## Usage

### Automatic Preloading
Images preload automatically when app launches. No manual intervention needed.

### Manual Preloading (Advanced)
```typescript
import { imagePreloader } from '@/src/common/utils/imagePreloader';

// Preload specific images
await imagePreloader.preloadRemoteImages([
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg'
]);

// Check if image is cached
if (imagePreloader.isImagePreloaded(imageUrl)) {
  console.log('Image ready!');
}

// Get statistics
const stats = imagePreloader.getStats();
console.log(`Cached: ${stats.cachedCount} images`);
```

### Clear Cache (Development)
```typescript
imagePreloader.clearCache();
```

## Technical Details

### Timeout Protection
Each image has a 10-second timeout to prevent hanging on slow/broken URLs:
```typescript
const timeout = setTimeout(() => {
  reject(new Error(`Timeout loading image: ${url}`));
}, 10000);
```

### Cache Strategy
- **expo-image cachePolicy**: `memory-disk`
  - First check: Memory cache (instant)
  - Second check: Disk cache (very fast)
  - Last resort: Network fetch (slow)

### Priority System
- **High priority**: Main venue card images (loaded first)
- **Normal priority**: Gallery preview images (loaded when expanded)

## Monitoring

### Console Logs
- `📸 [PRELOAD] Starting preload for X remote images`
- `✅ [PRELOAD] Completed: X loaded, Y failed`
- `🚀 [APP] Starting image preload...`
- `✅ [APP] All venue images preloaded`

### Error Handling
- Failed images don't block app launch
- Errors logged with `console.warn`
- Fallback to placeholder images

## Future Enhancements
1. **Progressive loading** - Load visible images first, others lazily
2. **Size optimization** - Generate thumbnails for list view, full resolution for details
3. **Background sync** - Update images when new venues added
4. **Analytics** - Track image load times and failures
5. **Network-aware loading** - Skip preload on slow connections

## Testing
Test the implementation:
1. Clear app cache/data
2. Launch app
3. Check console logs for preload activity
4. Navigate to Courts screen - images should appear instantly
5. Test offline mode - images should load from disk cache
