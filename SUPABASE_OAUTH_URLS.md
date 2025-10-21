# Supabase OAuth Configuration

## Required Redirect URLs

Add these URLs to your Supabase Dashboard > Authentication > Providers > Google:

### Development URLs (Expo)
```
exp://10.188.207.150:8081/--/auth/callback
exp://localhost:8081/--/auth/callback
exp://127.0.0.1:8081/--/auth/callback
```

### Production URLs
```
sportsvenueapp://auth/callback
https://your-domain.com/auth/callback
```

## Google Cloud Console

Add these to your Google Cloud Console OAuth client's Authorized redirect URIs:

```
https://woaypxxpvywpptxwmcyu.supabase.co/auth/v1/callback
exp://10.188.207.150:8081/--/auth/callback
exp://localhost:8081/--/auth/callback
sportsvenueapp://auth/callback
```

## Current Status

✅ OAuth URL is being generated correctly
✅ Google authentication flow is starting
❌ Need to add redirect URLs to Supabase
❌ Need to add redirect URLs to Google Cloud Console

## Next Steps

1. Add the development URLs to Supabase (especially `exp://10.188.207.150:8081/--/auth/callback`)
2. Add the same URLs to Google Cloud Console
3. Test the OAuth flow again
4. Check the debug logs for any remaining issues
