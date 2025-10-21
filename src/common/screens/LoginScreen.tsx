import { Button } from '@/src/common/components/Button';
import { Input } from '@/src/common/components/Input';
import { LoadingOverlay } from '@/src/common/components/LoadingState';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { useLoadingStates } from '@/src/common/hooks/useAsyncOperation';
import { GoogleAuthService } from '@/src/common/services/googleAuth';
import { UserAuthService } from '@/src/user/services/userAuth';
import { colors } from '@/styles/theme';
import { loginScreenStyles } from '@/styles/screens/LoginScreen';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
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

  useEffect(() => {
    // Set initial values without animation
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
    scaleAnim.setValue(1);
    
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        Alert.alert('Success', 'Welcome back!', [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)')
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
        Alert.alert('Success', 'Account created successfully! Please check your email to verify your account.', [
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
                <Text style={loginScreenStyles.toggleLabel}>Business</Text>
                <TouchableOpacity 
                  style={[
                    loginScreenStyles.toggleSwitch,
                    isBusinessMode && loginScreenStyles.toggleSwitchActive
                  ]}
                  onPress={handleBusinessToggle}
                  activeOpacity={0.8}
                >
                  <View style={[
                    loginScreenStyles.toggleThumb,
                    isBusinessMode && loginScreenStyles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
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
