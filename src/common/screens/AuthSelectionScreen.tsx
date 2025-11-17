import { Button } from '@/src/common/components/Button';
import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { Input } from '@/src/common/components/Input';
import { LoadingOverlay } from '@/src/common/components/LoadingState';
import { useLoadingStates } from '@/src/common/hooks/useAsyncOperation';
import { dataPrefetchService } from '@/src/common/services/dataPrefetch';
import { GoogleAuthService } from '@/src/common/services/googleAuth';
import { PhoneAuthService } from '@/src/common/services/phoneAuth';
import { ClientAuthService } from '@/src/client/services/clientAuth';
import { UserAuthService } from '@/src/user/services/userAuth';
import { authSelectionStyles as styles } from '@/styles/screens/AuthSelectionScreen';
import { colors, spacing } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthMethod = 'phone' | 'email' | 'google' | 'apple';
type AuthMode = 'signin' | 'signup';

const playerMethods: { id: AuthMethod; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { id: 'phone', label: 'Phone', icon: 'call', color: '#10B981' },
  { id: 'email', label: 'Email', icon: 'mail', color: colors.primary },
  { id: 'google', label: 'Google', icon: 'logo-google', color: '#DB4437' },
  { id: 'apple', label: 'Apple', icon: 'logo-apple', color: '#111' },
];

export default function AuthSelectionScreen() {
  const router = useRouter();
  const { setLoading, isLoading, isAnyLoading } = useLoadingStates();

  const [isBusinessMode, setIsBusinessMode] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [playerEmailForm, setPlayerEmailForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [businessEmailForm, setBusinessEmailForm] = useState({
    businessName: '',
    ownerName: '',
    address: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [phoneStep, setPhoneStep] = useState<'input' | 'otp' | 'profile'>('input');
  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: '',
    otp: '',
    fullName: '',
  });
  const [verifiedPhoneSession, setVerifiedPhoneSession] = useState<any>(null);

  const cardAnimation = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      }),
    ).start();
  }, [logoRotateAnim]);

  useEffect(() => {
    // Only expand when keyboard is visible AND a method is selected
    // 0 = collapsed (no method selected)
    // 1 = expanded (method selected, no keyboard)
    // 2 = keyboard expanded (method selected + keyboard visible)
    let target = 0;
    if (selectedMethod) {
      target = isKeyboardVisible ? 2 : 1;
    }
    Animated.spring(cardAnimation, {
      toValue: target,
      useNativeDriver: false,
      damping: 16,
      stiffness: 120,
    }).start();
  }, [cardAnimation, isKeyboardVisible, selectedMethod]);

  useEffect(() => {
    if (isBusinessMode) {
      setSelectedMethod('email');
    } else {
      setSelectedMethod(null);
      setBusinessEmailForm({
        businessName: '',
        ownerName: '',
        address: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    }
    setAuthMode('signin');
  }, [isBusinessMode]);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cardHeight = cardAnimation.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      styles.dynamicHeights.collapsed,
      styles.dynamicHeights.expanded,
      selectedMethod === 'email' ? styles.dynamicHeights.keyboardEmail : styles.dynamicHeights.keyboardPhone,
    ],
  });

  const availableMethods = useMemo<
    { id: AuthMethod; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[]
  >(() => {
    if (isBusinessMode) {
      return [{ id: 'email', label: 'Email', icon: 'mail', color: colors.primary }];
    }
    return playerMethods;
  }, [isBusinessMode]);

  const handleBusinessToggle = () => {
    setIsBusinessMode(prev => !prev);
  };

  const handleMethodSelect = (method: AuthMethod) => {
    if (isBusinessMode && method !== 'email') {
      Alert.alert('Coming Soon', 'This method will be available for Business accounts soon.');
      return;
    }
    setSelectedMethod(method);
    setPhoneStep('input');
    setPhoneForm({ phoneNumber: '', otp: '', fullName: '' });
  };

  const handleGoogleAuth = async () => {
    setLoading('google', true);
    try {
      const result = await GoogleAuthService.signInWithGoogle();
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Google Sign In Failed', result.error || 'Please try again.');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading('google', false);
    }
  };

  const handlePlayerEmailSubmit = async () => {
    if (!playerEmailForm.email || !playerEmailForm.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (authMode === 'signup') {
      if (!playerEmailForm.fullName) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }
      if (playerEmailForm.password !== playerEmailForm.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (playerEmailForm.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }

      setLoading('player-signup', true);
      try {
        const result = await UserAuthService.signUp(
          playerEmailForm.email.trim(),
          playerEmailForm.password,
          playerEmailForm.fullName.trim(),
        );
        if (!result) {
          Alert.alert('Sign Up Failed', 'Unable to sign up right now. Please try again.');
        } else if (result.success) {
          Alert.alert('Account Created', 'Please verify your email before signing in.', [
            { text: 'OK', onPress: () => setAuthMode('signin') },
          ]);
        } else {
          Alert.alert('Sign Up Failed', result.error || 'Please try again');
        }
      } catch {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      } finally {
        setLoading('player-signup', false);
      }
      return;
    }

    setLoading('player-signin', true);
    try {
        const result = await UserAuthService.signIn(playerEmailForm.email.trim(), playerEmailForm.password);
      if (result && result.success) {
        dataPrefetchService.prefetchAll().catch(() => {});
        Alert.alert('Welcome Back!', 'You are now signed in.', [
          { text: 'Continue', onPress: () => router.replace('/(tabs)') },
        ]);
      } else if (result) {
        Alert.alert('Sign In Failed', result.error || 'Please check your credentials and try again.');
      } else {
        Alert.alert('Sign In Failed', 'Unable to sign in right now. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading('player-signin', false);
    }
  };

  const handleBusinessEmailSubmit = async () => {
    if (!businessEmailForm.email || !businessEmailForm.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (authMode === 'signup') {
      if (!businessEmailForm.businessName || !businessEmailForm.ownerName || !businessEmailForm.address || !businessEmailForm.phone) {
        Alert.alert('Error', 'Please complete all business details');
        return;
      }
      if (businessEmailForm.password !== businessEmailForm.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (businessEmailForm.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return;
      }

      setLoading('business-signup', true);
      try {
        const result = await ClientAuthService.signUp(
          businessEmailForm.email.trim(),
          businessEmailForm.password,
          businessEmailForm.businessName.trim(),
          businessEmailForm.ownerName.trim(),
          businessEmailForm.address.trim(),
          businessEmailForm.phone.trim(),
        );
        if (!result) {
          Alert.alert('Registration Failed', 'Unable to register right now. Please try again.');
        } else if (result.success) {
          Alert.alert('Business Created', 'Verify your email to activate your account.', [
            { text: 'OK', onPress: () => setAuthMode('signin') },
          ]);
        } else {
          Alert.alert('Registration Failed', result.error || 'Please try again.');
        }
      } catch {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      } finally {
        setLoading('business-signup', false);
      }
      return;
    }

    setLoading('business-signin', true);
    try {
        const result = await ClientAuthService.signIn(businessEmailForm.email.trim(), businessEmailForm.password);
      if (result && result.success) {
        Alert.alert('Welcome Back!', 'You are now signed in to your business dashboard.', [
          { text: 'Continue', onPress: () => router.replace('/client/dashboard') },
        ]);
      } else if (result) {
        Alert.alert('Sign In Failed', result.error || 'Please check your credentials and try again.');
      } else {
        Alert.alert('Sign In Failed', 'Unable to sign in right now. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading('business-signin', false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!phoneForm.phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!PhoneAuthService.validatePhoneNumber(phoneForm.phoneNumber)) {
      Alert.alert('Error', 'Enter a valid phone number (10-15 digits)');
      return;
    }

    const loadingKey = authMode === 'signup' ? 'phone-send-signup' : 'phone-send';
    setLoading(loadingKey, true);
    try {
      const result =
        authMode === 'signup'
          ? await PhoneAuthService.sendVerificationCode(phoneForm.phoneNumber, true)
          : await PhoneAuthService.signInWithPhone(phoneForm.phoneNumber);
      if (result.success) {
        setPhoneStep('otp');
        Alert.alert('Code Sent', 'Check your phone for the verification code.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code.');
      }
    } catch {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(loadingKey, false);
    }
  };

  const handleVerifyPhoneCode = async () => {
    if (!phoneForm.otp || phoneForm.otp.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit verification code');
      return;
    }

    const loadingKey = authMode === 'signup' ? 'phone-verify-signup' : 'phone-verify';
    setLoading(loadingKey, true);
    try {
      const result = await PhoneAuthService.verifyCode(phoneForm.phoneNumber, phoneForm.otp);
      if (!result.success || !result.user) {
        Alert.alert('Error', result.error || 'Invalid verification code');
        return;
      }

      if (authMode === 'signup') {
        setVerifiedPhoneSession(result);
        setPhoneStep('profile');
      } else {
        dataPrefetchService.prefetchAll().catch(() => {});
        Alert.alert('Success', 'You are now signed in.', [
          { text: 'Continue', onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setLoading(loadingKey, false);
    }
  };

  const handleCompletePhoneSignup = async () => {
    if (!phoneForm.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading('phone-complete', true);
    try {
      const profileResult = await PhoneAuthService.createUserProfile(
        verifiedPhoneSession.user.id,
        phoneForm.phoneNumber,
        phoneForm.fullName.trim(),
      );
      if (profileResult.success) {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'Continue', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('Error', profileResult.error || 'Failed to create account');
      }
    } catch {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading('phone-complete', false);
    }
  };

  const renderModeToggle = () => (
    <View style={styles.authModeToggle}>
      {(['signin', 'signup'] as AuthMode[]).map(mode => (
        <TouchableOpacity
          key={mode}
          style={[styles.authModeButton, authMode === mode && styles.authModeButtonActive]}
          onPress={() => {
            setAuthMode(mode);
            if (mode === 'signin') {
              setPhoneStep('input');
            }
          }}
        >
          <Text style={[styles.authModeText, authMode === mode && styles.authModeTextActive]}>
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPhoneForm = () => (
    <>
      {phoneStep === 'input' && (
        <View style={styles.phoneFormContainer}>
          <Input
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            leftIcon="call-outline"
            keyboardType="phone-pad"
            value={phoneForm.phoneNumber}
            onChangeText={value => setPhoneForm(prev => ({ ...prev, phoneNumber: value }))}
          />
          <View style={styles.phoneButtonSpacer} />
          <Button
            title={isLoading(authMode === 'signup' ? 'phone-send-signup' : 'phone-send') ? 'Sending...' : 'Send Code'}
            fullWidth
            variant="primary"
            onPress={handleSendPhoneCode}
          />
        </View>
      )}

      {phoneStep === 'otp' && (
        <>
                {phoneStep === 'otp' && (
        <View style={styles.phoneFormContainer}>
          <Input
            label="Verification Code"
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            leftIcon="key-outline"
            value={phoneForm.otp}
            onChangeText={value => setPhoneForm(prev => ({ ...prev, otp: value.replace(/\D/g, '') }))}
          />
          <View style={styles.phoneButtonSpacer} />
          <Button
            title={isLoading(authMode === 'signup' ? 'phone-verify-signup' : 'phone-verify') ? 'Verifying...' : 'Verify Code'}
            fullWidth
            variant="primary"
            onPress={handleVerifyPhoneCode}
          />
          <TouchableOpacity onPress={handleSendPhoneCode} style={{ marginTop: spacing.md }}>
            <Text style={styles.supportLink}>Didn't receive the code? Tap to resend</Text>
          </TouchableOpacity>
        </View>
      )}
        </>
      )}

      {phoneStep === 'profile' && (
        <View style={styles.phoneFormContainer}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            leftIcon="person-outline"
            value={phoneForm.fullName}
            onChangeText={value => setPhoneForm(prev => ({ ...prev, fullName: value }))}
          />
          <View style={styles.phoneButtonSpacer} />
          <Button
            title={isLoading('phone-complete') ? 'Creating Account...' : 'Complete Signup'}
            fullWidth
            variant="primary"
            onPress={handleCompletePhoneSignup}
          />
        </View>
      )}
    </>
  );

  const renderPlayerEmailForm = () => (
    <>
      {authMode === 'signup' && (
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          leftIcon="person-outline"
          value={playerEmailForm.fullName}
          onChangeText={value => setPlayerEmailForm(prev => ({ ...prev, fullName: value }))}
        />
      )}

      <Input
        label="Email"
        placeholder="Enter your email"
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        value={playerEmailForm.email}
        onChangeText={value => setPlayerEmailForm(prev => ({ ...prev, email: value }))}
      />

      <View>
        <Input
          label="Password"
          placeholder="Enter your password"
          leftIcon="lock-closed-outline"
          secureTextEntry
          value={playerEmailForm.password}
          onChangeText={value => setPlayerEmailForm(prev => ({ ...prev, password: value }))}
        />
        {authMode === 'signin' && (
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => Alert.alert('Forgot Password', 'Password reset will be available soon inside this selector.')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>

      {authMode === 'signup' && (
        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          leftIcon="lock-closed-outline"
          secureTextEntry
          value={playerEmailForm.confirmPassword}
          onChangeText={value => setPlayerEmailForm(prev => ({ ...prev, confirmPassword: value }))}
        />
      )}

      <Button
        title={
          isLoading(authMode === 'signup' ? 'player-signup' : 'player-signin')
            ? 'Please wait...'
            : authMode === 'signup'
            ? 'Create Account'
            : 'Sign In'
        }
        fullWidth
        variant="primary"
        onPress={handlePlayerEmailSubmit}
        style={styles.formButton}
      />
    </>
  );

  const renderBusinessEmailForm = () => (
    <>
      <Input
        label="Business Email"
        placeholder="Enter your business email"
        leftIcon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        value={businessEmailForm.email}
        onChangeText={value => setBusinessEmailForm(prev => ({ ...prev, email: value }))}
      />

      <Input
        label="Password"
        placeholder="Enter your password"
        leftIcon="lock-closed-outline"
        secureTextEntry
        value={businessEmailForm.password}
        onChangeText={value => setBusinessEmailForm(prev => ({ ...prev, password: value }))}
      />

      {authMode === 'signup' && (
        <>
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            leftIcon="lock-closed-outline"
            secureTextEntry
            value={businessEmailForm.confirmPassword}
            onChangeText={value => setBusinessEmailForm(prev => ({ ...prev, confirmPassword: value }))}
          />
          <Input
            label="Business Name"
            placeholder="Enter your business/venue name"
            leftIcon="business-outline"
            value={businessEmailForm.businessName}
            onChangeText={value => setBusinessEmailForm(prev => ({ ...prev, businessName: value }))}
          />
          <Input
            label="Owner Name"
            placeholder="Enter owner's full name"
            leftIcon="person-outline"
            value={businessEmailForm.ownerName}
            onChangeText={value => setBusinessEmailForm(prev => ({ ...prev, ownerName: value }))}
          />
          <Input
            label="Business Phone"
            placeholder="+1 (555) 123-4567"
            leftIcon="call-outline"
            keyboardType="phone-pad"
            value={businessEmailForm.phone}
            onChangeText={value => setBusinessEmailForm(prev => ({ ...prev, phone: value }))}
          />
          <Input
            label="Business Address"
            placeholder="Enter your business address"
            leftIcon="location-outline"
            multiline
            value={businessEmailForm.address}
            onChangeText={value => setBusinessEmailForm(prev => ({ ...prev, address: value }))}
          />
        </>
      )}

      <Button
        title={
          isLoading(authMode === 'signup' ? 'business-signup' : 'business-signin')
            ? 'Please wait...'
            : authMode === 'signup'
            ? 'Register Business'
            : 'Sign In to Dashboard'
        }
        fullWidth
        variant="primary"
        onPress={handleBusinessEmailSubmit}
        style={styles.formButton}
      />
    </>
  );

  const renderGoogleForm = () => (
    <View style={styles.centeredContent}>
      <Text style={styles.sectionTitle}>Google Sign In</Text>
      <Text style={styles.sectionSubtitle}>Use your Google account to continue.</Text>
      <Button
        title={isLoading('google') ? 'Connecting...' : 'Continue with Google'}
        onPress={handleGoogleAuth}
        fullWidth
        variant="secondary"
        style={styles.formButton}
      />
    </View>
  );

  const renderComingSoon = (message: string) => (
    <View style={styles.centeredContent}>
      <Text style={styles.sectionTitle}>Coming Soon</Text>
      <Text style={styles.sectionSubtitle}>{message}</Text>
    </View>
  );

  const renderSelectedForm = () => {
    if (!selectedMethod) {
      return <Text style={styles.placeholderText}>Select a method above to continue</Text>;
    }

    if (selectedMethod === 'phone') {
      return renderPhoneForm();
    }

    if (selectedMethod === 'email') {
      return isBusinessMode ? renderBusinessEmailForm() : renderPlayerEmailForm();
    }

    if (selectedMethod === 'google') {
      return isBusinessMode
        ? renderComingSoon('Google sign-in for Business is coming soon.')
        : renderGoogleForm();
    }

    return renderComingSoon('Apple sign-in will be available soon!');
  };

  return (
    <ErrorBoundary>
      <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
        <LoadingOverlay visible={isAnyLoading()} message="Please wait..." />
        <LinearGradient colors={['#0F9D58', '#0B8146']} style={styles.gradient}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <View style={styles.logoSection}>
                <Animated.View style={[styles.logo, { transform: [{ rotate: logoRotate }] }]}>
                  <Ionicons name="basketball-outline" size={20} color="#fff" />
                </Animated.View>
                <Text style={styles.appName}>GameOn</Text>
              </View>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, !isBusinessMode && styles.toggleLabelActive]}>Player</Text>
                <TouchableOpacity style={styles.toggleSwitch} onPress={handleBusinessToggle} activeOpacity={0.8}>
                  <Animated.View
                  style={[
                      styles.toggleThumb,
                      {
                        transform: [{ translateX: isBusinessMode ? 22 : 0 }],
                      },
                    ]}
                  />
                </TouchableOpacity>
                <Text style={[styles.toggleLabel, isBusinessMode && styles.toggleLabelActive]}>Business</Text>
              </View>
            </View>

            <View style={styles.hero}>
              <Text style={styles.welcomeText}>Welcome!</Text>
              <Text style={styles.subtitleText}>Choose how you’d like to continue</Text>
      </View>

            <Animated.View style={[styles.cardContainer, { height: cardHeight }]}>
              <View style={styles.cardHandleWrapper}>
                <View style={styles.cardHandle} />
              </View>

              {selectedMethod && (
                <View style={styles.cardTopRow}>
                  <TouchableOpacity style={styles.backButton} onPress={() => setSelectedMethod(isBusinessMode ? 'email' : null)}>
                    <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                  {renderModeToggle()}
                </View>
              )}

              <View style={styles.methodRow}>
                {availableMethods.map(method => {
                  const isSelected =
                    selectedMethod === method.id || (!selectedMethod && method.id === 'email' && isBusinessMode);
                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[styles.methodButton, isSelected && styles.methodButtonActive]}
                      onPress={() => handleMethodSelect(method.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.methodIcon, isSelected && { borderColor: method.color }]}>
                        <Ionicons name={method.icon} size={24} color={method.color} />
                      </View>
                      <Text style={[styles.methodLabel, isSelected && styles.methodLabelActive]}>{method.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedMethod && <View style={styles.methodSeparator} />}

              <KeyboardAvoidingView
                style={styles.formArea}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {renderSelectedForm()}
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
      </SafeAreaView>
        </LinearGradient>
    </View>
    </ErrorBoundary>
  );
}
