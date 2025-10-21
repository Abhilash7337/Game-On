import { GoogleAuthService } from '@/src/common/services/googleAuth';
import { supabase } from '@/src/common/services/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        Alert.alert('Authentication Error', 'Failed to complete authentication. Please try again.');
        router.replace('/login');
        return;
      }

      if (session) {
        // Handle Google OAuth callback
        const result = await GoogleAuthService.handleGoogleCallback(session);
        
        if (result.success) {
          Alert.alert('Success', 'Welcome! You have been signed in successfully.', [
            {
              text: 'Continue',
              onPress: () => router.replace('/(tabs)')
            }
          ]);
        } else {
          Alert.alert('Authentication Error', result.error || 'Failed to complete authentication.');
          router.replace('/login');
        }
      } else {
        // No session found, redirect to login
        router.replace('/login');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
          Completing authentication...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 16, color: '#6B7280' }}>
        Redirecting...
      </Text>
    </View>
  );
}
