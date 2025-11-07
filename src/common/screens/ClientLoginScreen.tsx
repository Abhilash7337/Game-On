import { ClientAuthService } from '@/src/client/services/clientAuth';
import { Button } from '@/src/common/components/Button';
import { Input } from '@/src/common/components/Input';
import { LoadingOverlay } from '@/src/common/components/LoadingState';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { dataPrefetchService } from '@/src/common/services/dataPrefetch';
import { clientLoginScreenStyles } from '@/styles/screens/ClientLoginScreen';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { Alert, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: screenHeight } = Dimensions.get('window');
const styles = clientLoginScreenStyles;

export default function ClientLoginScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPlayerMode, setIsPlayerMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toggleAnim = useRef(new Animated.Value(0)).current; // 0 = Business, 1 = Player
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    ownerName: '',
    address: '',
  });

  useEffect(() => {
    // Set toggle initial position based on isPlayerMode
    toggleAnim.setValue(isPlayerMode ? 1 : 0);
  }, []);

  // Toggle thumb position interpolation
  const toggleThumbTranslate = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20], // Move 20 pixels to the right when active
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

    setIsLoading(true);

    try {
      const result = await ClientAuthService.signIn(formData.email, formData.password);
      
      if (result && result.success) {
        // ✅ OPTIMIZATION: Start prefetching data for player screens
        // (Venue owners might switch to player mode)
        console.log('🚀 [CLIENT LOGIN] Starting data prefetch...');
        dataPrefetchService.prefetchAll().catch(err => {
          console.warn('[CLIENT LOGIN] Prefetch failed:', err);
        });
        
        Alert.alert('Success', 'Welcome back to your business dashboard!', [
          {
            text: 'Continue',
            onPress: () => router.replace('/client/dashboard')
          }
        ]);
      } else {
        Alert.alert('Sign In Failed', (result?.error) || 'Please check your credentials and try again');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!formData.email || !formData.password || !formData.businessName || !formData.ownerName) {
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

    setIsLoading(true);

    try {
      const result = await ClientAuthService.signUp(
        formData.email,
        formData.password,
        formData.businessName,
        formData.ownerName,
        formData.address,
        formData.phone
      );
      
      if (result && result.success) {
        Alert.alert('Success', 'Business account created successfully! Please check your email to verify your account.', [
          {
            text: 'Continue',
            onPress: () => {
              setIsSignUp(false);
              setFormData({
                email: formData.email,
                phone: '',
                password: '',
                confirmPassword: '',
                businessName: '',
                ownerName: '',
                address: '',
              });
            }
          }
        ]);
      } else {
        Alert.alert('Registration Failed', (result?.error) || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerToggle = () => {
    const newPlayerMode = !isPlayerMode;
    
    // Animate toggle switch
    Animated.timing(toggleAnim, {
      toValue: newPlayerMode ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    setIsPlayerMode(newPlayerMode);

    // If switching to player mode, navigate to player login
    if (newPlayerMode) {
      setTimeout(() => {
        router.push('/login');
      }, 150); // Faster response
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    setIsLoading(true);

    try {
      const result = await ClientAuthService.resetPassword(formData.email);
      
      if (result && result.success) {
        Alert.alert('Password Reset', 'Password reset email sent! Please check your inbox.');
      } else {
        Alert.alert('Error', (result?.error) || 'Failed to send password reset email');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Reset form when switching modes
    setFormData({
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      ownerName: '',
      address: '',
    });
    // Scroll to top when switching modes
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Disable Expo Router default header */}
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Loading overlay */}
        <LoadingOverlay visible={isLoading} message="Please wait..." />
        
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
          {/* Non-scrolling orange header area */}
          <View style={styles.orangeHeader}>
            {/* Compact Header */}
            <View style={styles.compactHeader}>
              <View style={styles.headerContent}>
                <View style={styles.logoSection}>
                  <View style={styles.compactLogo}>
                    <Ionicons name="basketball-outline" size={20} color="#EA580C" />
                  </View>
                  <Text style={styles.compactAppName}>GameOn</Text>
                </View>
                
                {/* Player Toggle Switch */}
                <View style={styles.playerToggleContainer}>
                  <Text style={[
                    styles.toggleLabel,
                    !isPlayerMode && styles.toggleLabelActive
                  ]}>
                    Business
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.toggleSwitch,
                      isPlayerMode && styles.toggleSwitchActive
                    ]}
                    onPress={handlePlayerToggle}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={[
                      styles.toggleThumb,
                      {
                        transform: [{ translateX: toggleThumbTranslate }]
                      }
                    ]} />
                  </TouchableOpacity>
                  <Text style={[
                    styles.toggleLabel,
                    isPlayerMode && styles.toggleLabelActive
                  ]}>
                    Player
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: isSignUp ? screenHeight * 0.15 : screenHeight * 0.35 }
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              contentInsetAdjustmentBehavior="never"
            >
              <View style={styles.scrollableContent}>

                {/* Glassmorphism Form Card */}
                <View style={styles.glassCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIndicator} />
                    <Text style={styles.cardTitle}>
                      {isSignUp ? 'Register Business' : 'Client Sign In'}
                    </Text>
                  </View>

                  {/* Form Fields */}
                  <View style={styles.formFields}>
                {isSignUp && (
                      <>
                        <View style={styles.fieldSpacing}>
                          <Input
                            label="Business Name"
                            placeholder="Enter your business/venue name"
                            value={formData.businessName}
                            onChangeText={(value) => handleInputChange('businessName', value)}
                            onFocus={handleInputFocus}
                            leftIcon="business-outline"
                            required
                          />
                        </View>

                        <View style={styles.fieldSpacing}>
                          <Input
                            label="Owner Name"
                            placeholder="Enter owner's full name"
                            value={formData.ownerName}
                            onChangeText={(value) => handleInputChange('ownerName', value)}
                            onFocus={handleInputFocus}
                            leftIcon="person-outline"
                            required
                          />
                        </View>

                        <View style={styles.fieldSpacing}>
                          <Input
                            label="Business Address"
                            placeholder="Enter your business address"
                            value={formData.address}
                            onChangeText={(value) => handleInputChange('address', value)}
                            onFocus={handleInputFocus}
                            leftIcon="location-outline"
                            multiline
                            required
                          />
                        </View>
                      </>
                    )}

                    <View style={styles.fieldSpacing}>
                      <Input
                        label="Business Email"
                        placeholder="Enter your business email"
                        value={formData.email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        onFocus={handleInputFocus}
                        leftIcon="mail-outline"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        required
                      />
                    </View>

                    {isSignUp && (
                      <View style={styles.fieldSpacing}>
                        <Input
                          label="Phone Number"
                          placeholder="Enter your business phone"
                          value={formData.phone}
                          onChangeText={(value) => handleInputChange('phone', value)}
                          onFocus={handleInputFocus}
                          leftIcon="call-outline"
                          keyboardType="phone-pad"
                          required
                        />
                      </View>
                    )}

                    <View style={styles.fieldSpacing}>
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
                      <View style={styles.fieldSpacing}>
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
                      style={styles.forgotPasswordContainer}
                      onPress={handleForgotPassword}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  )}

                  {/* Main Action Button */}
                  <Button
                    title={isLoading ? 'Please wait...' : (isSignUp ? 'Register Business' : 'Sign In to Dashboard')}
                    onPress={isSignUp ? handleSignUp : handleSignIn}
                    variant="primary"
                    size="large"
                    fullWidth
                    disabled={isLoading}
                    style={styles.actionButton}
                  />
                </View>

                {/* Toggle Sign In/Sign Up Card */}
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleText}>
                    {isSignUp ? 'Already have a business account?' : "Don't have a business account?"}
                  </Text>
                  <TouchableOpacity onPress={toggleMode}>
                    <Text style={styles.toggleLink}>
                      {isSignUp ? 'Sign In' : 'Register Business'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ErrorBoundary>
  );
}
