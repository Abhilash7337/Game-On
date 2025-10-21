import { UserAuthService } from '@/src/user/services/userAuth';
import { editProfileStyles } from '@/styles/screens/EditProfileScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [phoneInput, setPhoneInput] = useState(''); // Separate 10-digit input
  const [phoneVerification, setPhoneVerification] = useState({
    showOtpForm: false,
    otp: '',
    isVerifying: false,
    isSendingOtp: false,
    isVerified: false,
  });
  const [hasExistingPhone, setHasExistingPhone] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await UserAuthService.getCurrentSession();
      
      if (currentUser && currentUser.profile) {
        const nameParts = currentUser.profile.fullName.split(' ');
        const existingPhone = currentUser.profile.phone || '';
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          phone: existingPhone,
          email: currentUser.profile.email || '',
        });
        setHasExistingPhone(!!existingPhone);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }

    setSaving(true);
    
    try {
      // Here you would typically call an API to update user profile
      // For now, we'll just show success and go back
      
      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset phone verification if phone number changes
    if (field === 'phone') {
      setPhoneVerification({
        showOtpForm: false,
        otp: '',
        isVerifying: false,
        isSendingOtp: false,
        isVerified: false
      });
    }
  };

  const sendPhoneOtp = async (fullPhoneNumber: string) => {
    if (!fullPhoneNumber || fullPhoneNumber.length < 13) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Check if phone number already exists (simulate API call)
    const phoneExists = await checkPhoneExists(fullPhoneNumber);
    if (phoneExists) {
      Alert.alert(
        'Phone Number Already Registered', 
        'This phone number is already registered with another account. Please login using your phone number or use a different number.',
        [{ text: 'OK' }]
      );
      return;
    }

    setPhoneVerification(prev => ({ ...prev, isSendingOtp: true }));

    try {
      // Here you would integrate with your OTP service
      // For now, we'll simulate the OTP sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPhoneVerification(prev => ({ 
        ...prev, 
        showOtpForm: true, 
        isSendingOtp: false 
      }));
      
      Alert.alert('OTP Sent', 'Please check your phone for the verification code');
    } catch (error) {
      console.error('OTP send error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      setPhoneVerification(prev => ({ ...prev, isSendingOtp: false }));
    }
  };

  // Simulate checking if phone number exists
  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    // This would be an actual API call in production
    // For demo purposes, let's say phone numbers starting with '999' are already taken
    return phone.startsWith('999');
  };

  const verifyPhoneOtp = async () => {
    if (!phoneVerification.otp || phoneVerification.otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setPhoneVerification(prev => ({ ...prev, isVerifying: true }));

    try {
      // Here you would verify the OTP with your service
      // For now, we'll simulate verification (accept any 6-digit code)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Phone number verified successfully!');
      setPhoneVerification({
        showOtpForm: false,
        otp: '',
        isVerifying: false,
        isSendingOtp: false,
        isVerified: true
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      setPhoneVerification(prev => ({ ...prev, isVerifying: false }));
    }
  };

  if (loading) {
    return (
      <View style={[editProfileStyles.container, editProfileStyles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={editProfileStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[editProfileStyles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity 
          style={editProfileStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={editProfileStyles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={[editProfileStyles.saveButton, saving && editProfileStyles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={editProfileStyles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={editProfileStyles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={editProfileStyles.profilePictureSection}>
          <View style={editProfileStyles.avatarContainer}>
            <View style={editProfileStyles.avatar}>
              <Ionicons name="person" size={50} color={colors.primary} />
            </View>
            <TouchableOpacity style={editProfileStyles.cameraButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={editProfileStyles.changePhotoText}>Change Photo</Text>
        </View>

        {/* Form Fields */}
        <View style={editProfileStyles.formSection}>
          <View style={editProfileStyles.inputGroup}>
            <Text style={editProfileStyles.label}>First Name *</Text>
            <TextInput
              style={editProfileStyles.input}
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              placeholder="Enter your first name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={editProfileStyles.inputGroup}>
            <Text style={editProfileStyles.label}>Last Name</Text>
            <TextInput
              style={editProfileStyles.input}
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              placeholder="Enter your last name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={editProfileStyles.inputGroup}>
            <Text style={editProfileStyles.label}>Phone Number</Text>
            {hasExistingPhone && (
              <Text style={editProfileStyles.phoneNote}>
                Phone number cannot be changed once verified
              </Text>
            )}
            {hasExistingPhone ? (
              <TextInput
                style={[editProfileStyles.input, editProfileStyles.disabledInput]}
                value={formData.phone}
                placeholder="Phone number verified"
                placeholderTextColor={colors.textSecondary}
                editable={false}
              />
            ) : (
              <View style={editProfileStyles.phoneInputContainer}>
                <View style={editProfileStyles.countryCodeContainer}>
                  <Text style={editProfileStyles.countryCode}>+91</Text>
                </View>
                <TextInput
                  style={[editProfileStyles.input, editProfileStyles.phoneNumberInput]}
                  value={phoneInput}
                  onChangeText={(value) => {
                    // Only allow 10 digits
                    if (value.length <= 10 && /^\d*$/.test(value)) {
                      setPhoneInput(value);
                    }
                  }}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {phoneInput.length === 10 && !phoneVerification.showOtpForm && (
                  <TouchableOpacity
                    style={[editProfileStyles.otpButton, phoneVerification.isSendingOtp && editProfileStyles.otpButtonDisabled]}
                    onPress={() => sendPhoneOtp(`+91${phoneInput}`)}
                    disabled={phoneVerification.isSendingOtp}
                  >
                    {phoneVerification.isSendingOtp ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={editProfileStyles.otpButtonText}>Get OTP</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {phoneVerification.showOtpForm && (
              <View style={editProfileStyles.otpFormContainer}>
                <Text style={editProfileStyles.otpLabel}>Enter OTP</Text>
                <View style={editProfileStyles.otpInputContainer}>
                  <TextInput
                    style={editProfileStyles.otpInput}
                    value={phoneVerification.otp}
                    onChangeText={(value) => setPhoneVerification(prev => ({ ...prev, otp: value }))}
                    placeholder="6-digit OTP"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={[editProfileStyles.verifyButton, phoneVerification.isVerifying && editProfileStyles.verifyButtonDisabled]}
                    onPress={verifyPhoneOtp}
                    disabled={phoneVerification.isVerifying}
                  >
                    {phoneVerification.isVerifying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={editProfileStyles.verifyButtonText}>Verify</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={editProfileStyles.inputGroup}>
            <Text style={editProfileStyles.label}>Email</Text>
            <TextInput
              style={editProfileStyles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Additional Options */}
        <View style={editProfileStyles.optionsSection}>
          <TouchableOpacity style={editProfileStyles.optionItem}>
            <View style={editProfileStyles.optionLeft}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
              <Text style={editProfileStyles.optionText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={editProfileStyles.optionItem}>
            <View style={editProfileStyles.optionLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
              <Text style={editProfileStyles.optionText}>Privacy Settings</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
