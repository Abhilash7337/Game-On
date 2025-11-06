import { ClientAuthService } from '@/src/client/services/clientAuth';
import { supabase } from '@/src/common/services/supabase';
import { UserAuthService } from '@/src/user/services/userAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  full_name?: string;
  created_at?: string;
}

export interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userType: 'user' | 'client' | null;
  user: AppUser | null;
}

class AppInitService {
  private static listeners: ((state: AppState) => void)[] = [];
  private static currentState: AppState = {
    isLoading: true,
    isAuthenticated: false,
    userType: null,
    user: null,
  };

  // Initialize the app and check for existing sessions
  static async initialize(): Promise<AppState> {
    try {
      this.currentState.isLoading = true;
      this.notifyListeners();

      // Initialize image storage
      this.initializeImageStorage();

      // Check for existing Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Handle session errors (e.g., invalid refresh token)
      if (sessionError) {
        console.error('Session error during initialization:', sessionError);
        if (sessionError.message.includes('Refresh Token') || sessionError.message.includes('Invalid')) {
          console.log('Clearing invalid session during initialization');
          await supabase.auth.signOut();
        }
      }
      
      if (session && session.user && !sessionError) {
        // Try to determine if this is a user or client
        const userSession = await UserAuthService.getCurrentSession();
        const clientSession = await ClientAuthService.getCurrentSession();

        if (userSession) {
          this.currentState = {
            isLoading: false,
            isAuthenticated: true,
            userType: 'user',
            user: userSession,
          };
        } else if (clientSession) {
          this.currentState = {
            isLoading: false,
            isAuthenticated: true,
            userType: 'client',
            user: clientSession,
          };
        } else {
          // Session exists but no profile found, sign out
          await this.signOut();
        }
      } else {
        // No session, check for cached data
        const cachedUserSession = await AsyncStorage.getItem('user_session');
        const cachedClientSession = await AsyncStorage.getItem('client_session');

        if (cachedUserSession) {
          try {
            const userSession = JSON.parse(cachedUserSession);
            this.currentState = {
              isLoading: false,
              isAuthenticated: false, // Mark as false until we verify with server
              userType: 'user',
              user: userSession,
            };
          } catch (error) {
            console.error('Failed to parse cached user session:', error);
            await AsyncStorage.removeItem('user_session');
          }
        } else if (cachedClientSession) {
          try {
            const clientSession = JSON.parse(cachedClientSession);
            this.currentState = {
              isLoading: false,
              isAuthenticated: false, // Mark as false until we verify with server
              userType: 'client',
              user: clientSession,
            };
          } catch (error) {
            console.error('Failed to parse cached client session:', error);
            await AsyncStorage.removeItem('client_session');
          }
        } else {
          this.currentState = {
            isLoading: false,
            isAuthenticated: false,
            userType: null,
            user: null,
          };
        }
      }

      this.notifyListeners();
      return this.currentState;
    } catch (error) {
      console.error('App initialization error:', error);
      this.currentState = {
        isLoading: false,
        isAuthenticated: false,
        userType: null,
        user: null,
      };
      this.notifyListeners();
      return this.currentState;
    }
  }

  // Sign out from the app
  static async signOut(): Promise<void> {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local sessions
      await UserAuthService.signOut();
      await ClientAuthService.signOut();
      
      // Update state
      this.currentState = {
        isLoading: false,
        isAuthenticated: false,
        userType: null,
        user: null,
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  // Update authentication state after successful login
  static updateAuthState(userType: 'user' | 'client', user: AppUser): void {
    this.currentState = {
      isLoading: false,
      isAuthenticated: true,
      userType,
      user,
    };
    this.notifyListeners();
  }

  // Get current app state
  static getCurrentState(): AppState {
    return this.currentState;
  }

  // Subscribe to state changes
  static subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of state changes
  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentState));
  }

  // Set up auth state listener
  static setupAuthListener(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Auth state changed - production apps should use proper logging service
      
      if (event === 'SIGNED_OUT' || !session) {
        this.currentState = {
          isLoading: false,
          isAuthenticated: false,
          userType: null,
          user: null,
        };
        this.notifyListeners();
      } else if (event === 'SIGNED_IN' && session) {
        // Re-initialize to determine user type
        await this.initialize();
      }
    });
  }

  // Initialize image storage
  static async initializeImageStorage(): Promise<void> {
    try {
      const { ImageUploadService } = await import('./imageUpload');
      await ImageUploadService.initializeBucket();
    } catch (error) {
      console.error('Failed to initialize image storage:', error);
    }
  }
}

export { AppInitService };
