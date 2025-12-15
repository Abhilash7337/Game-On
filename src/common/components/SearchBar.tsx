/**
 * Search Bar Component
 * 
 * Robust search input with debouncing, clear functionality,
 * and integration with venue filter context.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Keyboard,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  debounceDelay?: number;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search venues by name, location, or sport...',
  debounceDelay = 300,
  autoFocus = false,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef<TextInput>(null);

  // Sync external value with local state
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (localValue !== value) {
        onChangeText(localValue);
      }
    }, debounceDelay);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [localValue]);

  // Focus animation
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1.02 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isFocused]);

  const handleClear = () => {
    setLocalValue('');
    onChangeText('');
    if (onClear) {
      onClear();
    }
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Leading Search Icon */}
      <Ionicons 
        name="search" 
        size={18} 
        color={isFocused ? '#FF6B35' : '#9CA3AF'} 
        style={styles.searchIcon}
      />

      {/* Text Input */}
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={localValue}
        onChangeText={setLocalValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never" // We'll use custom clear button
      />

      {/* Clear Button */}
      {localValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  containerFocused: {
    borderColor: '#FF6B35',
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
    margin: 0,
  },
  clearButton: {
    marginLeft: 6,
    padding: 4,
  },
});

export default SearchBar;
