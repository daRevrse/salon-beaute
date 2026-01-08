import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AlertBanner = ({
  type = 'warning',
  icon,
  title,
  message,
  actionText,
  onActionPress,
  dismissable = false,
  onDismiss
}) => {
  const colors = {
    warning: {
      bg: '#FEF3C7',
      border: '#F59E0B',
      text: '#92400E',
      icon: '#F59E0B',
    },
    error: {
      bg: '#FEE2E2',
      border: '#EF4444',
      text: '#991B1B',
      icon: '#EF4444',
    },
    info: {
      bg: '#DBEAFE',
      border: '#3B82F6',
      text: '#1E40AF',
      icon: '#3B82F6',
    },
    success: {
      bg: '#D1FAE5',
      border: '#10B981',
      text: '#065F46',
      icon: '#10B981',
    },
  };

  const colorScheme = colors[type];

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.bg, borderLeftColor: colorScheme.border }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon || 'alert-circle'} size={24} color={colorScheme.icon} />
      </View>
      <View style={styles.content}>
        {title && <Text style={[styles.title, { color: colorScheme.text }]}>{title}</Text>}
        {message && <Text style={[styles.message, { color: colorScheme.text }]}>{message}</Text>}
        {actionText && onActionPress && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colorScheme.icon }]}
            onPress={onActionPress}
          >
            <Text style={styles.actionText}>{actionText}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      {dismissable && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Ionicons name="close" size={20} color={colorScheme.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
});

export default AlertBanner;
