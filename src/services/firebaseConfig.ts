import firebase from '@react-native-firebase/app';
// Si tu as besoin d'autres services, importe-les ici
// import '@react-native-firebase/firestore'; 

const firebaseConfig = {
  // Ajoute ici tes infos (apiKey, appId, projectId) 
  // que tu trouves dans la console Firebase (google-services.json)
};

// Vérification cruciale : n'initialiser qu'une seule fois
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;