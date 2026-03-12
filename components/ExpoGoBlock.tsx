import Constants, { ExecutionEnvironment } from 'expo-constants';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * When running in Expo Go, this app uses native modules (Skia, Rive) that
 * are not available, which causes a crash. Show a clear message instead.
 */
export function ExpoGoBlock({ children }: { children: React.ReactNode }) {
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (isExpoGo) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Cannot run in Expo Go</Text>
        <Text style={styles.message}>
          This app uses native modules (Skia, Rive) that are not included in
          Expo Go. It will crash if you continue.
        </Text>
        <Text style={styles.instruction}>
          Close Expo Go and run in Terminal:
        </Text>
        <Text style={styles.command}>npm run ios</Text>
        <Text style={styles.sub}>
          That installs and opens the Grove app in the simulator. Do not open
          this project from inside the Expo Go app.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#b8b8b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  instruction: {
    fontSize: 15,
    color: '#9ca3af',
    marginBottom: 8,
  },
  command: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7dd3fc',
    fontFamily: 'monospace',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sub: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
