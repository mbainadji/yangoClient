import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ConfirmRideScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const vehicle = route.params?.vehicle;
  const destination = route.params?.destination;
  const origin = route.params?.origin;
  const originCoords = route.params?.originCoords;

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);

  // Écouter en temps réel la réponse du chauffeur
  useEffect(() => {
    if (!courseId) return;

    const unsub = firestore()
      .collection('courses')
      .doc(courseId)
      .onSnapshot(snap => {
        const data = snap.data();
        if (!data) return;

        if (data.status === 'acceptee') {
          setSearching(false);
          Alert.alert(
            "Chauffeur trouvé !",
            "Un chauffeur a accepté votre course. Il arrive bientôt.",
            [{ text: "OK", onPress: () => navigation.navigate('ClientHome') }]
          );
        } else if (data.status === 'refusee') {
          setSearching(false);
          Alert.alert("Refusé", "Aucun chauffeur disponible. Réessayez.");
        }
      });

    return () => unsub();
  }, [courseId]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (!vehicle) throw new Error("Données du véhicule manquantes");
      const user = auth().currentUser;
      if (!user) throw new Error("Non connecté");

      // Créer la course dans Firestore avec la même structure que le chauffeur écoute
      const courseRef = await firestore().collection('courses').add({
        clientId: user.uid,
        clientEmail: user.email,
        clientName: user.displayName || user.email,
        driverId: null,
        vehicleName: vehicle.name,
        pickup: origin,
        destination: destination,
        coords: originCoords || { lat: 3.848, lng: 11.502 },
        price: `${vehicle.estimate} FCFA`,
        amount: vehicle.estimate,
        status: 'en_attente',  // ← même valeur qu'écoute le chauffeur
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      setCourseId(courseRef.id);
      setSearching(true);

      // Timeout de 60 secondes si aucun chauffeur ne répond
      setTimeout(() => {
        setSearching(false);
        Alert.alert("Timeout", "Aucun chauffeur n'a répondu. Réessayez.");
        firestore().collection('courses').doc(courseRef.id).update({ status: 'expiree' });
      }, 60000);

    } catch (e: any) {
      Alert.alert("Erreur", e.message || "Connexion Firebase échouée");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (courseId) {
      await firestore().collection('courses').doc(courseId).update({ status: 'annulee' });
    }
    setSearching(false);
    setCourseId(null);
  };

  if (searching) {
    return (
      <View style={styles.searchingContainer}>
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.searchingText}>Recherche d'un chauffeur en cours...</Text>
        <Text style={styles.searchingSubText}>En attente de confirmation...</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
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
  searchingContainer: { flex: 1, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center', padding: 30 },
  searchingText: { color: '#FFF', marginTop: 20, fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  searchingSubText: { color: '#FFB3B3', marginTop: 10, fontSize: 14, textAlign: 'center' },
  cancelBtn: { marginTop: 50, backgroundColor: '#FFF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 10 },
  cancelText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 }
});
