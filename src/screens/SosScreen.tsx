import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Linking, SafeAreaView, Alert, PermissionsAndroid, Platform, FlatList, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera } from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';

const URGENCES = [
  { id: '1', nom: "Crise cardiaque", etapes: ["Allonger la victime au calme", "Appeler le 119", "Desserrer les vêtements"] },
  { id: '2', nom: "AVC", etapes: ["Noter l'heure du début", "Ne rien faire avaler", "Appeler le 119"] },
  { id: '3', nom: "Hémorragie", etapes: ["Appuyer fort sur la plaie", "Allonger la victime", "Appeler le 117"] },
  { id: '4', nom: "Brûlure", etapes: ["Refroidir à l'eau 15min", "Ne pas percer les cloques", "Protéger avec un linge propre"] },
  { id: '5', nom: "Perte de connaissance", etapes: ["Vérifier la respiration", "Mettre en PLS (Position Latérale de Sécurité)", "Appeler le 117"] },
  { id: '6', nom: "Chute grave", etapes: ["Ne pas déplacer la victime", "Rassurer et couvrir", "Appeler le 118"] }
];

export default function SosScreen() {
  const navigation = useNavigation<any>();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);

  // Récupérer la position au chargement
  useEffect(() => {
    const getLocation = async () => {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
      Geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log(err),
        { enableHighAccuracy: true }
      );
    };
    getLocation();
  }, []);

  // Chercher les hôpitaux proches via OpenStreetMap
  const fetchNearbyHospitals = async () => {
    if (!userLocation) return;
    setLoadingHospitals(true);
    try {
      // Recherche "hospital" autour de la position actuelle au Cameroun
      const url = `https://nominatim.openstreetmap.org/search?q=hospital&format=json&limit=5&countrycodes=cm&lat=${userLocation.lat}&lon=${userLocation.lng}`;
      const response = await fetch(url, { headers: { 'User-Agent': 'YangoSosApp' } });
      const data = await response.json();
      
      // Calculer distance et prix pour chaque hôpital
      const enriched = data.map((h: any) => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, parseFloat(h.lat), parseFloat(h.lon));
        return {
          ...h,
          distance: dist,
          price: Math.ceil(dist) * 250 // Tarif urgence aligné sur Booking
        };
      });
      
      setHospitals(enriched.sort((a: any, b: any) => a.distance - b.distance));
      setShowHospitals(true);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les hôpitaux environnants.");
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Fonction Haversine pour la distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Number((R * c).toFixed(1));
  };

  const handleHospitalSelect = (hospital: any) => {
    Alert.alert(
      "Confirmer l'évacuation",
      `Voulez-vous commander une ambulance vers ${hospital.display_name.split(',')[0]} ?\n\nDistance: ${hospital.distance} km\nPrix Estimé: ${hospital.price} FCFA`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "COMMANDER", onPress: () => {
          Alert.alert("Urgence lancée", "Une ambulance prioritaire est en route.");
          navigation.navigate('ClientHome');
        }}
      ]
    );
  };

  const requestPermissions = async (type: 'photo' | 'video') => {
    if (Platform.OS !== 'android') return true;

    const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];
    if (type === 'video') {
      permissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    }

    const results = await PermissionsAndroid.requestMultiple(permissions);
    
    const cameraGranted = results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
    const audioGranted = type === 'video' ? results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED : true;

    return cameraGranted && audioGranted;
  };

  const handleMedia = async (type: 'photo' | 'video') => {
    const hasPermission = await requestPermissions(type);
    if (!hasPermission) {
      Alert.alert("Permission refusée", "L'accès à la caméra (et au micro pour la vidéo) est nécessaire.");
      return;
    }

    launchCamera({ 
      mediaType: type, 
      videoQuality: 'medium', 
      saveToPhotos: true 
    }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) Alert.alert("Erreur", response.errorMessage);
      else {
        Alert.alert("Média capturé", "Preuve enregistrée. Recherche des hôpitaux les plus proches...");
        fetchNearbyHospitals();
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.drawerTrigger} onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>CENTRE DE SECOURS COMPLET</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>PROTOCOLES DE SECOURS</Text>
        {URGENCES.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.malaiseName}>{item.nom}</Text>
            {item.etapes.map((etape, i) => (
              <Text key={i} style={styles.etape}>• {etape}</Text>
            ))}
          </View>
        ))}

        {showHospitals && (
          <View style={styles.hospitalSection}>
            <Text style={styles.sectionTitle}>HÔPITAUX À PROXIMITÉ</Text>
            {loadingHospitals ? <ActivityIndicator color="#D32F2F" /> : (
              hospitals.map((item) => (
                <TouchableOpacity 
                  key={item.place_id} 
                  style={styles.hospitalCard}
                  onPress={() => handleHospitalSelect(item)}
                >
                  <View style={{flex: 1}}>
                    <Text style={styles.hospitalName} numberOfLines={1}>{item.display_name.split(',')[0]}</Text>
                    <Text style={styles.hospitalDist}>{item.distance} km - {item.price} FCFA</Text>
                  </View>
                  <Text style={styles.arrowIcon}>➔</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.mediaBtn, {backgroundColor: '#D32F2F'}]} onPress={() => handleMedia('photo')}>
            <Text style={styles.btnText}>📸 PRENDRE PHOTO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mediaBtn, {backgroundColor: '#D32F2F'}]} onPress={() => handleMedia('video')}>
            <Text style={styles.btnText}>🎥 FILMER URGENCE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emergencyRow}>
          <TouchableOpacity style={[styles.callBtn, {backgroundColor: '#D32F2F'}]} onPress={() => Linking.openURL('tel:119')}><Text style={styles.btnText}>SAMU</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.callBtn, {backgroundColor: '#D32F2F'}]} onPress={() => Linking.openURL('tel:117')}><Text style={styles.btnText}>POLICE</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.callBtn, {backgroundColor: '#F44336'}]} onPress={() => Linking.openURL('tel:118')}><Text style={styles.btnText}>POMPIERS</Text></TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>RETOUR</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 25, paddingTop: 50, backgroundColor: '#D32F2F', flexDirection: 'row', alignItems: 'center' },
  drawerTrigger: { marginRight: 15 },
  menuIcon: { color: '#FFF', fontSize: 24 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  card: { backgroundColor: '#F8F8F8', padding: 15, marginVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' },
  malaiseName: { fontWeight: 'bold', fontSize: 16, color: '#D32F2F', marginBottom: 5 },
  etape: { fontSize: 14, marginVertical: 2 },
  hospitalSection: { marginVertical: 10, borderTopWidth: 2, borderTopColor: '#D32F2F', paddingTop: 10 },
  hospitalCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
    padding: 15, borderRadius: 10, marginVertical: 5, elevation: 3 
  },
  hospitalName: { fontWeight: 'bold', fontSize: 14, color: '#000' },
  hospitalDist: { color: '#D32F2F', fontWeight: 'bold', marginTop: 3 },
  arrowIcon: { fontSize: 20, color: '#D32F2F' },
  actionSection: { marginVertical: 20 },
  mediaBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  emergencyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  callBtn: { padding: 15, borderRadius: 10, width: '31%', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  backBtn: { padding: 20, alignItems: 'center', backgroundColor: '#000' },
  backText: { color: '#FFF', fontWeight: 'bold' }
});