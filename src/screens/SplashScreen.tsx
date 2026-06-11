import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Redirection vers l'accueil après 3 secondes
    const timer = setTimeout(() => {
      navigation.replace('ClientHome'); 
    }, 3000);

    // Nettoyage du timer si le composant est démonté avant les 3 secondes
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Configure la barre d'état pour qu'elle corresponde au fond bleu */}
      <StatusBar backgroundColor="#00BFFF" barStyle="dark-content" />
      
      {/* Zone centrale avec le logo et le texte */}
      <View style={styles.logoContainer}>
        {/* Logo de la voiture (Car Icon) */}
        <Text style={styles.carIcon}>🚗</Text>
        
        {/* Texte en Noir */}
        <Text style={styles.brandTitle}>YANGO</Text>
        <Text style={styles.brandSubtitle}>+ SECOURS</Text>
      </View>
      
      {/* Optionnel : Un petit texte de chargement en bas */}
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#00BFFF', // FOND TOTALEMENT BLEU CIEL
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50, // Espace pour le texte de chargement
  },
  carIcon: {
    fontSize: 80, // Taille du logo de la voiture
    marginBottom: 20,
  },
  brandTitle: { 
    color: '#000000', // NOM EN NOIR
    fontSize: 55, 
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  brandSubtitle: { 
    color: '#000000', // NOM EN NOIR
    fontSize: 22, 
    fontWeight: '300', 
    letterSpacing: 4,
    marginTop: -5,
  },
  loadingText: {
    position: 'absolute',
    bottom: 30,
    color: '#000000',
    fontSize: 14,
    opacity: 0.7,
  }
});