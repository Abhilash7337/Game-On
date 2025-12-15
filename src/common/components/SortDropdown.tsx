/**
 * Sort Dropdown Component
 * 
 * Dropdown selector for sorting venues by distance, price, rating, popularity.
 * Features icons for each option and smooth dropdown animation.
 */

import { SortOption } from '@/src/common/contexts/VenueFilterContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SortDropdownProps {
  currentSort: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

interface SortOptionItem {
  value: SortOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SORT_OPTIONS: SortOptionItem[] = [
  { value: 'distance-asc', label: 'Nearest First', icon: 'location' },
  { value: 'distance-desc', label: 'Farthest First', icon: 'location-outline' },
  { value: 'price-asc', label: 'Price: Low to High', icon: 'cash' },
  { value: 'price-desc', label: 'Price: High to Low', icon: 'cash-outline' },
  { value: 'rating-desc', label: 'Highest Rated', icon: 'star' },
  { value: 'rating-asc', label: 'Lowest Rated', icon: 'star-outline' },
  { value: 'popular', label: 'Most Popular', icon: 'flame' },
];

export const SortDropdown: React.FC<SortDropdownProps> = ({
  currentSort,
  onSortChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animate chevron rotation
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const currentOption = SORT_OPTIONS.find(opt => opt.value === currentSort);

  const handleSelectOption = (option: SortOption) => {
    onSortChange(option);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Sort Button */}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Ionicons name="swap-vertical" size={16} color="#6B7280" />
        <Text style={styles.sortLabel}>Sort by:</Text>
        <Text style={styles.sortValue}>{currentOption?.label || 'Select'}</Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <Ionicons name="chevron-down" size={16} color="#6B7280" />
        </Animated.View>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <Pressable 
            style={styles.dropdownContainer} 
            onPress={(e) => e.stopPropagation()}
          >
            {SORT_OPTIONS.map((option, index) => {
              const isSelected = option.value === currentSort;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemSelected,
                    index === 0 && styles.dropdownItemFirst,
                    index === SORT_OPTIONS.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => handleSelectOption(option.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isSelected ? '#FF6B35' : '#6B7280'}
                  />
                  <Text style={[
                    styles.dropdownItemText,
                    isSelected && styles.dropdownItemTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  sortLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 250,
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  dropdownItemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF4ED',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default SortDropdown;
