import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import ClientHomeScreen from '../screens/ClientHomeScreen';
import SosScreen from '../screens/SosScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
      <Stack.Screen name="Sos" component={SosScreen} />
    </Stack.Navigator>
  );
}