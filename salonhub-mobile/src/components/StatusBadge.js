import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBadge = ({ status, customText }) => {
  const statusConfig = {
    pending: {
      text: 'En attente',
      bg: '#FEF3C7',
      color: '#92400E',
    },
    confirmed: {
      text: 'Confirmé',
      bg: '#D1FAE5',
      color: '#065F46',
    },
    completed: {
      text: 'Complété',
      bg: '#DBEAFE',
      color: '#1E40AF',
    },
    cancelled: {
      text: 'Annulé',
      bg: '#FEE2E2',
      color: '#991B1B',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const displayText = customText || config.text;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusBadge;
