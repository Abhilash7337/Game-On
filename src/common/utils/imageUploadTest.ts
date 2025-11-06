import { ImageUploadService } from '../services/imageUpload';
import { supabase } from '../services/supabase';

export class ImageUploadTestService {
  /**
   * Test image upload functionality
   */
  static async testImageUpload(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🧪 Testing image upload functionality...');

      // Check if Supabase is connected
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && !error.message.includes('session')) {
        return {
          success: false,
          message: 'Supabase connection failed',
          details: error
        };
      }

      // Check if storage is accessible
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        return {
          success: false,
          message: 'Storage access failed',
          details: bucketError
        };
      }

      // Initialize bucket
      await ImageUploadService.initializeBucket();

      // Check if bucket exists
      const venueImagesBucket = buckets.find(bucket => bucket.name === 'venue-images');
      
      return {
        success: true,
        message: 'Image upload system ready',
        details: {
          bucketsAvailable: buckets.length,
          venueImagesBucketExists: !!venueImagesBucket,
          userAuthenticated: !!user
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Image upload test failed',
        details: error
      };
    }
  }

  /**
   * Create a test image URL for testing
   */
  static createTestImageUrl(): string {
    return 'https://via.placeholder.com/400x300/047857/ffffff?text=Test+Venue+Image';
  }
}