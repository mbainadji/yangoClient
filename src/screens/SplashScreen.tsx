import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#D32F2F" barStyle="light-content" />
      
      <View style={styles.logoContainer}>
        <Text style={styles.carIcon}>🚗</Text>
        <Text style={styles.brandTitle}>YANGO</Text>
        <Text style={styles.brandSubtitle}>+ SECOURS</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.mainBtnText}>FAIRE UNE COURSE</Text>
        </TouchableOpacity>
      </View>
      
      {/* Optionnel : Un petit texte de chargement en bas */}
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#D32F2F', // PASSAGE AU ROUGE
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
    color: '#FFFFFF', // TEXTE EN BLANC SUR ROUGE
    fontSize: 55, 
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  brandSubtitle: { 
    color: '#FFFFFF',
    fontSize: 22, 
    fontWeight: '300', 
    letterSpacing: 4,
    marginTop: -5,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
  },
  mainBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
  },
  mainBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  loadingText: {
    position: 'absolute',
    bottom: 30,
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
  }
});