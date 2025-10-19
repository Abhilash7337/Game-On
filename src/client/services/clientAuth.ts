import { supabase } from '@/src/common/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ClientProfile {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  address?: string;
  phone?: string;
}

export interface AuthClient {
  id: string;
  email: string;
  isAuthenticated: boolean;
  profile?: ClientProfile;
}

class ClientAuthService {
  private static currentClient: AuthClient | null = null;

  // Sign up a new client
  static async signUp(
    email: string, 
    password: string, 
    businessName: string, 
    ownerName: string, 
    address?: string, 
    phone?: string
  ) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create client profile in the database
        const { error: profileError } = await supabase
          .from('clients')
          .insert({
            id: authData.user.id,
            email,
            business_name: businessName,
            owner_name: ownerName,
            address,
            phone,
          });

        if (profileError) throw profileError;

        return { success: true, client: authData.user };
      }
    } catch (error) {
      console.error('Client sign up error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Client sign up failed';
      return { success: false, error: errorMessage };
    }
  }

  // Sign in client
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Get client profile
        const { data: profile, error: profileError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Client profile fetch error:', profileError);
        }

        const client: AuthClient = {
          id: data.user.id,
          email: data.user.email!,
          isAuthenticated: true,
          profile: profile ? {
            id: profile.id,
            email: profile.email,
            businessName: profile.business_name,
            ownerName: profile.owner_name,
            address: profile.address,
            phone: profile.phone,
          } : undefined,
        };

        this.currentClient = client;
        await AsyncStorage.setItem('client_session', JSON.stringify(client));

        return { success: true, client };
      }
    } catch (error) {
      console.error('Client sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Client sign in failed';
      return { success: false, error: errorMessage };
    }
  }

  // Sign out client
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      this.currentClient = null;
      await AsyncStorage.removeItem('client_session');

      return { success: true };
    } catch (error) {
      console.error('Client sign out error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Client sign out failed';
      return { success: false, error: errorMessage };
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        // Check if this user is a client
        const { data: profile } = await supabase
          .from('clients')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const client: AuthClient = {
            id: session.user.id,
            email: session.user.email!,
            isAuthenticated: true,
            profile: {
              id: profile.id,
              email: profile.email,
              businessName: profile.business_name,
              ownerName: profile.owner_name,
              address: profile.address,
              phone: profile.phone,
            },
          };

          this.currentClient = client;
          return client;
        }
      }

      return null;
    } catch (error) {
      console.error('Client session check error:', error);
      return null;
    }
  }

  // Get current client
  static getCurrentClient(): AuthClient | null {
    return this.currentClient;
  }

  // Check if client is authenticated
  static isAuthenticated(): boolean {
    return this.currentClient?.isAuthenticated || false;
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
      console.error('Client reset password error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Client reset password failed';
      return { success: false, error: errorMessage };
    }
  }

  // Update client profile
  static async updateProfile(updates: Partial<ClientProfile>) {
    try {
      if (!this.currentClient) {
        throw new Error('No authenticated client');
      }

      const { error } = await supabase
        .from('clients')
        .update({
          business_name: updates.businessName,
          owner_name: updates.ownerName,
          address: updates.address,
          phone: updates.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', this.currentClient.id);

      if (error) throw error;

      // Update local client data
      if (this.currentClient.profile) {
        this.currentClient.profile = { ...this.currentClient.profile, ...updates };
        await AsyncStorage.setItem('client_session', JSON.stringify(this.currentClient));
      }

      return { success: true };
    } catch (error) {
      console.error('Update client profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Update client profile failed';
      return { success: false, error: errorMessage };
    }
  }
}

export { ClientAuthService };
