import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResponse {
  success: boolean;
  error?: string;
  session?: Session | null;
  user?: User | null;
}

export class GoogleAuthService {
  /**
   * Sign in with Google using Supabase OAuth with proper React Native handling
   */
  static async signInWithGoogle(): Promise<GoogleAuthResponse> {
    try {
      // Create a redirect URL for Expo
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'sportsvenueapp',
        path: 'auth/callback'
      });

      console.log('Redirect URL:', redirectUrl);
      
      // For development, also try the Expo development URL
      const devRedirectUrl = AuthSession.makeRedirectUri({
        path: 'auth/callback'
      });
      
      console.log('Dev Redirect URL:', devRedirectUrl);
      
      // Use the development URL for now
      const finalRedirectUrl = __DEV__ ? devRedirectUrl : redirectUrl;

      // Start OAuth flow with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to authenticate with Google' 
        };
      }

      // For React Native, the OAuth flow opens in browser
      if (data.url) {
        console.log('Opening OAuth URL:', data.url);
        
        // Open the OAuth URL in browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          finalRedirectUrl
        );

        console.log('OAuth result:', result);

        if (result.type === 'success' && result.url) {
          // Parse the callback URL
          const callbackUrl = result.url;
          console.log('Callback URL:', callbackUrl);
          
          // Handle the callback URL to extract session info
          const authResult = await this.handleOAuthCallback(callbackUrl);
          
          // Don't reload the app, just return the result
          return authResult;
        } else if (result.type === 'cancel') {
          return {
            success: false,
            error: 'Authentication was cancelled by user'
          };
        } else {
          return {
            success: false,
            error: 'Authentication failed or was interrupted'
          };
        }
      }

      return { 
        success: false,
        error: 'Failed to start authentication flow'
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Handle OAuth callback URL and extract session
   */
  static async handleOAuthCallback(callbackUrl: string): Promise<GoogleAuthResponse> {
    try {
      // Extract tokens from callback URL
      const url = new URL(callbackUrl);
      const fragment = url.hash.substring(1);
      const params = new URLSearchParams(fragment);
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const error = params.get('error');
      
      if (error) {
        return {
          success: false,
          error: `OAuth error: ${error}`
        };
      }

      if (accessToken) {
        // Set the session in Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          return {
            success: false,
            error: 'Failed to establish session'
          };
        }

        if (sessionData.session && sessionData.user) {
          // Create or update user profile
          const profileResult = await this.createUserProfile(
            sessionData.user.id,
            sessionData.user.email || '',
            sessionData.user.user_metadata?.full_name || 
            sessionData.user.user_metadata?.name || 
            'Google User'
          );

          if (!profileResult.success) {
            return profileResult;
          }

          return {
            success: true,
            session: sessionData.session,
            user: sessionData.user
          };
        }
      }

      return {
        success: false,
        error: 'No access token received'
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        error: 'Failed to process authentication callback'
      };
    }
  }

  /**
   * Create user profile after successful Google authentication
   */
  static async createUserProfile(userId: string, email: string, fullName: string): Promise<GoogleAuthResponse> {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        // Profile already exists, just update if needed
        if (!existingProfile.email || !existingProfile.full_name) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              email: email,
              full_name: fullName,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Profile update error:', updateError);
            return { 
              success: false, 
              error: 'Failed to update user profile' 
            };
          }
        }
        return { success: true };
      }

      // Create new profile
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          phone: null, // No phone for Google users initially
        });

      if (error) {
        console.error('Profile creation error:', error);
        return { 
          success: false, 
          error: 'Failed to create user profile' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Profile creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user profile';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Handle Google OAuth callback and complete user setup
   */
  static async handleGoogleCallback(session: Session): Promise<GoogleAuthResponse> {
    try {
      if (!session.user) {
        return {
          success: false,
          error: 'No user data received from Google'
        };
      }

      const user = session.user;
      const email = user.email || '';
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || 'Google User';

      // Create or update user profile
      const profileResult = await this.createUserProfile(user.id, email, fullName);
      
      if (!profileResult.success) {
        return profileResult;
      }

      return {
        success: true,
        session: session,
        user: user
      };
    } catch (error) {
      console.error('Google callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process Google authentication';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
