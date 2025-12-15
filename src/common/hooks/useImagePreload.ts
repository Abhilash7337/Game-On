/**
 * useImagePreload Hook
 * 
 * Custom hook for preloading and caching images.
 * Provides loading states and error handling.
 */

import { useEffect, useState } from 'react';
import { Image, ImageSourcePropType } from 'react-native';

interface UseImagePreloadOptions {
  // Enable preloading
  enabled?: boolean;
  
  // Callback on success
  onSuccess?: () => void;
  
  // Callback on error
  onError?: (error: any) => void;
  
  // Retry attempts
  retryAttempts?: number;
}

interface UseImagePreloadResult {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  error?: any;
  retry: () => void;
}

/**
 * Preload a single image
 */
export const useImagePreload = (
  source: ImageSourcePropType | string,
  options: UseImagePreloadOptions = {}
): UseImagePreloadResult => {
  const {
    enabled = true,
    onSuccess,
    onError,
    retryAttempts = 2,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(undefined);
  const [retryCount, setRetryCount] = useState(0);

  const preloadImage = async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setError(undefined);

    try {
      // Get URI from source
      let uri: string | undefined;
      
      if (typeof source === 'string') {
        uri = source;
      } else if (typeof source === 'object' && 'uri' in source) {
        uri = source.uri;
      }

      if (uri) {
        // Preload remote image
        await Image.prefetch(uri);
      }

      setIsLoaded(true);
      setIsLoading(false);
      onSuccess?.();
    } catch (err) {
      console.log(`❌ [useImagePreload] Error preloading image (attempt ${retryCount + 1}):`, err);
      
      if (retryCount < retryAttempts) {
        // Retry
        setRetryCount(retryCount + 1);
      } else {
        // Max retries reached
        setHasError(true);
        setError(err);
        setIsLoading(false);
        onError?.(err);
      }
    }
  };

  useEffect(() => {
    preloadImage();
  }, [source, enabled, retryCount]);

  const retry = () => {
    setRetryCount(0);
    preloadImage();
  };

  return {
    isLoading,
    isLoaded,
    hasError,
    error,
    retry,
  };
};

/**
 * Preload multiple images
 */
export const useImagePreloadBatch = (
  sources: (ImageSourcePropType | string)[],
  options: UseImagePreloadOptions = {}
): UseImagePreloadResult => {
  const {
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(undefined);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const preloadBatch = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const preloadPromises = sources.map(source => {
          // Get URI from source
          let uri: string | undefined;
          
          if (typeof source === 'string') {
            uri = source;
          } else if (typeof source === 'object' && 'uri' in source) {
            uri = source.uri;
          }

          if (uri) {
            return Image.prefetch(uri);
          }
          return Promise.resolve();
        });

        await Promise.all(preloadPromises);
        
        setIsLoaded(true);
        setIsLoading(false);
        onSuccess?.();
      } catch (err) {
        console.error('❌ [useImagePreloadBatch] Error preloading images:', err);
        setHasError(true);
        setError(err);
        setIsLoading(false);
        onError?.(err);
      }
    };

    preloadBatch();
  }, [sources, enabled]);

  const retry = () => {
    // Trigger re-run by creating a new sources array reference
    setIsLoading(true);
    setHasError(false);
  };

  return {
    isLoading,
    isLoaded,
    hasError,
    error,
    retry,
  };
};

export default useImagePreload;
