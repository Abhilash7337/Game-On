import React from 'react';
import { View, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { colors } from '@/styles/theme';
import { loadingStateStyles } from '@/styles/components/LoadingState';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
  overlay?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = colors.primary,
  style,
  overlay = false,
}) => {
  const containerStyle = [
    overlay ? loadingStateStyles.overlayContainer : loadingStateStyles.container,
    style,
  ];

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={loadingStateStyles.message}>{message}</Text>
      )}
    </View>
  );
};

interface LoadingOverlayProps extends LoadingStateProps {
  visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  ...props
}) => {
  if (!visible) return null;

  return (
    <View style={loadingStateStyles.overlay}>
      <LoadingState {...props} overlay />
    </View>
  );
};
