import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Input } from '@/src/common/components/Input';
import { borderRadius, colors, shadows, spacing, typography } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientLoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    ownerName: '',
    address: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignIn = () => {
    // For now, just navigate to client dashboard
    // Later, add client authentication logic here
    
    // Set demo client session
    import('@/src/client/services/clientSession').then(({ ClientSessionManager }) => {
      ClientSessionManager.setSession({
        clientId: 'current-client',
        name: formData.businessName || 'Demo Venue Owner',
        email: formData.email,
        isAuthenticated: true,
      });
    });
    
    Alert.alert('Client Sign In', 'Welcome! Redirecting to your dashboard...', [
      {
        text: 'Continue',
        onPress: () => router.push('/client/dashboard')
      }
    ]);
  };

  const handleSignUp = () => {
    // For now, just show alert
    // Later, add client registration logic here
    
    // Set demo client session
    import('@/src/client/services/clientSession').then(({ ClientSessionManager }) => {
      ClientSessionManager.setSession({
        clientId: 'current-client',
        name: formData.businessName || 'Demo Venue Owner',
        email: formData.email,
        isAuthenticated: true,
      });
    });
    
    Alert.alert('Client Registration', 'Registration successful! Welcome to GameOn Business Portal.', [
      {
        text: 'Continue',
        onPress: () => router.push('/client/dashboard')
      }
    ]);
  };

  const handleBackToMain = () => {
    // Navigate back to main login
    router.push('/login');
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password recovery will be implemented later');
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
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Client Portal"
        subtitle={isSignUp ? "Register your business with GameOn" : "Sign in to manage your venues"}
        backgroundColor={colors.secondary}
      >
        {/* Back to Main Login Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToMain}
        >
          <Ionicons name="arrow-back-outline" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Player Login</Text>
        </TouchableOpacity>
      </AppHeader>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Business Info Banner */}
            <View style={styles.infoBanner}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="business" size={32} color={colors.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Venue Owner Portal</Text>
                <Text style={styles.infoDescription}>
                  Manage your sports facilities, courts, and bookings all in one place
                </Text>
              </View>
            </View>

            {/* Main Form Card */}
            <View style={styles.formCard}>
              {/* Form Title */}
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {isSignUp ? 'Register Your Business' : 'Client Sign In'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isSignUp 
                    ? 'Join our network of sports venue partners' 
                    : 'Access your venue management dashboard'
                  }
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
                    leftIcon="mail-outline"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required
                  />
                </View>

                <View style={styles.fieldSpacing}>
                  <Input
                    label="Phone Number"
                    placeholder="Enter your business phone"
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    leftIcon="call-outline"
                    keyboardType="phone-pad"
                    required
                  />
                </View>

                <View style={styles.fieldSpacing}>
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
                  <View style={styles.fieldSpacing}>
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
                  style={styles.forgotPasswordContainer}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Terms and Conditions for Sign Up */}
              {isSignUp && (
                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    By registering, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </View>
              )}

              {/* Main Action Button */}
              <Button
                title={isSignUp ? 'Register Business' : 'Sign In to Dashboard'}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                variant="primary"
                size="large"
                fullWidth
                style={styles.actionButton}
              />
            </View>

            {/* Features Card - Only for Sign Up */}
            {isSignUp && (
              <View style={styles.featuresCard}>
                <Text style={styles.featuresTitle}>What you get as a partner:</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.featureText}>Easy booking management</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.featureText}>Revenue tracking & analytics</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.featureText}>Customer management tools</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.featureText}>24/7 support & assistance</Text>
                  </View>
                </View>
              </View>
            )}

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 10 : 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    gap: spacing.xs,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
    }),
  },
  backButtonText: {
    color: Platform.OS === 'android' ? colors.secondary : colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  infoBanner: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  infoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  formCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  formSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  formFields: {
    marginBottom: spacing.lg,
  },
  fieldSpacing: {
    marginBottom: spacing.lg,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  termsContainer: {
    marginBottom: spacing.lg,
  },
  termsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.sm,
  },
  termsLink: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  actionButton: {
    marginBottom: 0,
  },
  featuresCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  featuresTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    flex: 1,
  },
  toggleContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  toggleLink: {
    fontSize: typography.fontSize.sm,
    color: colors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
});