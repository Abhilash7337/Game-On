import { Button } from '@/src/common/components/Button';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { Input } from '@/src/common/components/Input';
import { LoadingOverlay } from '@/src/common/components/LoadingState';
import { useLoadingStates } from '@/src/common/hooks/useAsyncOperation';
import { dataPrefetchService } from '@/src/common/services/dataPrefetch';
import { GoogleAuthService } from '@/src/common/services/googleAuth';
import { UserAuthService } from '@/src/user/services/userAuth';
import { loginScreenStyles } from '@/styles/screens/LoginScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const { setLoading, isLoading, isAnyLoading } = useLoadingStates();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  // Animation values (minimal)
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start at 1, no fade-in
  const slideAnim = useRef(new Animated.Value(0)).current; // Start at 0, no slide-in
  const scaleAnim = useRef(new Animated.Value(1)).current; // Start at 1, no scale-in
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const toggleAnim = useRef(new Animated.Value(0)).current; // 0 = Player (default), 1 = Business

  useEffect(() => {
    // Set initial values without animation
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    scaleAnim.setValue(1);
    
    // Set toggle position: 0 for Player (this screen), 1 for Business
    toggleAnim.setValue(0); // Always start at Player position on LoginScreen
    
    // Only keep subtle logo rotation
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 30000, // Slower, more subtle
        useNativeDriver: true,
      })
    ).start();
  }, [fadeAnim, slideAnim, scaleAnim, logoRotateAnim]);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Toggle thumb position interpolation
  const toggleThumbTranslate = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20], // Move 20 pixels to the right when Business is selected
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputFocus = () => {
    // Scroll to show the button above keyboard
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading('signin', true);

    try {
      const result = await UserAuthService.signIn(formData.email, formData.password);
      
      if (result && result.success) {
        // ✅ OPTIMIZATION: Start prefetching data IMMEDIATELY (before navigation)
        console.log('🚀 [LOGIN] Starting data prefetch...');
        const prefetchStartTime = Date.now();
        
        // Start prefetch but DON'T wait for it - show success dialog immediately
        dataPrefetchService.prefetchAll().then(() => {
          const duration = Date.now() - prefetchStartTime;
          console.log(`✅ [LOGIN] Prefetch completed in ${duration}ms`);
        }).catch(err => {
          console.warn('[LOGIN] Background prefetch failed:', err);
          // Non-critical - home screen will trigger if this fails
        });
        
        // Show success alert immediately (prefetch runs in background)
        Alert.alert('Success', 'Welcome back!', [
          {
            text: 'Continue',
            onPress: () => {
              // By the time user clicks Continue and reaches home,
              // prefetch should be 80-100% complete!
              router.replace('/(tabs)');
            }
          }
        ]);
      } else {
        Alert.alert('Sign In Failed', (result?.error) || 'Please check your credentials and try again');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading('signin', false);
    }
  };

  const handleSignUp = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading('signup', true);

    try {
      const result = await UserAuthService.signUp(
        formData.email,
        formData.password,
        formData.fullName
      );
      
      if (result && result.success) {
        // Check if email confirmation is needed
        const message = result.needsEmailConfirmation
          ? 'Account created! Please check your email to verify your account before signing in.'
          : 'Account created successfully! You can now sign in.';
        
        Alert.alert('Success', message, [
          {
            text: 'Continue',
            onPress: () => {
              setIsSignUp(false);
              setFormData({
                email: formData.email,
                phone: '',
                password: '',
                confirmPassword: '',
                fullName: '',
              });
            }
          }
        ]);
      } else {
        Alert.alert('Sign Up Failed', (result?.error) || 'Please try again');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading('signup', false);
    }
  };

  const handleBusinessToggle = () => {
    const newBusinessMode = !isBusinessMode;
    
    // Animate toggle switch
    Animated.timing(toggleAnim, {
      toValue: newBusinessMode ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    setIsBusinessMode(newBusinessMode);

    // If switching to business mode, navigate to client login
    if (newBusinessMode) {
      setTimeout(() => {
        router.push('/client-login');
      }, 150); // Faster response
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    setLoading('forgot', true);

    try {
      const result = await UserAuthService.resetPassword(formData.email);
      
      if (result && result.success) {
        Alert.alert('Password Reset', 'Password reset email sent! Please check your inbox.');
      } else {
        Alert.alert('Error', (result?.error) || 'Failed to send password reset email');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading('forgot', false);
    }
  };

  const handlePhoneAuth = () => {
    // Navigate to appropriate phone screen based on mode
    if (isSignUp) {
      router.push('/phone-signup'); // For signup
    } else {
      router.push('/phone-login'); // For login
    }
  };

  const handleGoogleAuth = async () => {
    // Check if running in Expo Go
    // Expo Go uses 'expo.io' in the app owner, standalone builds don't
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo) {
      Alert.alert(
        'Google Auth Not Available',
        'Google authentication is not supported in Expo Go.\n\nPlease use one of these options:\n\n📧 Email & Password\n📱 Phone Number\n\nTo test Google auth, you need to build a development client or standalone app.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading('google', true);
    
    try {
      console.log('Starting Google authentication...');
      const result = await GoogleAuthService.signInWithGoogle();
      
      console.log('Google auth result:', result);
      
      if (result.success) {
        // Navigate directly without alert to prevent app reload feeling
        router.replace('/(tabs)');
      } else {
        Alert.alert('Google Sign In Failed', result.error || 'Failed to authenticate with Google. Please try again.');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred during Google authentication. Please try again.');
    } finally {
      setLoading('google', false);
    }
  };

  const handleAppleAuth = async () => {
    Alert.alert('Coming Soon', 'Apple authentication will be available soon!');
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Reset form when switching modes
    setFormData({
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    });
    // Scroll to top when switching modes
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ErrorBoundary>
      <View style={loginScreenStyles.container}>
        {/* Disable Expo Router default header */}
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Loading overlay for any loading state */}
        <LoadingOverlay visible={isAnyLoading()} message="Please wait..." />
        
        <SafeAreaView style={loginScreenStyles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          {/* Non-scrolling green header area */}
          <View style={loginScreenStyles.greenHeader}>
          {/* Compact Header */}
          <Animated.View 
            style={[
              loginScreenStyles.compactHeader,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={loginScreenStyles.headerContent}>
              <View style={loginScreenStyles.logoSection}>
                <Animated.View 
                  style={[
                    loginScreenStyles.compactLogo,
                    { transform: [{ rotate: logoRotate }] }
                  ]}
                >
                  <Ionicons name="basketball-outline" size={20} color={colors.primary} />
                </Animated.View>
                <Text style={loginScreenStyles.compactAppName}>GameOn</Text>
              </View>
              
              {/* Traditional Toggle Switch */}
              <View style={loginScreenStyles.businessToggleContainer}>
                <Text style={[
                  loginScreenStyles.toggleLabel,
                  !isBusinessMode && loginScreenStyles.toggleLabelActive
                ]}>
                  Player
                </Text>
                <TouchableOpacity 
                  style={[
                    loginScreenStyles.toggleSwitch,
                    isBusinessMode && loginScreenStyles.toggleSwitchActive
                  ]}
                  onPress={handleBusinessToggle}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[
                    loginScreenStyles.toggleThumb,
                    {
                      transform: [{ translateX: toggleThumbTranslate }]
                    }
                  ]} />
                </TouchableOpacity>
                <Text style={[
                  loginScreenStyles.toggleLabel,
                  isBusinessMode && loginScreenStyles.toggleLabelActive
                ]}>
                  Business
                </Text>
              </View>
            </View>
          </Animated.View>
          </View>

      <KeyboardAvoidingView 
        style={loginScreenStyles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={loginScreenStyles.scrollView}
          contentContainerStyle={[
            loginScreenStyles.scrollContent,
            { paddingTop: isSignUp ? screenHeight * 0.15 : screenHeight * 0.35 }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
        >
          <Animated.View 
            style={[
              loginScreenStyles.scrollableContent,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >

            {/* Glassmorphism Form Card */}
            <Animated.View style={[loginScreenStyles.glassCard, { transform: [{ scale: scaleAnim }] }]}>
              <View style={loginScreenStyles.cardHeader}>
                <View style={loginScreenStyles.cardIndicator} />
                <Text style={loginScreenStyles.cardTitle}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              </View>

              {/* Form Fields */}
              <View style={loginScreenStyles.formFields}>
                {isSignUp && (
                  <View style={loginScreenStyles.fieldSpacing}>
                    <Input
                      label="Full Name"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChangeText={(value) => handleInputChange('fullName', value)}
                      onFocus={handleInputFocus}
                      leftIcon="person-outline"
                      required
                    />
                  </View>
                )}

                <View style={loginScreenStyles.fieldSpacing}>
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    onFocus={handleInputFocus}
                    leftIcon="mail-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required
                  />
                </View>


                <View style={loginScreenStyles.fieldSpacing}>
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    onFocus={handleInputFocus}
                    leftIcon="lock-closed-outline"
                    secureTextEntry
                    required
                  />
                </View>

                {isSignUp && (
                  <View style={loginScreenStyles.fieldSpacing}>
                    <Input
                      label="Confirm Password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      onFocus={handleInputFocus}
                      leftIcon="lock-closed-outline"
                      secureTextEntry
                      required
                    />
                  </View>
                )}
              </View>

              {/* Forgot Password (Only for Sign In) */}
              {!isSignUp && (
                <TouchableOpacity 
                  style={loginScreenStyles.forgotPasswordContainer}
                  onPress={handleForgotPassword}
                >
                  <Text style={loginScreenStyles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Main Action Button */}
              <Button
                title={isLoading(isSignUp ? 'signup' : 'signin') ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                variant="primary"
                size="large"
                fullWidth
                disabled={isLoading(isSignUp ? 'signup' : 'signin')}
                style={loginScreenStyles.actionButton}
              />
            </Animated.View>

            {/* Social Login Card */}
            <View style={loginScreenStyles.socialContainer}>
              <View style={loginScreenStyles.divider}>
                <View style={loginScreenStyles.dividerLine} />
                <Text style={loginScreenStyles.dividerText}>or continue with</Text>
                <View style={loginScreenStyles.dividerLine} />
              </View>

              <View style={loginScreenStyles.socialButtons}>
                <TouchableOpacity style={loginScreenStyles.socialButton} onPress={handlePhoneAuth}>
                  <Ionicons name="call" size={24} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity style={loginScreenStyles.socialButton} onPress={handleGoogleAuth}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={loginScreenStyles.socialButton} onPress={handleAppleAuth}>
                  <Ionicons name="logo-apple" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Social Button Labels */}
              <View style={loginScreenStyles.socialLabels}>
                <Text style={loginScreenStyles.socialLabel}>{isSignUp ? 'Phone' : 'Phone'}</Text>
                <Text style={loginScreenStyles.socialLabel}>Google</Text>
                <Text style={loginScreenStyles.socialLabel}>Apple</Text>
              </View>
            </View>

            {/* Toggle Sign In/Sign Up Card */}
            <View style={loginScreenStyles.toggleContainer}>
              <Text style={loginScreenStyles.toggleText}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={loginScreenStyles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
    </ErrorBoundary>
  );
}
