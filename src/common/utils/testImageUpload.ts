// Quick test to verify image upload works
// Run this in your app to test the upload functionality

import { ImageUploadService } from '@/src/common/services/imageUpload';

export async function testImageUpload() {
  try {
    // Initialize the bucket first
    await ImageUploadService.initializeBucket();
    
    // Test with a placeholder image URL
    const testImageUrl = 'https://via.placeholder.com/400x300/047857/ffffff?text=Test+Image';
    
    console.log('🧪 Testing image upload...');
    
    const result = await ImageUploadService.uploadImage(testImageUrl, 'test_image.jpg');
    
    if (result.success) {
      console.log('✅ Upload successful!');
      console.log('📸 Image URL:', result.url);
      return result.url;
    } else {
      console.log('❌ Upload failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Test error:', error);
    return null;
  }
}

// Usage in your component:
// const testUrl = await testImageUpload();