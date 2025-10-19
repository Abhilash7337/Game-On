import { supabase } from '@/src/common/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  isAuthenticated: boolean;
  profile?: UserProfile;
}

class UserAuthService {
  private static currentUser: AuthUser | null = null;

  // Sign up a new user
  static async signUp(email: string, password: string, fullName: string, phone?: string) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile in the database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            full_name: fullName,
            phone: phone || null,
          });

        if (profileError) throw profileError;

        return { success: true, user: authData.user };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      return { success: false, error: errorMessage };
    }
  }

  // Sign in user
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        }

        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          isAuthenticated: true,
          profile: profile ? {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            phone: profile.phone,
          } : undefined,
        };

        this.currentUser = user;
        await AsyncStorage.setItem('user_session', JSON.stringify(user));

        return { success: true, user };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      return { success: false, error: errorMessage };
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      this.currentUser = null;
      await AsyncStorage.removeItem('user_session');

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      return { success: false, error: errorMessage };
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          isAuthenticated: true,
          profile: profile ? {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name,
            phone: profile.phone,
          } : undefined,
        };

        this.currentUser = user;
        return user;
      }

      return null;
    } catch (error) {
      console.error('Session check error:', error);
      return null;
    }
  }

  // Get current user
  static getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.currentUser?.isAuthenticated || false;
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Reset password failed';
      return { success: false, error: errorMessage };
    }
  }

  // Update user profile
  static async updateProfile(updates: Partial<UserProfile>) {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: updates.fullName,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentUser.id);

      if (error) throw error;

      // Update local user data
      if (this.currentUser.profile) {
        this.currentUser.profile = { ...this.currentUser.profile, ...updates };
        await AsyncStorage.setItem('user_session', JSON.stringify(this.currentUser));
      }

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Update profile failed';
      return { success: false, error: errorMessage };
    }
  }
}

export { UserAuthService };
