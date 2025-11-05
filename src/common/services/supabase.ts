import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://woaypxxpvywpptxwmcyu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYXlweHhwdnl3cHB0eHdtY3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MTQ0NDIsImV4cCI6MjA3NTk5MDQ0Mn0.3brYJRPjON5JBs8Km4H5PEGh11eC24oiFl7NKtnvDPQ';

// Create a custom storage adapter that handles SSR
const createCustomStorage = () => {
  // Check if we're in a browser environment
  const isClient = typeof window !== 'undefined';
  
  if (!isClient) {
    // Return a no-op storage for SSR
    return {
      getItem: async (key: string) => null,
      setItem: async (key: string, value: string) => {},
      removeItem: async (key: string) => {},
    };
  }
  
  // Use AsyncStorage for React Native/Expo
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createCustomStorage(),
    autoRefreshToken: true,
    persistSession: typeof window !== 'undefined', // Only persist in browser
    detectSessionInUrl: false,
  },
});

// Database types (generated from Supabase schema)
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
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          type: 'direct' | 'group' | 'game';
          name: string | null;
          created_by: string;
          game_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type?: 'direct' | 'group' | 'game';
          name?: string | null;
          created_by: string;
          game_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'direct' | 'group' | 'game';
          name?: string | null;
          created_by?: string;
          game_id?: string | null;
          updated_at?: string;
        };
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
          last_read_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
          last_read_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
          last_read_at?: string;
          is_active?: boolean;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'system' | 'score';
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'system' | 'score';
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'system' | 'score';
          metadata?: any | null;
          updated_at?: string;
        };
      };
      user_presence: {
        Row: {
          user_id: string;
          is_online: boolean;
          last_seen: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          is_online?: boolean;
          last_seen?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          is_online?: boolean;
          last_seen?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Additional types for the chat functionality
export interface Friend {
  id: string;
  name: string;
  profilePhoto?: string;
  rating?: number;
  isOnline: boolean;
  lastSeen?: Date;
  status: 'pending' | 'accepted' | 'blocked';
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  conversationId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: 'text' | 'image' | 'system' | 'score';
  metadata?: any;
  timestamp: Date;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'game';
  name?: string;
  createdBy: string;
  gameId?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
}