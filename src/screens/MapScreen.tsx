import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map Screen</Text>
      <Text style={styles.body}>ここにスポット一覧や地図を表示します。</Text>
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
