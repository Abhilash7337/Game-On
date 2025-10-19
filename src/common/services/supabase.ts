import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://woaypxxpvywpptxwmcyu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYXlweHhwdnl3cHB0eHdtY3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MTQ0NDIsImV4cCI6MjA3NTk5MDQ0Mn0.3brYJRPjON5JBs8Km4H5PEGh11eC24oiFl7NKtnvDPQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (you'll need to generate these from your Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          full_name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string;
          phone?: string | null;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          email: string;
          business_name: string;
          owner_name: string;
          address?: string;
          phone?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          business_name: string;
          owner_name: string;
          address?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          business_name?: string;
          owner_name?: string;
          address?: string;
          phone?: string;
          updated_at?: string;
        };
      };
    };
  };
}