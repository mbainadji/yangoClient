import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { getFirebaseApp, db } from '../services/firebaseConfig';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AppNavigator from '../navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Initialise Firebase au démarrage
    const app = getFirebaseApp();
    console.log('✅ Firebase initialisé:', app.name);

    const saveTokenToFirestore = async (token: string) => {
      const user = auth().currentUser;
      if (user && token) {
        try {
          await firestore().collection('users').doc(user.uid).set({
            fcmToken: token,
            lastTokenUpdate: firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          console.log('✅ Token FCM sauvegardé pour:', user.email);
        } catch (error) {
          console.error('❌ Erreur sauvegarde Token FCM:', error);
        }
      }
    };

    const requestUserPermission = async () => {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    };

    const syncToken = async () => {
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        try {
          const token = await messaging().getToken();
        console.log('🎫 JETON FCM À COPIER :', token);
          if (token) await saveTokenToFirestore(token);
        } catch (error) {
          console.error("❌ Erreur récupération Token:", error);
        }
      }
    };

    // Écouter les changements d'authentification
    const unsubscribeAuth = auth().onAuthStateChanged(async (user) => {
      if (user) {
        await syncToken();
      }
    });

    // Écouter le rafraîchissement du jeton par Firebase
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
      saveTokenToFirestore(token);
    });

    // Gestion des messages quand l'application est au premier plan
    const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'Nouvelle notification',
        remoteMessage.notification?.body || 'Vous avez reçu un message'
      );
    });

    // Gestion du clic sur notification quand l'app est en arrière-plan (mais pas fermée)
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification a causé l\'ouverture de l\'app (Background):', remoteMessage.data);
      // Ici vous pouvez naviguer vers un écran spécifique
    });

    // Vérifier si l'app a été ouverte via une notification alors qu'elle était fermée (Quit state)
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification a causé l\'ouverture de l\'app (Quit state):', remoteMessage.data);
      }
    });

    // Test connexion Firestore
   const testFirestore = async () => {
  try {
    syncToken();
  } catch (error) {
    console.error('❌ Firestore erreur:', error);
  }
};
    testFirestore();

    return () => {
      unsubscribeOnMessage();
      unsubscribeNotificationOpened();
      unsubscribeAuth();
      unsubscribeTokenRefresh();
    };
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}
