import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, SafeAreaView 
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = auth().currentUser;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: user?.email || ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const doc = await firestore().collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          setProfile(prev => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    // Nettoyage et validation du numéro de téléphone camerounais
    // Le format attendu est 9 chiffres commençant par 6 ou 2, avec optionnellement le préfixe +237
    const cleanPhone = profile.phone.replace(/\s/g, '');
    const phoneRegex = /^(?:\+237|237)?(6|2)\d{8}$/;

    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      Alert.alert("Format invalide", "Veuillez entrer un numéro camerounais valide à 9 chiffres (commençant par 6 ou 2).");
      return;
    }

    setSaving(true);
    try {
      await firestore().collection('users').doc(user.uid).set({
        name: profile.name,
        phone: cleanPhone,
        email: profile.email,
        updatedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      Alert.alert("Succès", "Profil mis à jour !");
    } catch (e) {
      Alert.alert("Erreur", "Impossible de sauvegarder les informations");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Oui", onPress: async () => {
          await auth().signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D32F2F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>MON PROFIL</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom complet</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(t) => setProfile({ ...profile, name: t })}
            placeholder="Votre nom"
            placeholderTextColor="#AAA"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={profile.phone}
            onChangeText={(t) => setProfile({ ...profile, phone: t })}
            placeholder="+237 ..."
            keyboardType="phone-pad"
            placeholderTextColor="#AAA"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email (identifiant)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={profile.email}
            editable={false}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>ENREGISTRER LES MODIFICATIONS</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>SE DÉCONNECTER</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#D32F2F', flexDirection: 'row', alignItems: 'center' },
  menuIcon: { color: '#FFF', fontSize: 24, marginRight: 20 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 25 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 12, color: '#D32F2F', fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  input: { borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 10, fontSize: 16, color: '#000' },
  disabledInput: { color: '#888', borderBottomColor: 'transparent' },
  saveBtn: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, elevation: 3 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  logoutBtn: { padding: 20, alignItems: 'center', marginTop: 20 },
  logoutBtnText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 14 }
});