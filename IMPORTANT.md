# ⚠️ IMPORTANT - SETUP REQUIRED FOR VENUE FEATURES

## 🚨 CRITICAL: Complete These Steps Before Testing

---

## ✅ STEP 1: UPDATE SUPABASE DATABASE

### Go to Supabase SQL Editor and Run This:

```sql
-- Add missing columns to venues table
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS location JSONB NOT NULL DEFAULT '{"latitude": 0, "longitude": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS courts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### How to Run:
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste the SQL above
6. Click **Run** or press `Ctrl+Enter`
7. ✅ You should see "Success. No rows returned"

---

## ✅ STEP 2: GET GOOGLE MAPS API KEY

### Create API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **API Key**
5. Copy the API key

### Enable Required APIs:
1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
   - **Geocoding API**

### Restrict API Key (Optional but Recommended):
1. Click on your API key
2. Under **Application restrictions**, select **Android apps** or **iOS apps**
3. Add your app's package name/bundle ID
4. Save

---

## ✅ STEP 3: ADD API KEY TO APP.JSON

### Open `app.json` and add this:

```json
{
  "expo": {
    "name": "Game-On",
    "slug": "game-on",
    "android": {
      "package": "com.yourcompany.gameon",
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_MAPS_API_KEY_HERE"
        }
      }
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.gameon",
      "config": {
        "googleMapsApiKey": "YOUR_IOS_MAPS_API_KEY_HERE"
      }
    }
  }
}
```

### Replace:
- `YOUR_ANDROID_MAPS_API_KEY_HERE` with your actual Android API key
- `YOUR_IOS_MAPS_API_KEY_HERE` with your actual iOS API key

**Note:** You can use the same API key for both platforms during development.

---

## ✅ STEP 4: REBUILD THE APP

After adding the API key, you MUST rebuild:

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios

# Or just restart Expo
npx expo start --clear
```

**Important:** Hot reload won't pick up `app.json` changes. You need a full rebuild.

---

## 🎯 TESTING CHECKLIST

### Test on Phone A (Client):
- [ ] Login as client
- [ ] Go to Dashboard
- [ ] Click "Add Venue"
- [ ] Fill venue name, address, description
- [ ] Click "Select Location on Map" button
- [ ] Map should open (if not, check API key)
- [ ] Tap anywhere on map
- [ ] Marker should move to tapped location
- [ ] Click "Current Location" button (GPS icon)
- [ ] Marker should move to your location
- [ ] Click "Confirm Location"
- [ ] Button should show "Location Selected ✓"
- [ ] Complete Steps 2-4 (pricing, courts, review)
- [ ] Submit venue
- [ ] Should see success message

### Verify in Supabase:
- [ ] Open Supabase Dashboard
- [ ] Go to **Table Editor** → **venues**
- [ ] Find your newly added venue
- [ ] Check `location` column has coordinates like:
  ```json
  {"latitude": 17.385044, "longitude": 78.486671}
  ```

### Test on Phone B (Player):
- [ ] Login as player (different device or logout/login)
- [ ] Go to **Courts** tab
- [ ] Pull down to refresh
- [ ] New venue should appear in the list
- [ ] Venue should show correct name, price, address

### Cross-Device Sync Test:
- [ ] Add venue on Phone A
- [ ] Immediately open Phone B
- [ ] Refresh Courts tab
- [ ] ✅ Venue should appear on Phone B

---

## 🐛 TROUBLESHOOTING

### Map Doesn't Load:
**Problem:** Blank screen when opening location picker

**Solutions:**
1. Check API key is correct in `app.json`
2. Verify APIs are enabled in Google Cloud Console
3. Rebuild app (not just hot reload)
4. Check console for error messages

### Location Permission Denied:
**Problem:** "Current Location" button doesn't work

**Solutions:**
1. Go to phone Settings → Apps → Game-On
2. Grant Location permission
3. Try again

### Venue Not Saving:
**Problem:** Error when submitting venue

**Solutions:**
1. Check Supabase SQL was run successfully
2. Verify `location` column exists in venues table
3. Make sure location was selected (not 0,0)
4. Check console logs for error details

### Venue Not Appearing on Other Device:
**Problem:** Added venue doesn't show on another phone

**Solutions:**
1. Pull down to refresh on Courts screen
2. Check Supabase Table Editor - is venue there?
3. Check venue has `is_active = true`
4. Verify both phones have internet connection

---

## 📋 QUICK REFERENCE

### Required Packages (Already Installed):
```bash
✅ expo-location
✅ react-native-maps
```

### Files Modified:
```
✅ src/common/services/venueStorage.ts - Supabase integration
✅ src/common/screens/AddVenueScreen.tsx - Location picker
✅ src/common/components/LocationPicker.tsx - NEW map component
✅ supabase-schema.sql - Database schema
```

### Environment Variables Needed:
```
EXPO_PUBLIC_SUPABASE_URL=https://woaypxxpvywpptxwmcyu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (already set)
```

---

## ⚡ QUICK START SUMMARY

1. **Run SQL in Supabase** (Step 1)
2. **Get Google Maps API key** (Step 2)
3. **Add API key to app.json** (Step 3)
4. **Rebuild app** (Step 4)
5. **Test adding venue with location**
6. **Verify on another device**

---

## 🎯 WHAT YOU GET AFTER SETUP

### Before Setup:
- ❌ Venues only on one device
- ❌ No location coordinates
- ❌ No map integration

### After Setup:
- ✅ Venues sync across ALL devices via Supabase
- ✅ Google Maps location picker
- ✅ Exact GPS coordinates stored
- ✅ Distance calculation ready
- ✅ Professional UX

---

## 📞 NEED HELP?

### Check Console Logs:
```bash
npx expo start
```
Look for:
- `✅ Venue added to Supabase: [Venue Name]`
- `📍 Fetching public venues from Supabase. Total: X`
- Any error messages

### Verify Supabase Connection:
```bash
# Check if venues table exists
SELECT * FROM public.venues LIMIT 1;

# Check if location column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'venues';
```

---

## ✅ COMPLETION CHECKLIST

- [ ] SQL run in Supabase
- [ ] Google Maps API key obtained
- [ ] API key added to app.json
- [ ] App rebuilt
- [ ] Location picker works
- [ ] Venue saves with coordinates
- [ ] Venue appears in Supabase
- [ ] Venue syncs to other devices

**Once all checked, you're ready to go! 🚀**
