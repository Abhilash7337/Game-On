import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Input } from '@/src/common/components/Input';
import { borderRadius, colors, shadows, spacing, typography } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
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

  const handleSignIn = () => {
    // For now, just navigate to the main app
    // Later, add authentication logic here
    Alert.alert('Sign In', 'Authentication will be implemented later', [
      {
        text: 'Continue',
        onPress: () => router.push('/(tabs)')
      }
    ]);
  };

  const handleSignUp = () => {
    // For now, just show alert
    // Later, add registration logic here
    Alert.alert('Sign Up', 'Registration will be implemented later', [
      {
        text: 'Continue',
        onPress: () => router.push('/(tabs)')
      }
    ]);
  };

  const handleClientLogin = () => {
    // Navigate to client login page
    router.push('/client-login');
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

                {isSignUp && (
                  <View style={styles.fieldSpacing}>
                    <Input
                      label="Phone Number"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChangeText={(value) => handleInputChange('phone', value)}
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
                title={isSignUp ? 'Create Account' : 'Sign In'}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                variant="primary"
                size="large"
                fullWidth
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
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={24} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-apple" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                </TouchableOpacity>
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
});