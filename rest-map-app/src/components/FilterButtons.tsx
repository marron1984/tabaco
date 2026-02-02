import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SpotFilter } from '../types';

interface FilterButtonsProps {
  filter: SpotFilter;
  onFilterChange: (filter: SpotFilter) => void;
}

const FilterButtons: React.FC<FilterButtonsProps> = ({ filter, onFilterChange }) => {
  const toggleFilter = (key: keyof SpotFilter) => {
    onFilterChange({
      ...filter,
      [key]: !filter[key],
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, filter.showSmoking && styles.buttonActive]}
        onPress={() => toggleFilter('showSmoking')}
      >
        <Text style={[styles.emoji]}>🚬</Text>
        <Text style={[styles.buttonText, filter.showSmoking && styles.buttonTextActive]}>
          Smoking
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, filter.showToilet && styles.buttonActive]}
        onPress={() => toggleFilter('showToilet')}
      >
        <Text style={[styles.emoji]}>🚻</Text>
        <Text style={[styles.buttonText, filter.showToilet && styles.buttonTextActive]}>
          Toilet
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, filter.showCafe && styles.buttonActive]}
        onPress={() => toggleFilter('showCafe')}
      >
        <Text style={[styles.emoji]}>☕</Text>
        <Text style={[styles.buttonText, filter.showCafe && styles.buttonTextActive]}>
          Cafe
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  buttonActive: {
    backgroundColor: '#4A90D9',
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  buttonTextActive: {
    color: 'white',
  },
});

export default FilterButtons;
