#!/bin/bash

# Cleanup script to identify files that can be removed after reorganization

echo "=== Files that can be safely removed after reorganization ==="
echo ""

echo "1. Duplicate components (now in src/common/components/):"
echo "   - components/AppHeader.tsx (copied to src/common/components/)"
echo ""

echo "2. Moved utilities (now in src/common/utils/):"
echo "   - utils/bookingStore.ts (copied to src/common/utils/)"
echo ""

echo "3. Moved theme files (now in src/common/constants/):"
echo "   - styles/theme.ts (copied to src/common/constants/)"
echo ""

echo "4. Unused demo components:"
echo "   - components/HelloWave.tsx (demo component)"
echo "   - components/Collapsible.tsx (demo component)"
echo "   - components/ExternalLink.tsx (demo component)"
echo "   - components/ParallaxScrollView.tsx (demo component)"
echo "   - components/ThemedText.tsx (replaced by common components)"
echo "   - components/ThemedView.tsx (replaced by common components)"
echo ""

echo "5. Unused hooks (replaced by services):"
echo "   - hooks/useColorScheme.ts"
echo "   - hooks/useColorScheme.web.ts"
echo "   - hooks/useThemeColor.ts"
echo ""

echo "6. Old screen files (now in src/user/screens/):"
echo "   - app/(tabs)/index.tsx (copied to src/user/screens/HomeScreen.tsx)"
echo "   - app/(tabs)/social.tsx (copied to src/user/screens/SocialScreen.tsx)"
echo "   - app/(tabs)/courts.tsx (copied to src/user/screens/CourtsScreen.tsx)"
echo "   - app/(tabs)/profile.tsx (copied to src/user/screens/ProfileScreen.tsx)"
echo "   - app/QuickBookScreen.tsx (copied to src/user/screens/BookingScreen.tsx)"
echo ""

echo "7. Unused screen files:"
echo "   - app/JoinGameScreen.tsx (can be consolidated)"
echo "   - app/JoinGamesScreen.tsx (can be consolidated)"
echo "   - app/VenueDetailsScreen.tsx (move to client section)"
echo ""

echo "8. Old style files (consolidated in src/common/):"
echo "   - styles/components/ (entire directory)"
echo "   - styles/screens/ (entire directory)"
echo "   - constants/Colors.ts (replaced by theme.ts)"
echo ""

echo "9. Expo template files:"
echo "   - scripts/reset-project.js (demo script)"
echo ""

echo "=== Files to keep and update ==="
echo ""
echo "1. Core Expo files:"
echo "   - app.json, package.json, tsconfig.json, etc."
echo ""
echo "2. Navigation files (need import updates):"
echo "   - app/_layout.tsx"
echo "   - app/(tabs)/_layout.tsx"
echo ""
echo "3. Assets:"
echo "   - assets/ directory (all files)"
echo ""

echo "4. Configuration files:"
echo "   - eslint.config.js"
echo "   - expo-env.d.ts"
echo ""

echo "=== Next Steps ==="
echo ""
echo "1. Update import paths in remaining app/ files to use src/ structure"
echo "2. Test that all functionality works with new structure"
echo "3. Remove the files listed above after confirming everything works"
echo "4. Update app routing to support role-based navigation"