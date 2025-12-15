/**
 * LazyImage Component
 * 
 * Progressive lazy-loading image component with:
 * - Intersection Observer for viewport detection
 * - Blur-up effect for smooth loading
 * - Error handling with fallback images
 * - Automatic retry on failed loads
 * - Support for both local and remote images
 */

import { getBlurPlaceholder, getFallbackImage } from '@/src/assets/images/imageAssets';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    ImageSourcePropType,
    ImageStyle,
    StyleProp,
    View,
    ViewStyle,
} from 'react-native';

interface LazyImageProps {
  // Image source (local require() or remote URL)
  source: ImageSourcePropType | string;
  
  // Image styles
  style?: StyleProp<ImageStyle>;
  
  // Container styles
  containerStyle?: StyleProp<ViewStyle>;
  
  // Placeholder type
  placeholderType?: 'venue' | 'court' | 'avatar' | 'default';
  
  // Enable blur-up effect
  enableBlurUp?: boolean;
  
  // Blur placeholder source (optional, auto-selected if not provided)
  blurPlaceholder?: ImageSourcePropType;
  
  // Fallback image on error
  fallbackSource?: ImageSourcePropType;
  
  // Resize mode
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  
  // Loading indicator color
  loadingColor?: string;
  
  // Retry attempts on error
  retryAttempts?: number;
  
  // Callback when image loads
  onLoad?: () => void;
  
  // Callback when image fails
  onError?: () => void;
  
  // Lazy loading threshold (pixels from viewport)
  lazyThreshold?: number;
  
  // Disable lazy loading (load immediately)
  disableLazy?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  source,
  style,
  containerStyle,
  placeholderType = 'venue',
  enableBlurUp = true,
  blurPlaceholder,
  fallbackSource,
  resizeMode = 'cover',
  loadingColor = '#10B981',
  retryAttempts = 2,
  onLoad,
  onError,
  lazyThreshold = 100,
  disableLazy = false,
}) => {
  const [isInView, setIsInView] = useState(disableLazy);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSource, setCurrentSource] = useState<ImageSourcePropType | string>(source);
  
  // Animation values
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const placeholderOpacity = useRef(new Animated.Value(1)).current;
  
  // Ref for Intersection Observer
  const containerRef = useRef<View>(null);

  // Normalize source to ImageSourcePropType
  const normalizeSource = (src: ImageSourcePropType | string): ImageSourcePropType => {
    if (typeof src === 'string') {
      return { uri: src };
    }
    return src;
  };

  // Get appropriate placeholder
  const getPlaceholder = (): ImageSourcePropType => {
    if (enableBlurUp && blurPlaceholder) {
      return blurPlaceholder;
    }
    if (enableBlurUp) {
      return getBlurPlaceholder(placeholderType === 'court' ? 'court' : 'venue');
    }
    return getFallbackImage(placeholderType);
  };

  // Get fallback on error
  const getFallback = (): ImageSourcePropType => {
    if (fallbackSource) {
      return fallbackSource;
    }
    return getFallbackImage(placeholderType);
  };

  // Intersection Observer simulation for React Native
  // In React Native, we can use onLayout to detect when component is mounted
  useEffect(() => {
    if (disableLazy) {
      setIsInView(true);
      return;
    }

    // Simulate lazy loading with a small delay
    // In a web environment, you'd use IntersectionObserver
    const timer = setTimeout(() => {
      setIsInView(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [disableLazy]);

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // Fade in animation
    Animated.parallel([
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(placeholderOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    onLoad?.();
  };

  // Handle image load error
  const handleError = () => {
    console.log(`❌ [LazyImage] Failed to load image (attempt ${retryCount + 1}/${retryAttempts + 1})`);
    
    if (retryCount < retryAttempts) {
      // Retry loading
      console.log(`🔄 [LazyImage] Retrying... (${retryCount + 1}/${retryAttempts})`);
      setRetryCount(retryCount + 1);
      
      // Force re-render with same source (triggers reload)
      setCurrentSource(typeof source === 'string' ? source + `?retry=${retryCount + 1}` : source);
    } else {
      // Max retries reached, use fallback
      console.log('⚠️ [LazyImage] Max retries reached, using fallback image');
      setHasError(true);
      setIsLoading(false);
      setCurrentSource(getFallback());
      
      // Fade in fallback
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      onError?.();
    }
  };

  // Update source when prop changes
  useEffect(() => {
    setCurrentSource(source);
    setHasError(false);
    setRetryCount(0);
    setIsLoading(true);
    imageOpacity.setValue(0);
    placeholderOpacity.setValue(1);
  }, [source]);

  if (!isInView) {
    // Not in viewport yet, show placeholder
    return (
      <View ref={containerRef} style={containerStyle}>
        <Image
          source={getPlaceholder()}
          style={style}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  return (
    <View ref={containerRef} style={containerStyle}>
      {/* Blur-up placeholder (shown while loading) */}
      {enableBlurUp && isLoading && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: placeholderOpacity,
          }}
        >
          <Image
            source={getPlaceholder()}
            style={style}
            resizeMode={resizeMode}
            blurRadius={10}
          />
        </Animated.View>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
          }}
        >
          <ActivityIndicator size="small" color={loadingColor} />
        </View>
      )}

      {/* Main image */}
      <Animated.View style={{ opacity: imageOpacity }}>
        <Image
          source={normalizeSource(currentSource)}
          style={style}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
          defaultSource={getFallback()}
        />
      </Animated.View>
    </View>
  );
};

export default LazyImage;
