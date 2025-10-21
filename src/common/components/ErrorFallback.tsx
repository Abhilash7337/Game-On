import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/theme';
import { errorFallbackStyles } from '@/styles/components/ErrorFallback';

interface ErrorFallbackProps {
  error?: Error;
  onRetry?: () => void;
  title?: string;
  message?: string;
  showRetry?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  showRetry = true,
}) => {
  return (
    <View style={errorFallbackStyles.container}>
      <View style={errorFallbackStyles.iconContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
      </View>
      
      <Text style={errorFallbackStyles.title}>{title}</Text>
      <Text style={errorFallbackStyles.message}>{message}</Text>

      {__DEV__ && error && (
        <View style={errorFallbackStyles.debugContainer}>
          <Text style={errorFallbackStyles.debugTitle}>Error Details:</Text>
          <Text style={errorFallbackStyles.debugText}>{error.message}</Text>
        </View>
      )}

      {showRetry && onRetry && (
        <TouchableOpacity style={errorFallbackStyles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh-outline" size={20} color={colors.textInverse} />
          <Text style={errorFallbackStyles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface NetworkErrorFallbackProps {
  onRetry?: () => void;
}

export const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({ onRetry }) => (
  <ErrorFallback
    title="Connection Problem"
    message="Please check your internet connection and try again."
    onRetry={onRetry}
  />
);

interface NotFoundFallbackProps {
  onGoBack?: () => void;
  resourceName?: string;
}

export const NotFoundFallback: React.FC<NotFoundFallbackProps> = ({ 
  onGoBack, 
  resourceName = 'resource' 
}) => (
  <ErrorFallback
    title="Not Found"
    message={`The ${resourceName} you're looking for could not be found.`}
    onRetry={onGoBack}
    showRetry={!!onGoBack}
  />
);

