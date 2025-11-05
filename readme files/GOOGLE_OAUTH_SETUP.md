# Google OAuth Setup Guide

## 🔧 Supabase Configuration

### 1. Add Google OAuth Provider in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Providers**
3. Find **Google** and click **Enable**
4. Add your Google OAuth credentials:

```
Client ID: [Your Google Cloud OAuth Client ID]
Client Secret: [Your Google Cloud OAuth Client Secret]
```

### 2. Configure Redirect URLs in Supabase

Add these redirect URLs in the Supabase Google provider settings:

**For Development:**
```
sportsvenueapp://auth/callback
exp://localhost:8081/--/auth/callback
http://localhost:8081/auth/callback
```

**For Production:**
```
sportsvenueapp://auth/callback
https://your-domain.com/auth/callback
```

## 🌐 Google Cloud Console Configuration

### 1. OAuth 2.0 Client IDs Setup

In your Google Cloud Console OAuth client:

**Authorized JavaScript origins:**
```
http://localhost:8081
https://your-supabase-project.supabase.co
```

**Authorized redirect URIs:**
```
https://your-supabase-project.supabase.co/auth/v1/callback
sportsvenueapp://auth/callback
exp://localhost:8081/--/auth/callback
http://localhost:8081/auth/callback
```

### 2. Required Scopes

Ensure these scopes are enabled:
- `openid`
- `email`
- `profile`

## 📱 App Configuration

### 1. Deep Linking Setup

The app is configured with:
- **Scheme:** `sportsvenueapp`
- **Bundle ID:** `com.gameonsports.app`
- **Package Name:** `com.gameonsports.app`

### 2. OAuth Flow

1. User taps Google logo in login screen
2. App opens Google OAuth in browser/webview
3. User completes Google authentication
4. Google redirects to `sportsvenueapp://auth/callback`
5. App handles callback and creates/updates user profile
6. User is redirected to main app tabs

## 🔄 Testing

### Development Testing

1. Start your Expo development server:
   ```bash
   npx expo start
   ```

2. Test Google OAuth:
   - Open login screen
   - Tap Google logo
   - Complete Google authentication
   - Verify redirect back to app

### Production Testing

1. Build and deploy your app
2. Test OAuth flow on physical devices
3. Verify all redirect URLs work correctly

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check Supabase redirect URLs match Google Cloud settings
   - Ensure scheme matches app.json configuration

2. **"OAuth client not found"**
   - Verify Client ID/Secret in Supabase
   - Check Google Cloud project settings

3. **Deep link not working**
   - Verify app scheme in app.json
   - Test deep link manually: `sportsvenueapp://auth/callback`

### Debug Steps

1. Check Supabase logs for OAuth errors
2. Verify Google Cloud Console configuration
3. Test redirect URLs manually
4. Check app scheme registration

## 📋 Implementation Status

✅ **Completed:**
- Google OAuth service created
- Login screen integration
- OAuth callback handler
- Deep linking configuration
- User profile creation/update

✅ **Ready for Testing:**
- Configure Supabase with your Google credentials
- Test OAuth flow in development
- Deploy and test in production

## 🔐 Security Notes

- Client Secret is stored securely in Supabase
- OAuth tokens are handled by Supabase Auth
- User data is stored in your database
- Deep links are properly validated

## 📞 Support

If you encounter issues:
1. Check Supabase Auth logs
2. Verify Google Cloud Console settings
3. Test redirect URLs manually
4. Review app scheme configuration
