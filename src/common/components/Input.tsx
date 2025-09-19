import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required = false,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          {...props}
        />
        
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={20}
            color={colors.textSecondary}
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 4,
  },
});