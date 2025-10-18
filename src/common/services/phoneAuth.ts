import { supabase } from './supabase';

export interface PhoneAuthResponse {
  success: boolean;
  error?: string;
  session?: any;
  user?: any;
}

export class PhoneAuthService {
  /**
   * Send SMS verification code to phone number
   * Uses Supabase Auth with Twilio integration
   */
  static async sendVerificationCode(phoneNumber: string): Promise<PhoneAuthResponse> {
    try {
      // Format phone number (ensure it starts with +)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
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
    } catch (error: any) {
      console.error('Phone verification error:', error);
      return { 
        success: false, 
        error: 'Failed to send verification code. Please try again.' 
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
    } catch (error: any) {
      console.error('Code verification error:', error);
      return { 
        success: false, 
        error: 'Failed to verify code. Please try again.' 
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
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `${userId}@phone.local`, // Temporary email for phone-only users
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
    } catch (error: any) {
      console.error('Profile creation error:', error);
      return { 
        success: false, 
        error: 'Failed to create user profile' 
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
    } catch (error: any) {
      console.error('Phone signup error:', error);
      return { 
        success: false, 
        error: 'Failed to complete phone signup' 
      };
    }
  }

  /**
   * Sign in with phone number (for existing users)
   */
  static async signInWithPhone(phoneNumber: string): Promise<PhoneAuthResponse> {
    return this.sendVerificationCode(phoneNumber);
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
        return { 
          success: false, 
          error: 'Failed to update phone number' 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Phone verification error:', error);
      return { 
        success: false, 
        error: 'Failed to verify phone number' 
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
