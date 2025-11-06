import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  size?: number;
  width?: number;
  height?: number;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'venue-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_DIMENSION = 2048; // Max width/height
  private static readonly ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private static readonly COMPRESSION_QUALITY = 0.8; // 80% quality

  /**
   * Validate image before upload
   */
  static async validateImage(uri: string): Promise<ImageValidationResult> {
    try {
      // Fetch the image to check size
      const response = await fetch(uri);
      if (!response.ok) {
        return { valid: false, error: 'Failed to load image' };
      }

      const blob = await response.blob();
      const size = blob.size;

      // Check file size
      if (size > this.MAX_FILE_SIZE) {
        const sizeMB = (size / (1024 * 1024)).toFixed(2);
        return { 
          valid: false, 
          error: `Image too large (${sizeMB}MB). Maximum size is 5MB.`,
          size 
        };
      }

      // Check file format
      if (!this.ALLOWED_FORMATS.includes(blob.type)) {
        return { 
          valid: false, 
          error: `Invalid format. Only JPEG, PNG, and WebP are allowed.` 
        };
      }

      return { 
        valid: true, 
        size
      };
    } catch (error) {
      console.error('Image validation error:', error);
      return { valid: false, error: 'Failed to validate image' };
    }
  }

  /**
   * Upload image to Supabase storage with validation and compression
   */
  static async uploadImage(uri: string, fileName: string): Promise<ImageUploadResult> {
    try {
      console.log('📸 Starting image upload for:', fileName);
      
      // Validate image first
      const validation = await this.validateImage(uri);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Image validation failed'
        };
      }

      console.log('✅ Image validated:', {
        size: `${(validation.size! / 1024).toFixed(2)}KB`
      });

      // Use the original URI (compression can be added later with expo-image-manipulator)
      const processedUri = uri;
      
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const extension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${extension}`;
      
      console.log('📁 Uploading to path: venues/' + uniqueFileName);
      
      // Read the file as ArrayBuffer using fetch
      const response = await fetch(processedUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('💾 File size:', arrayBuffer.byteLength, 'bytes');
      
      // Upload to Supabase storage using ArrayBuffer
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(`venues/${uniqueFileName}`, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        
        // Provide specific error messages for common issues
        let errorMessage = uploadError.message;
        if (uploadError.message.includes('Bucket not found')) {
          errorMessage = 'Storage not configured. Please contact support.';
        } else if (uploadError.message.includes('row-level security')) {
          errorMessage = 'Permission denied. Please sign in again.';
        } else if (uploadError.message.includes('File size')) {
          errorMessage = 'Image too large. Please select a smaller image (max 5MB).';
        }
        
        return {
          success: false,
          error: `Upload failed: ${errorMessage}`
        };
      }

      console.log('✅ Upload successful:', uploadData.path);

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      console.log('🌐 Public URL generated:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(uris: string[]): Promise<{
    success: boolean;
    urls: string[];
    errors: string[];
  }> {
    const results = await Promise.allSettled(
      uris.map((uri, index) => 
        this.uploadImage(uri, `image_${index}.jpg`)
      )
    );

    const urls: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.url) {
        urls.push(result.value.url);
      } else {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        errors.push(`Image ${index + 1}: ${error}`);
      }
    });

    return {
      success: urls.length > 0,
      urls,
      errors
    };
  }

  /**
   * Delete image from Supabase storage
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // Get last two parts (venues/filename)

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Image delete error:', error);
      return false;
    }
  }

  /**
   * Check if image upload bucket exists (bucket should be created via Supabase dashboard)
   */
  static async initializeBucket(): Promise<void> {
    try {
      // Check if the bucket exists by trying to list objects
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('venues', { limit: 1 });
      
      if (error) {
        if (error.message.includes('Bucket not found')) {
          console.warn(`⚠️ Storage bucket '${this.BUCKET_NAME}' not found. Please create it in Supabase dashboard.`);
          console.warn('📋 Run the storage-setup.sql script in your Supabase SQL editor.');
        } else {
          console.error('Error checking bucket:', error);
        }
        return;
      }

      console.log(`✅ Storage bucket '${this.BUCKET_NAME}' is ready`);
    } catch (error) {
      console.error('Error initializing bucket:', error);
    }
  }
}