import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthScreen } from '../screens/AuthScreen';
import { MapScreen } from '../screens/MapScreen';
import { SpotDetailScreen } from '../screens/SpotDetailScreen';

export type RootStackParamList = {
  Map: undefined;
  SpotDetail: { spotId: string };
  Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Map">
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Stack.Screen
        name="SpotDetail"
        component={SpotDetailScreen}
        options={{ title: 'Spot Detail' }}
      />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Sign In' }} />
    </Stack.Navigator>
  );
}
