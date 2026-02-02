import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90D9',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'RestMap',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Sign In',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="spot/[id]"
          options={{
            title: 'Spot Details',
          }}
        />
        <Stack.Screen
          name="add-spot"
          options={{
            title: 'Add New Spot',
            presentation: 'modal',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
