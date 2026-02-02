import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SpotDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spot Detail</Text>
      <Text style={styles.body}>スポット詳細の情報を表示する画面です。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
  },
});
