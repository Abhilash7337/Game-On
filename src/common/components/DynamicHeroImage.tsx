import { getActiveSportForHero, getHeroImage } from '@/src/assets/images/heroImages';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, StyleSheet, View } from 'react-native';

interface DynamicHeroImageProps {
  sportFilters: string[];
  height?: number;
}

export const DynamicHeroImage: React.FC<DynamicHeroImageProps> = ({ 
  sportFilters,
  height = 200 
}) => {
  const [currentImage, setCurrentImage] = useState(() => {
    const activeSport = getActiveSportForHero(sportFilters);
    return getHeroImage(activeSport);
  });
  
  const [nextImage, setNextImage] = useState(currentImage);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);
  const previousFiltersRef = useRef(sportFilters);

  useEffect(() => {
    // Check if filters actually changed
    const filtersChanged = JSON.stringify(previousFiltersRef.current) !== JSON.stringify(sportFilters);
    
    if (!filtersChanged) {
      return;
    }
    
    previousFiltersRef.current = sportFilters;
    
    const activeSport = getActiveSportForHero(sportFilters);
    const newImage = getHeroImage(activeSport);
    
    console.log('🖼️ [HERO] Sport filter changed to:', activeSport);
    
    // Only transition if image actually changed and not already transitioning
    if (newImage !== currentImage && !isTransitioning.current) {
      isTransitioning.current = true;
      console.log('🎬 [HERO] Starting transition...');
      
      // Set the next image to transition to
      setNextImage(newImage);
      
      // Fade out current image (fast fade out)
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Swap images at the midpoint
        setCurrentImage(newImage);
        
        // Fade in new image (smooth fade in)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          isTransitioning.current = false;
          console.log('✅ [HERO] Transition complete');
        });
      });
    } else if (newImage === currentImage) {
      console.log('⏭️ [HERO] Same image, skipping transition');
    }
  }, [sportFilters]);

  return (
    <View style={[styles.container, { height }]}>
      {/* Next image layer (underneath for smooth transition) */}
      <ImageBackground
        source={nextImage}
        style={styles.heroImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(249, 250, 251, 0.3)', '#F9FAFB']}
          locations={[0, 0.7, 1]}
          style={styles.gradient}
        />
      </ImageBackground>

      {/* Current image layer (on top, fading) */}
      <Animated.View 
        style={[
          styles.animatedOverlay,
          { opacity: fadeAnim }
        ]}
        pointerEvents="none"
      >
        <ImageBackground
          source={currentImage}
          style={styles.heroImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(249, 250, 251, 0.3)', '#F9FAFB']}
            locations={[0, 0.7, 1]}
            style={styles.gradient}
          />
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
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  animatedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
