import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const FilterButton = ({ label, active = false, onPress, count, color = '#6366F1' }) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        active && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.badge, active && styles.activeBadge]}>
          <Text style={[styles.badgeText, active && styles.activeBadgeText]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginRight: 8,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeLabel: {
    color: '#fff',
  },
  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeBadgeText: {
    color: '#fff',
  },
});

export default FilterButton;
