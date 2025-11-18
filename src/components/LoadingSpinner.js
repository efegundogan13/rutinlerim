import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Basit bir loading componenti (opsiyonel)
const LoadingSpinner = ({ size = 40, color = '#6B73FF' }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.spinner, { borderColor: color + '30', borderTopColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderRadius: 50,
    borderStyle: 'solid',
  },
});

export default LoadingSpinner;