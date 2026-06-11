import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Linking, SafeAreaView, Alert, Platform, PermissionsAndroid 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera } from 'react-native-image-picker';

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

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleMedia = async (type: 'photo' | 'video') => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert("Permission", "Accès à la caméra refusé.");
      return;
    }

    launchCamera({ 
      mediaType: type, 
      videoQuality: 'medium', 
      saveToPhotos: true 
    }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) Alert.alert("Erreur", response.errorMessage);
      else Alert.alert("Succès", "Média enregistré avec succès dans la galerie.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMedia('photo')}>
            <Text style={styles.btnText}>📸 PRENDRE PHOTO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => handleMedia('video')}>
            <Text style={styles.btnText}>🎥 FILMER URGENCE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.emergencyRow}>
          <TouchableOpacity style={[styles.callBtn, {backgroundColor: '#FF9800'}]} onPress={() => Linking.openURL('tel:119')}><Text style={styles.btnText}>SAMU</Text></TouchableOpacity>
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
  header: { padding: 25, backgroundColor: '#D32F2F', alignItems: 'center' },
  title: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  card: { backgroundColor: '#F8F8F8', padding: 15, marginVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' },
  malaiseName: { fontWeight: 'bold', fontSize: 16, color: '#D32F2F', marginBottom: 5 },
  etape: { fontSize: 14, marginVertical: 2 },
  actionSection: { marginVertical: 20 },
  mediaBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  emergencyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  callBtn: { padding: 20, borderRadius: 10, width: '48%', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  backBtn: { padding: 20, alignItems: 'center', backgroundColor: '#000' },
  backText: { color: '#FFF', fontWeight: 'bold' }
});