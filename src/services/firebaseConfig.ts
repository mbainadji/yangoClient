import { getApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';

export const getFirebaseApp = () => {
  return getApp();
};

export const db = getFirestore();

export const firebaseApp = getFirebaseApp();
