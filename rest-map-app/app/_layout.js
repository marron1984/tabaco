'use client';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, StyleSheet, Platform } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';

// Custom theme based on Urban Minimalist design
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3B82F6',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB',
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#60A5FA',
    background: '#121212',
    card: '#1E1E1E',
    text: '#F9FAFB',
    border: '#374151',
  },
};

// Styles for web height fix
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    // Web needs explicit height
    ...(Platform.OS === 'web' && {
      height: '100vh',
      width: '100%',
      minHeight: '100vh',
      overflow: 'hidden',
    }),
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.rootContainer}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: {
                backgroundColor: 'transparent',
                // Web needs explicit height for content
                ...(Platform.OS === 'web' && {
                  height: '100%',
                  minHeight: '100vh',
                }),
              },
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="spot/[id]"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="debug"
              options={{
                title: 'Debug Tools',
                headerShown: true,
                presentation: 'modal',
                headerStyle: { backgroundColor: '#3B82F6' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="add-spot"
              options={{
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </View>
  );
}
