import { StyleSheet } from 'react-native';

// Re-export all the component styles for easy importing
export { cardStyles, buttonStyles, inputStyles } from '../components/common';
export { headerStyles, modalStyles, chipStyles } from '../components/ui';
export { layoutStyles, textStyles, summaryStyles } from '../components/layout';

// Screen-specific styles if needed
export const quickBookStyles = StyleSheet.create({
  // Add any QuickBookScreen-specific styles here if needed
  // Most styles should come from the component files above
});