import AppHeader from '@/src/common/components/AppHeader';
import { Button } from '@/src/common/components/Button';
import { Input } from '@/src/common/components/Input';
import { PhoneAuthService } from '@/src/common/services/phoneAuth';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '@/styles/screens/PhoneSignupScreen';

export default function PhoneSignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'verification' | 'profile'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    verificationCode: '',
    fullName: '',
  });
  const [verifiedSession, setVerifiedSession] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendCode = async () => {
    if (!formData.phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Validate phone number format
    if (!PhoneAuthService.validatePhoneNumber(formData.phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number (10-15 digits)');
      return;
    }

    setIsLoading(true);

    try {
      const result = await PhoneAuthService.sendVerificationCode(formData.phoneNumber);
      
      if (result.success) {
        Alert.alert('Code Sent', 'Verification code has been sent to your phone number.');
        setStep('verification');
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code');
      }
    } catch {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (formData.verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const result = await PhoneAuthService.verifyCode(formData.phoneNumber, formData.verificationCode);
      
      if (result.success) {
        setVerifiedSession(result); // Store the verified session
        setStep('profile');
      } else {
        Alert.alert('Error', result.error || 'Invalid verification code');
      }
    } catch {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    if (!formData.fullName) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setIsLoading(true);

    try {
      if (!verifiedSession || !verifiedSession.user) {
        Alert.alert('Error', 'Session expired. Please verify your phone number again.');
        setStep('verification');
        return;
      }

      // Create user profile using the verified session
      const result = await PhoneAuthService.createUserProfile(
        verifiedSession.user.id,
        formData.phoneNumber,
        formData.fullName
      );
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'Continue',
            onPress: () => router.push('/(tabs)')
          }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    } catch {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'verification') {
      setStep('phone');
    } else if (step === 'profile') {
      setStep('verification');
    } else {
      router.back();
    }
  };

  const renderPhoneStep = () => (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="call" size={32} color={colors.primary} />
        </View>
        <Text style={styles.formTitle}>Sign up with Phone</Text>
        <Text style={styles.formSubtitle}>
          Enter your phone number to get started. We&apos;ll send you a verification code.
        </Text>
      </View>

      <View style={styles.formFields}>
        <Input
          label="Phone Number"
          placeholder="+1 (555) 123-4567"
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange('phoneNumber', value)}
          leftIcon="call-outline"
          keyboardType="phone-pad"
          required
        />
      </View>

      <Button
        title={isLoading ? 'Sending Code...' : 'Send Verification Code'}
        onPress={handleSendCode}
        variant="primary"
        size="large"
        fullWidth
        disabled={isLoading}
      />
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
        </View>
        <Text style={styles.formTitle}>Verify Your Phone</Text>
        <Text style={styles.formSubtitle}>
          Enter the 6-digit code we sent to {formData.phoneNumber}
        </Text>
      </View>

      <View style={styles.formFields}>
        <Input
          label="Verification Code"
          placeholder="123456"
          value={formData.verificationCode}
          onChangeText={(value) => handleInputChange('verificationCode', value)}
          leftIcon="key-outline"
          keyboardType="number-pad"
          maxLength={6}
          required
        />
      </View>

      <Button
        title={isLoading ? 'Verifying...' : 'Verify Code'}
        onPress={handleVerifyCode}
        variant="primary"
        size="large"
        fullWidth
        disabled={isLoading}
        style={styles.actionButton}
      />

      <TouchableOpacity style={styles.resendContainer} onPress={handleSendCode}>
        <Text style={styles.resendText}>Didn&apos;t receive the code? Resend</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileStep = () => (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={32} color={colors.primary} />
        </View>
        <Text style={styles.formTitle}>Complete Your Profile</Text>
        <Text style={styles.formSubtitle}>
          Tell us your name to complete your account setup.
        </Text>
      </View>

      <View style={styles.formFields}>
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChangeText={(value) => handleInputChange('fullName', value)}
          leftIcon="person-outline"
          required
        />
      </View>

      <Button
        title={isLoading ? 'Creating Account...' : 'Complete Signup'}
        onPress={handleCompleteSignup}
        variant="primary"
        size="large"
        fullWidth
        disabled={isLoading}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="GAME ON"
        subtitle={
          step === 'phone' 
            ? 'Create your account with phone' 
            : step === 'verification' 
            ? 'Verify your code' 
            : 'Complete your profile'
        }
        showBackButton={true}
        onBackPress={handleBack}
      />

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
            {/* Step Content */}
            {step === 'phone' && renderPhoneStep()}
            {step === 'verification' && renderVerificationStep()}
            {step === 'profile' && renderProfileStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
