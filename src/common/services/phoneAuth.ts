import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export interface PhoneAuthResponse {
  success: boolean;
  error?: string;
  session?: Session | null;
  user?: User | null;
}

export class PhoneAuthService {
  /**
   * Check if phone number is already registered
   */
  static async checkPhoneExists(phoneNumber: string): Promise<{ exists: boolean; userId?: string }> {
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Phone check error:', error);
        return { exists: false };
      }

      return { 
        exists: !!data, 
        userId: data?.id 
      };
    } catch (error) {
      console.error('Phone check error:', error);
      return { exists: false };
    }
  }

  /**
   * Send SMS verification code to phone number
   * Uses Supabase Auth with Twilio integration
   */
  static async sendVerificationCode(phoneNumber: string, isSignup: boolean = true): Promise<PhoneAuthResponse> {
    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      // Check if phone already exists for signup
      if (isSignup) {
        const phoneCheck = await this.checkPhoneExists(formattedPhone);
        if (phoneCheck.exists) {
          return {
            success: false,
            error: 'This phone number is already registered. Please sign in instead.'
          };
        }
      }
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        console.error('Phone verification error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to send verification code' 
        };
      }

      return { 
        success: true,
        session: data.session,
        user: data.user
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Verify the SMS code and complete phone authentication
   */
  static async verifyCode(phoneNumber: string, token: string): Promise<PhoneAuthResponse> {
    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token,
        type: 'sms'
      });

      if (error) {
        console.error('Code verification error:', error);
        return { 
          success: false, 
          error: error.message || 'Invalid verification code' 
        };
      }

      if (data.user && data.session) {
        return { 
          success: true,
          session: data.session,
          user: data.user
        };
      }

      return { 
        success: false, 
        error: 'Verification failed' 
      };
    } catch (error) {
      console.error('Code verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify code';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Create user profile after successful phone verification
   */
  static async createUserProfile(userId: string, phoneNumber: string, fullName: string): Promise<PhoneAuthResponse> {
    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        // Profile already exists, just update phone if needed
        if (!existingProfile.phone) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              phone: formattedPhone,
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
          email: null, // No email for phone-only users
          full_name: fullName,
          phone: formattedPhone,
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
   * Complete phone signup flow
   * 1. Send verification code
   * 2. Verify code
   * 3. Create user profile
   */
  static async completePhoneSignup(
    phoneNumber: string, 
    verificationCode: string, 
    fullName: string
  ): Promise<PhoneAuthResponse> {
    try {
      // Step 1: Verify the code
      const verifyResult = await this.verifyCode(phoneNumber, verificationCode);
      
      if (!verifyResult.success || !verifyResult.user) {
        return verifyResult;
      }

      // Step 2: Check if user profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', verifyResult.user.id)
        .single();

      // Step 3: Create profile if it doesn't exist
      if (!existingProfile) {
        const profileResult = await this.createUserProfile(
          verifyResult.user.id, 
          phoneNumber, 
          fullName
        );
        
        if (!profileResult.success) {
          return profileResult;
        }
      }

      return {
        success: true,
        session: verifyResult.session,
        user: verifyResult.user
      };
    } catch (error) {
      console.error('Phone signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Phone signup failed';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Sign in with phone number (for existing users)
   */
  static async signInWithPhone(phoneNumber: string): Promise<PhoneAuthResponse> {
    try {
      // Check if phone exists first
      const phoneCheck = await this.checkPhoneExists(phoneNumber);
      if (!phoneCheck.exists) {
        return {
          success: false,
          error: 'Phone number not found. Please sign up first.'
        };
      }
      
      // Send verification code for existing user
      return this.sendVerificationCode(phoneNumber, false); // isSignup = false
    } catch (error) {
      console.error('Phone signin error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate phone sign in';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Verify phone number for existing email users (during booking, etc.)
   */
  static async verifyPhoneForUser(userId: string, phoneNumber: string, verificationCode: string): Promise<PhoneAuthResponse> {
    try {
      // Verify the code first
      const verifyResult = await this.verifyCode(phoneNumber, verificationCode);
      
      if (!verifyResult.success) {
        return verifyResult;
      }

      // Update user's phone number in the database
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const { error } = await supabase
        .from('users')
        .update({ 
          phone: formattedPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Phone update error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update phone number';
        return { 
          success: false, 
          error: errorMessage
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Phone verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify phone number';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // For international numbers, just add + if not present
    if (digits.length > 10) {
      return phoneNumber.startsWith('+') ? phoneNumber : `+${digits}`;
    }
    
    return phoneNumber;
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Must be at least 10 digits (US) or up to 15 digits (international)
    return digits.length >= 10 && digits.length <= 15;
  }
}
