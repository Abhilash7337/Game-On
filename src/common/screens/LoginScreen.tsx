import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Input } from '@/src/common/components/Input';
import { UserAuthService } from '@/src/user/services/userAuth';
import { borderRadius, colors, shadows, spacing, typography } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
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

    setIsLoading(true);

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
      setIsLoading(false);
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

    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  const handleClientLogin = () => {
    // Navigate to client login page
    router.push('/client-login');
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    setIsLoading(true);

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
      setIsLoading(false);
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
    Alert.alert('Coming Soon', 'Google authentication will be available soon!');
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
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top', 'bottom']}>
      {/* Disable Expo Router default header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Welcome to GameOn"
        subtitle={isSignUp ? "Create your account to get started" : "Sign in to continue"}
      >
        {/* Client Login Button positioned absolutely in top right */}
        <TouchableOpacity 
          style={styles.clientLoginButton}
          onPress={handleClientLogin}
        >
          <Ionicons name="business-outline" size={20} color="#fff" />
          <Text style={styles.clientLoginText}>Client</Text>
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
            {/* Main Form Card */}
            <View style={styles.formCard}>
              {/* Form Title */}
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isSignUp 
                    ? 'Join the GameOn community and start playing!' 
                    : 'Welcome back! Please sign in to continue.'
                  }
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formFields}>
                {isSignUp && (
                  <View style={styles.fieldSpacing}>
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

                <View style={styles.fieldSpacing}>
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

              {/* Main Action Button */}
              <Button
                title={isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                variant="primary"
                size="large"
                fullWidth
                disabled={isLoading}
                style={styles.actionButton}
              />
            </View>

            {/* Social Login Card */}
            <View style={styles.socialContainer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton} onPress={handlePhoneAuth}>
                  <Ionicons name="call" size={24} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleAuth}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={handleAppleAuth}>
                  <Ionicons name="logo-apple" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Social Button Labels */}
              <View style={styles.socialLabels}>
                <Text style={styles.socialLabel}>{isSignUp ? 'Phone' : 'Phone'}</Text>
                <Text style={styles.socialLabel}>Google</Text>
                <Text style={styles.socialLabel}>Apple</Text>
              </View>
            </View>

            {/* Toggle Sign In/Sign Up Card */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
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
  clientLoginButton: {
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
  clientLoginText: {
    color: Platform.OS === 'android' ? colors.primary : colors.textInverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
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
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  actionButton: {
    marginBottom: spacing.xl,
  },
  socialContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
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
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  socialLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  socialLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    width: 56,
  },
});