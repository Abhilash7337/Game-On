import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/theme';
import { errorBoundaryStyles } from '@/styles/components/ErrorBoundary';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (__DEV__) {
      console.error('Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to log to a service like Sentry
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={errorBoundaryStyles.container}>
          <View style={errorBoundaryStyles.errorCard}>
            <View style={errorBoundaryStyles.iconContainer}>
              <Ionicons name="warning-outline" size={48} color={colors.error} />
            </View>
            
            <Text style={errorBoundaryStyles.title}>Oops! Something went wrong</Text>
            <Text style={errorBoundaryStyles.message}>
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={errorBoundaryStyles.debugContainer}>
                <Text style={errorBoundaryStyles.debugTitle}>Debug Information:</Text>
                <Text style={errorBoundaryStyles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={errorBoundaryStyles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={errorBoundaryStyles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh-outline" size={20} color={colors.textInverse} />
              <Text style={errorBoundaryStyles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

