/**
 * Advanced Filter Modal Component
 * 
 * Bottom sheet modal with distance, price, rating filters.
 * Features range sliders, preset buttons, and apply/clear actions.
 */

import { VenueFilterState } from '@/src/common/contexts/VenueFilterContext';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AdvancedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: VenueFilterState;
  onApplyFilters: (filters: Partial<VenueFilterState>) => void;
  onClearAdvancedFilters: () => void;
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onClearAdvancedFilters,
}) => {
  // Local state for filter adjustments
  const [localFilters, setLocalFilters] = useState({
    distanceRange: filters.distanceRange,
    priceRange: filters.priceRange,
    minRating: filters.minRating,
  });

  // Sync with external filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters({
        distanceRange: filters.distanceRange,
        priceRange: filters.priceRange,
        minRating: filters.minRating,
      });
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const defaultFilters = {
      distanceRange: { min: 0, max: 50 },
      priceRange: { min: 0, max: 100000 },
      minRating: 0,
    };
    setLocalFilters(defaultFilters);
    onClearAdvancedFilters();
    onClose();
  };

  // Preset handlers
  const setDistancePreset = (maxKm: number) => {
    setLocalFilters(prev => ({
      ...prev,
      distanceRange: { min: 0, max: maxKm },
    }));
  };

  const setPricePreset = (min: number, max: number) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: { min, max },
    }));
  };

  // Render star selector
  const renderStarSelector = () => {
    const ratings = [
      { value: 0, label: 'Any' },
      { value: 1, label: '1+' },
      { value: 2, label: '2+' },
      { value: 3, label: '3+' },
      { value: 4, label: '4+' },
      { value: 5, label: '5' },
    ];

    return (
      <View style={styles.ratingGrid}>
        {ratings.map((rating) => (
          <TouchableOpacity
            key={rating.value}
            style={[
              styles.ratingButton,
              localFilters.minRating === rating.value && styles.ratingButtonActive,
            ]}
            onPress={() => setLocalFilters(prev => ({ ...prev, minRating: rating.value }))}
          >
            <View style={styles.ratingContent}>
              {rating.value > 0 ? (
                <View style={styles.starsRow}>
                  {[...Array(rating.value)].map((_, i) => (
                    <Ionicons key={i} name="star" size={14} color="#FBBF24" />
                  ))}
                </View>
              ) : (
                <Text style={[
                  styles.ratingLabel,
                  localFilters.minRating === rating.value && styles.ratingLabelActive,
                ]}>
                  {rating.label}
                </Text>
              )}
            </View>
            <Text style={[
              styles.ratingText,
              localFilters.minRating === rating.value && styles.ratingTextActive,
            ]}>
              {rating.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* DISTANCE RANGE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance Range</Text>
              <View style={styles.rangeValues}>
                <Text style={styles.rangeLabel}>0 km</Text>
                <Text style={styles.rangeValue}>
                  Up to {localFilters.distanceRange.max} km
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={50}
                step={1}
                value={localFilters.distanceRange.max}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({
                    ...prev,
                    distanceRange: { min: 0, max: value },
                  }))
                }
                minimumTrackTintColor="#FF6B35"
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor="#FF6B35"
              />
              <View style={styles.presetButtons}>
                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    localFilters.distanceRange.max === 5 && styles.presetButtonActive,
                  ]}
                  onPress={() => setDistancePreset(5)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    localFilters.distanceRange.max === 5 && styles.presetButtonTextActive,
                  ]}>
                    Within 5km
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    localFilters.distanceRange.max === 10 && styles.presetButtonActive,
                  ]}
                  onPress={() => setDistancePreset(10)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    localFilters.distanceRange.max === 10 && styles.presetButtonTextActive,
                  ]}>
                    Within 10km
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    localFilters.distanceRange.max === 20 && styles.presetButtonActive,
                  ]}
                  onPress={() => setDistancePreset(20)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    localFilters.distanceRange.max === 20 && styles.presetButtonTextActive,
                  ]}>
                    Within 20km
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* PRICE RANGE */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range (per hour)</Text>
              <View style={styles.rangeValues}>
                <Text style={styles.rangeLabel}>₹{localFilters.priceRange.min}</Text>
                <Text style={styles.rangeValue}>
                  ₹{localFilters.priceRange.max === 100000 ? '10,000+' : localFilters.priceRange.max.toLocaleString()}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10000}
                step={100}
                value={localFilters.priceRange.max}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({
                    ...prev,
                    priceRange: { min: 0, max: value },
                  }))
                }
                minimumTrackTintColor="#FF6B35"
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor="#FF6B35"
              />
              <View style={styles.presetButtons}>
                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    localFilters.priceRange.max === 500 && styles.presetButtonActive,
                  ]}
                  onPress={() => setPricePreset(0, 500)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    localFilters.priceRange.max === 500 && styles.presetButtonTextActive,
                  ]}>
                    Under ₹500
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    localFilters.priceRange.max === 2000 && styles.presetButtonActive,
                  ]}
                  onPress={() => setPricePreset(500, 2000)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    localFilters.priceRange.max === 2000 && styles.presetButtonTextActive,
                  ]}>
                    ₹500-₹2000
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    localFilters.priceRange.max === 5000 && styles.presetButtonActive,
                  ]}
                  onPress={() => setPricePreset(2000, 5000)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    localFilters.priceRange.max === 5000 && styles.presetButtonTextActive,
                  ]}>
                    ₹2000-₹5000
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    localFilters.priceRange.max >= 5000 && styles.presetButtonActive,
                  ]}
                  onPress={() => setPricePreset(5000, 100000)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    localFilters.priceRange.max >= 5000 && styles.presetButtonTextActive,
                  ]}>
                    ₹5000+
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* RATING FILTER */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              {renderStarSelector()}
            </View>

            {/* Bottom padding for scroll */}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  rangeValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rangeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetButtonActive: {
    backgroundColor: '#FFF4ED',
    borderColor: '#FF6B35',
  },
  presetButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  presetButtonTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ratingButton: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#FFF4ED',
    borderColor: '#FF6B35',
  },
  ratingContent: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  ratingLabelActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  ratingTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AdvancedFilterModal;
