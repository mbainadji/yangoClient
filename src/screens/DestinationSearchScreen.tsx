import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SUGGESTIONS = [
  { id: '1', title: 'Université de Yaoundé I', address: 'Ngoa-Ekellé, Yaoundé', coords: { lat: 3.8614, lng: 11.5008 } },
  { id: '2', title: 'Poste Centrale', address: 'Centre-ville, Yaoundé', coords: { lat: 3.8707, lng: 11.5181 } },
  { id: '3', title: 'Aéroport de Nsimalen', address: 'Yaoundé', coords: { lat: 3.7222, lng: 11.5533 } },
  { id: '4', title: 'Bastos', address: 'Yaoundé', coords: { lat: 3.8961, lng: 11.5117 } },
  { id: '5', title: 'Mvan', address: 'Gare routière, Yaoundé', coords: { lat: 3.8241, lng: 11.5165 } },
  { id: '6', title: 'Hôpital Central', address: 'Yaoundé', coords: { lat: 3.8711, lng: 11.5135 } },
];

export default function DestinationSearchScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');

  const handleSelect = (item: any) => {
    // On retourne à l'écran d'accueil avec la destination sélectionnée
    // Dans une version plus avancée, on utiliserait un Context ou un état global
    navigation.navigate('ClientHome', { 
      selectedDestination: item.title,
      destinationCoords: item.coords 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Où allez-vous ?"
            placeholderTextColor="#888"
            autoFocus
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={SUGGESTIONS.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <View style={styles.itemIconContainer}>
              <Text style={styles.itemIcon}>📍</Text>
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemAddress}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backIcon: { 
    fontSize: 24, 
    color: '#000',
    fontWeight: 'bold'
  },
  inputContainer: {
    flex: 1,
    height: 45,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 15,
    justifyContent: 'center'
  },
  input: { 
    fontSize: 16,
    color: '#000',
  },
  list: {
    paddingVertical: 10,
  },
  item: { 
    flexDirection: 'row',
    padding: 15, 
    alignItems: 'center',
    borderBottomWidth: 1, 
    borderBottomColor: '#F8F8F8' 
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemIcon: { fontSize: 18 },
  itemTextContainer: { flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  itemAddress: { color: '#888', fontSize: 12, marginTop: 2 }
});