import { authSelectionStyles } from '@/styles/screens/AuthSelectionScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthMethod = 'phone' | 'email' | 'google' | 'apple';

export default function AuthSelectionScreen() {
  const router = useRouter();
  const [isBusinessMode, setIsBusinessMode] = React.useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Subtle logo rotation
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const toggleThumbTranslate = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const handleBusinessToggle = () => {
    const newBusinessMode = !isBusinessMode;
    
    Animated.timing(toggleAnim, {
      toValue: newBusinessMode ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    setIsBusinessMode(newBusinessMode);

    if (newBusinessMode) {
      setTimeout(() => {
        router.push('/client-login');
      }, 150);
    }
  };

  const handleAuthMethod = (method: AuthMethod) => {
    switch (method) {
      case 'phone':
        router.push('/phone-login');
        break;
      case 'email':
        router.push('/login');
        break;
      case 'google':
        // Will handle Google auth in login screen
        router.push('/login');
        break;
      case 'apple':
        // Will handle Apple auth in login screen
        router.push('/login');
        break;
    }
  };

  return (
    <View style={authSelectionStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header with GameOn title and toggle - extends to top */}
      <View style={authSelectionStyles.header}>
        <SafeAreaView edges={['top']}>
          <View style={authSelectionStyles.headerContentWrapper}>
            <View style={authSelectionStyles.headerContent}>
              <View style={authSelectionStyles.logoSection}>
                <Animated.View 
                  style={[
                    authSelectionStyles.logo,
                    { transform: [{ rotate: logoRotate }] }
                  ]}
                >
                  <Ionicons name="basketball-outline" size={20} color={colors.primary} />
                </Animated.View>
                <Text style={authSelectionStyles.appName}>GameOn</Text>
              </View>
              
              {/* Toggle Switch */}
              <View style={authSelectionStyles.toggleContainer}>
                <Text style={[
                  authSelectionStyles.toggleLabel,
                  !isBusinessMode && authSelectionStyles.toggleLabelActive
                ]}>
                  Player
                </Text>
                <TouchableOpacity 
                  style={[
                    authSelectionStyles.toggleSwitch,
                    isBusinessMode && authSelectionStyles.toggleSwitchActive
                  ]}
                  onPress={handleBusinessToggle}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[
                    authSelectionStyles.toggleThumb,
                    {
                      transform: [{ translateX: toggleThumbTranslate }]
                    }
                  ]} />
                </TouchableOpacity>
                <Text style={[
                  authSelectionStyles.toggleLabel,
                  isBusinessMode && authSelectionStyles.toggleLabelActive
                ]}>
                  Business
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView style={authSelectionStyles.safeArea} edges={['left', 'right', 'bottom']}>

        {/* Main Content - Centered */}
        <View style={authSelectionStyles.content}>
          <Text style={authSelectionStyles.welcomeText}>Welcome!</Text>
          <Text style={authSelectionStyles.subtitleText}>Choose how you'd like to continue</Text>
        </View>

        {/* Half Card with Auth Options - Cut off at bottom */}
        <View style={authSelectionStyles.cardContainer}>
          <View style={authSelectionStyles.card}>
            {/* Card Handle Indicator */}
            <View style={authSelectionStyles.cardHandle} />
            
            {/* Auth Method Horizontal Row */}
            <View style={authSelectionStyles.authGrid}>
              {/* Phone Auth */}
              <TouchableOpacity 
                style={authSelectionStyles.authButton}
                onPress={() => handleAuthMethod('phone')}
                activeOpacity={0.7}
              >
                <View style={authSelectionStyles.iconContainer}>
                  <Ionicons name="call" size={28} color="#10B981" />
                </View>
                <Text style={authSelectionStyles.authLabel}>Phone</Text>
              </TouchableOpacity>

              {/* Email Auth */}
              <TouchableOpacity 
                style={authSelectionStyles.authButton}
                onPress={() => handleAuthMethod('email')}
                activeOpacity={0.7}
              >
                <View style={authSelectionStyles.iconContainer}>
                  <Ionicons name="mail" size={28} color={colors.primary} />
                </View>
                <Text style={authSelectionStyles.authLabel}>Email</Text>
              </TouchableOpacity>

              {/* Google Auth */}
              <TouchableOpacity 
                style={authSelectionStyles.authButton}
                onPress={() => handleAuthMethod('google')}
                activeOpacity={0.7}
              >
                <View style={authSelectionStyles.iconContainer}>
                  <Ionicons name="logo-google" size={28} color="#DB4437" />
                </View>
                <Text style={authSelectionStyles.authLabel}>Google</Text>
              </TouchableOpacity>

              {/* Apple Auth */}
              <TouchableOpacity 
                style={authSelectionStyles.authButton}
                onPress={() => handleAuthMethod('apple')}
                activeOpacity={0.7}
              >
                <View style={authSelectionStyles.iconContainer}>
                  <Ionicons name="logo-apple" size={28} color="#000" />
                </View>
                <Text style={authSelectionStyles.authLabel}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Extra space to ensure card extends beyond screen */}
            <View style={authSelectionStyles.cardExtension} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
