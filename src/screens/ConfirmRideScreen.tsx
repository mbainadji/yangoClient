import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

export default function ConfirmRideScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Sécurité pour éviter le crash si les paramètres sont absents
  const vehicle = route.params?.vehicle;
  const destination = route.params?.destination;
  const origin = route.params?.origin;

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (!vehicle) throw new Error("Données du véhicule manquantes");

      await firestore().collection('bookings').add({
        vehicleName: vehicle.name,
        origin,
        destination,
        price: vehicle.estimate,
        status: 'searching',
        createdAt: firestore.FieldValue.serverTimestamp()
      });
      setSearching(true);
      // Simuler la recherche pendant 4 secondes
      setTimeout(() => {
        Alert.alert("Succès", "Un chauffeur a été trouvé ! (Simulation)");
        navigation.navigate('ClientHome');
      }, 4000);
    } catch (e) {
      Alert.alert("Erreur", "Connexion Firebase échouée");
    } finally {
      setLoading(false);
    }
  };

  if (searching) {
    return (
      <View style={styles.searchingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.searchingText}>Recherche d'un chauffeur en cours...</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setSearching(false)}>
          <Text style={styles.cancelText}>ANNULER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Erreur de chargement</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>RETOUR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
        <Text style={styles.headerBackIcon}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Récapitulatif de la course</Text>
      
      <View style={styles.box}>
        <Text style={styles.label}>Départ</Text>
        <Text style={styles.val}>{origin}</Text>
        <View style={styles.line} />
        <Text style={styles.label}>Destination</Text>
        <Text style={styles.val}>{destination}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.label}>Véhicule</Text>
        <Text style={styles.val}>{vehicle.name}</Text>
        <Text style={styles.priceRed}>{vehicle.estimate} FCFA</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleConfirm} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>CONFIRMER LA COURSE</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={{color: '#D32F2F'}}>Modifier les options</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', padding: 25, justifyContent: 'center' },
  headerBack: { position: 'absolute', top: 50, left: 25, zIndex: 10 },
  headerBackIcon: { fontSize: 30, color: '#000', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  box: { backgroundColor: '#F9F9F9', padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase' },
  val: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#000' },
  line: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
  priceRed: { fontSize: 22, fontWeight: '900', color: '#D32F2F', marginTop: 10 },
  btn: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 16, color: '#FFF' },
  back: { marginTop: 20, alignItems: 'center' },
  searchingContainer: { flex: 1, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  searchingText: { color: '#FFF', marginTop: 20, fontSize: 16 },
  cancelBtn: { marginTop: 50, padding: 15 },
  cancelText: { color: '#FFF', fontWeight: 'bold' }
});