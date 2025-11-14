import { UserAuthService } from '@/src/user/services/userAuth';
import { ClientAuthService } from '@/src/client/services/clientAuth';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [authState, setAuthState] = useState<'loading' | 'user' | 'client' | 'none'>('loading');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check client authentication first
      const currentClient = await ClientAuthService.getCurrentSession();
      if (currentClient) {
        setAuthState('client');
        return;
      }

      // Then check user authentication
      const currentUser = await UserAuthService.getCurrentSession();
      if (currentUser) {
        setAuthState('user');
        return;
      }

      // No authentication found
      setAuthState('none');
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState('none');
    }
  };

  // Show loading while checking authentication
  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (authState === 'client') {
    return <Redirect href="/client/dashboard" />;
  } else if (authState === 'user') {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/auth-selection" />;
  }
}