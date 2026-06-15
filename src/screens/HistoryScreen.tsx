import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MOCK_HISTORY = [
  { id: '1', date: 'Hier, 14:20', route: 'Messa → Bastos', price: '2500 FCFA', type: 'Yango Comfort', status: 'Terminée' },
  { id: '2', date: '25 Mai, 09:15', route: 'Poste Centrale → Univ Yaoundé I', price: '1200 FCFA', type: 'Yango Economy', status: 'Terminée' },
  { id: '3', date: '20 Mai, 18:45', route: 'Aéroport → Centre-ville', price: '4500 FCFA', type: 'Yango XL', status: 'Annulée' },
];

export default function HistoryScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Text style={styles.menuBtnRed}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historique des courses</Text>
      </View>

      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={[styles.status, { color: '#D32F2F' }]}>{item.status}</Text>
            </View>
            <Text style={styles.route}>{item.route}</Text>
            <View style={styles.row}>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.priceRed}>{item.price}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  menuBtnRed: { fontSize: 24, marginRight: 20, color: '#D32F2F' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#D32F2F' },
  card: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  date: { color: '#888', fontSize: 12 },
  status: { fontSize: 12, fontWeight: 'bold' },
  route: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F', marginVertical: 8 },
  type: { color: '#555', fontSize: 13 },
  priceRed: { fontWeight: 'bold', color: '#D32F2F' }
});