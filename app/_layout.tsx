// In constants/Colors.ts

import { DefaultTheme } from '@react-navigation/native';

// Your existing Colors object...
export const Colors = {
  light: {
    // ... your existing light colors
  },
  dark: {
    // ... your existing dark colors
  },
};

// Add this new theme object to the file
export const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#208C4D', // Sets the default active color
    card: '#FFFFFF',     // Sets the background for elements like tab bars and headers
  },
};