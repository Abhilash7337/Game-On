// DISABLED: Auth selection screen is no longer used
// Users are now directed directly to the email login page
// This file is kept for reference but the screen is not accessible
// If somehow accessed, it will redirect to login page

import { Redirect } from 'expo-router';

// Safety: If this route is somehow accessed, redirect to login
export default function AuthSelectionDisabled() {
  return <Redirect href="/login" />;
}

// Original export is disabled:
// export { default } from '@/src/common/screens/AuthSelectionScreen';
