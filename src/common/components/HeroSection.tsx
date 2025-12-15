/**
 * Cinematic Hero Section Component
 * 
 * Premium hero banner with progressive image loading, blur-up effect,
 * and responsive design. Features gradient overlay and text shadows
 * for maximum readability.
 */

import { HERO_IMAGES, getFallbackImage } from '@/src/assets/images/imageAssets';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  height?: number | string;
  minHeight?: number;
  showParallax?: boolean;
  onLayout?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Book Your Game',
  subtitle = 'Find the perfect venue near you',
  height = '30vh',
  minHeight = 250,
  showParallax = false,
  onLayout,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [dimensions, setDimensions] = useState({ width: SCREEN_WIDTH, height: 300 });
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const placeholderFade = useRef(new Animated.Value(1)).current;
  const parallaxOffset = useRef(new Animated.Value(0)).current;

  // Calculate responsive height
  const getResponsiveHeight = (): number => {
    const screenHeight = Dimensions.get('window').height;
    
    // Mobile: minimum 250px
    if (SCREEN_WIDTH < 768) {
      return Math.max(minHeight, 250);
    }
    // Tablet: 280px
    if (SCREEN_WIDTH < 1024) {
      return Math.max(minHeight, 280);
    }
    // Desktop: 30vh
    return Math.max(minHeight, screenHeight * 0.3);
  };

  const responsiveHeight = getResponsiveHeight();

  // Handle image load
  const handleImageLoad = () => {
    console.log('✅ [HeroSection] Image loaded successfully');
    setImageLoaded(true);
    
    // Fade in the image, fade out placeholder
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(placeholderFade, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle image error
  const handleImageError = () => {
    console.warn('⚠️ [HeroSection] Failed to load hero image, using fallback');
    setImageFailed(true);
    setImageLoaded(true);
    
    // Still fade in even with fallback
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Update dimensions on screen size change
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: getResponsiveHeight() });
    });

    return () => subscription?.remove();
  }, []);

  // Get responsive font sizes
  const getTitleFontSize = (): number => {
    if (SCREEN_WIDTH < 768) return 36; // Mobile
    if (SCREEN_WIDTH < 1024) return 42; // Tablet
    return 48; // Desktop
  };

  const getSubtitleFontSize = (): number => {
    if (SCREEN_WIDTH < 768) return 16; // Mobile
    return 18; // Tablet & Desktop
  };

  // Determine which image to use
  const heroImage = imageFailed 
    ? getFallbackImage('venue') 
    : HERO_IMAGES.globalSportsHero || HERO_IMAGES.fallbackHero;

  return (
    <View 
      style={[styles.container, { height: responsiveHeight }]}
      onLayout={onLayout}
    >
      {/* Blur-up Placeholder (shown while loading) */}
      <Animated.View
        style={[
          styles.placeholderContainer,
          { opacity: placeholderFade },
        ]}
      >
        <View style={[styles.skeleton, { height: responsiveHeight }]} />
      </Animated.View>

      {/* Main Hero Image */}
      <Animated.View
        style={[
          styles.imageContainer,
          { opacity: fadeAnim, height: responsiveHeight },
        ]}
      >
        <ImageBackground
          source={heroImage}
          style={[styles.backgroundImage, { height: responsiveHeight }]}
          resizeMode="cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          imageStyle={styles.imageStyle}
        >
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Hero Content */}
            <View style={styles.contentContainer}>
              <Text 
                style={[
                  styles.title, 
                  { fontSize: getTitleFontSize() }
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
              <Text 
                style={[
                  styles.subtitle,
                  { fontSize: getSubtitleFontSize() }
                ]}
                numberOfLines={2}
              >
                {subtitle}
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  skeleton: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    // Shimmer effect could be added here
  },
  imageContainer: {
    width: '100%',
    zIndex: 2,
  },
  backgroundImage: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    // Additional image styling if needed
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    // Text shadow for readability
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: -0.5,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  subtitle: {
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    // Text shadow for readability
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
});

export default HeroSection;
