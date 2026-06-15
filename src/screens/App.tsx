import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { getFirebaseApp, db } from '../services/firebaseConfig';
import AppNavigator from '../navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Initialise Firebase au démarrage
    const app = getFirebaseApp();
    console.log('✅ Firebase initialisé:', app.name);

    // Test connexion Firestore
   const testFirestore = async () => {
  try {
    const firestore = (await import('@react-native-firebase/firestore')).default;
    await firestore().collection('_test_').doc('ping').get();
    console.log('✅ Firestore connecté');
  } catch (error) {
    console.error('❌ Firestore erreur:', error);
  }
};
    testFirestore();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
