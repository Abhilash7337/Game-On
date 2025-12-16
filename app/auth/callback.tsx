import { GoogleAuthService } from '@/src/common/services/googleAuth';
import { supabase } from '@/src/common/services/supabase';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the initial URL that opened the app (for deep link handling)
      const initialUrl = await Linking.getInitialURL();
      console.log('Auth callback - Initial URL:', initialUrl);
      console.log('Auth callback - Params:', params);

      // Check if this is an email verification callback
      // Email verification links contain access_token and refresh_token in the URL fragment
      if (initialUrl) {
        const url = new URL(initialUrl.replace('#', '?')); // Convert fragment to query params
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');
        const type = url.searchParams.get('type');
        const errorDescription = url.searchParams.get('error_description');

        // Check for errors in the URL
        if (errorDescription) {
          console.error('Auth error from URL:', errorDescription);
          Alert.alert('Authentication Error', errorDescription);
          router.replace('/login');
          return;
        }

        // Handle email verification (type=signup or type=recovery)
        if (accessToken && refreshToken) {
          setMessage('Verifying your email...');
          console.log('Email verification callback - Setting session with tokens');
          
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session set error:', error);
            Alert.alert('Verification Error', 'Failed to verify your email. Please try again.');
            router.replace('/login');
            return;
          }

          if (data.session) {
            console.log('Email verified successfully, session established');
            
            // Different messages based on verification type
            const successMessage = type === 'recovery' 
              ? 'Password reset successful! You are now signed in.'
              : 'Email verified successfully! Welcome to GameOn!';
            
            Alert.alert('Success', successMessage, [
              {
                text: 'Continue',
                onPress: () => router.replace('/(tabs)')
              }
            ]);
            return;
          }
        }
      }

      // If not email verification, try to get existing session (Google OAuth flow)
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
          {message}
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
