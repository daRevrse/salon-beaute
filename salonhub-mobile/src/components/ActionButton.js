import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ActionButton = ({
  label,
  icon,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
}) => {
  const variants = {
    primary: {
      bg: '#6366F1',
      color: '#fff',
      borderColor: '#6366F1',
    },
    success: {
      bg: '#10B981',
      color: '#fff',
      borderColor: '#10B981',
    },
    danger: {
      bg: '#EF4444',
      color: '#fff',
      borderColor: '#EF4444',
    },
    outline: {
      bg: 'transparent',
      color: '#EF4444',
      borderColor: '#EF4444',
    },
  };

  const sizes = {
    sm: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      fontSize: 12,
      iconSize: 14,
    },
    md: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 18,
    },
    lg: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      fontSize: 16,
      iconSize: 20,
    },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.borderColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.color} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={sizeStyle.iconSize}
              color={variantStyle.color}
              style={styles.icon}
            />
          )}
          <Text style={[styles.label, { color: variantStyle.color, fontSize: sizeStyle.fontSize }]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  icon: {
    marginRight: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ActionButton;
