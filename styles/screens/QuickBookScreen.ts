import { StyleSheet } from 'react-native';

// Re-export all the component styles for easy importing
export { buttonStyles, cardStyles, inputStyles } from '../components/common';
export { layoutStyles, summaryStyles, textStyles } from '../components/layout';
export { chipStyles, headerStyles, modalStyles } from '../components/ui';

// Screen-specific styles if needed
export const quickBookStyles = StyleSheet.create({
  // Add any QuickBookScreen-specific styles here if needed
  // Most styles should come from the component files above
});