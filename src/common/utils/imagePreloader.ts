import * as Asset from 'expo-asset';
import { Image } from 'react-native';

/**
 * Image Preloader Utility
 * Preloads venue images and static assets when app launches
 * to prevent loading delays when opening Courts screen
 */

interface PreloadResult {
  success: boolean;
  loadedCount: number;
  failedCount: number;
  totalCount: number;
}

class ImagePreloaderService {
  private preloadedImages: Set<string> = new Set();
  private isPreloading: boolean = false;

  /**
   * Preload remote images (venue photos from URLs)
   */
  async preloadRemoteImages(imageUrls: string[]): Promise<PreloadResult> {
    const uniqueUrls = imageUrls.filter(url => !this.preloadedImages.has(url));
    
    if (uniqueUrls.length === 0) {
      console.log('📸 [PRELOAD] All images already cached');
      return {
        success: true,
        loadedCount: 0,
        failedCount: 0,
        totalCount: 0
      };
    }

    console.log(`📸 [PRELOAD] Starting preload for ${uniqueUrls.length} remote images`);
    
    const results = await Promise.allSettled(
      uniqueUrls.map(url => this.prefetchImage(url))
    );

    const loadedCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    // Mark successfully loaded images
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.preloadedImages.add(uniqueUrls[index]);
      }
    });

    console.log(`✅ [PRELOAD] Completed: ${loadedCount} loaded, ${failedCount} failed`);

    return {
      success: failedCount === 0,
      loadedCount,
      failedCount,
      totalCount: uniqueUrls.length
    };
  }

  /**
   * Preload local static assets (bundled images)
   */
  async preloadStaticAssets(assets: (string | number)[]): Promise<PreloadResult> {
    console.log(`📸 [PRELOAD] Starting preload for ${assets.length} static assets`);

    const results = await Promise.allSettled(
      assets.map(asset => {
        if (typeof asset === 'number') {
          // Require'd asset (e.g., require('@/assets/image.jpg'))
          return Asset.Asset.loadAsync(asset);
        } else {
          // File path
          return Image.prefetch(asset);
        }
      })
    );

    const loadedCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ [PRELOAD] Static assets: ${loadedCount} loaded, ${failedCount} failed`);

    return {
      success: failedCount === 0,
      loadedCount,
      failedCount,
      totalCount: assets.length
    };
  }

  /**
   * Prefetch a single image with timeout
   */
  private prefetchImage(url: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Set timeout to prevent hanging on slow images
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading image: ${url}`));
      }, 10000); // 10 second timeout

      Image.prefetch(url)
        .then(() => {
          clearTimeout(timeout);
          resolve(true);
        })
        .catch(error => {
          clearTimeout(timeout);
          console.warn(`Failed to preload image: ${url}`, error);
          reject(error);
        });
    });
  }

  /**
   * Preload all venue images from storage service
   */
  async preloadVenueImages(): Promise<PreloadResult> {
    if (this.isPreloading) {
      console.log('⏳ [PRELOAD] Already preloading, skipping...');
      return {
        success: false,
        loadedCount: 0,
        failedCount: 0,
        totalCount: 0
      };
    }

    this.isPreloading = true;

    try {
      // Dynamically import to avoid circular dependencies
      const { VenueStorageService } = await import('@/src/common/services/venueStorage');
      const venues = await VenueStorageService.getPublicVenues();

      // Extract all image URLs from venues
      const imageUrls: string[] = [];
      
      venues.forEach(venue => {
        // Main venue image
        if (venue.image && typeof venue.image === 'string') {
          imageUrls.push(venue.image);
        }
        
        // Gallery images
        if (venue.images && Array.isArray(venue.images)) {
          venue.images.forEach(img => {
            if (typeof img === 'string') {
              imageUrls.push(img);
            }
          });
        }
      });

      console.log(`📸 [PRELOAD] Found ${imageUrls.length} venue images to preload`);

      const result = await this.preloadRemoteImages(imageUrls);
      this.isPreloading = false;
      return result;

    } catch (error) {
      console.error('❌ [PRELOAD] Error preloading venue images:', error);
      this.isPreloading = false;
      return {
        success: false,
        loadedCount: 0,
        failedCount: 0,
        totalCount: 0
      };
    }
  }

  /**
   * Preload critical app images (hero, logos, etc.)
   */
  async preloadCriticalAssets(): Promise<PreloadResult> {
    const criticalAssets = [
      // App logo - loaded first for login screens
      require('@/src/assets/images/logo.jpg'),
      // Hero images for all sports
      require('@/src/assets/images/hero/global-sports-hero.jpg'),
      require('@/src/assets/images/sports/basketball.jpg'),
      require('@/src/assets/images/sports/football.jpg'),
      require('@/src/assets/images/sports/tennis.jpg'),
      require('@/src/assets/images/sports/badminton.jpg'),
      require('@/src/assets/images/sports/cricket.jpg'),
      require('@/src/assets/images/sports/volleyball.jpg'),
      // Other critical assets
      require('@/assets/images/partial-react-logo.png'),
      // Add other critical assets here
    ];

    return this.preloadStaticAssets(criticalAssets);
  }

  /**
   * Check if an image is already preloaded
   */
  isImagePreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  /**
   * Clear preload cache
   */
  clearCache(): void {
    this.preloadedImages.clear();
    console.log('🗑️ [PRELOAD] Cache cleared');
  }

  /**
   * Get preload statistics
   */
  getStats() {
    return {
      cachedCount: this.preloadedImages.size,
      isPreloading: this.isPreloading
    };
  }
}

export const imagePreloader = new ImagePreloaderService();
