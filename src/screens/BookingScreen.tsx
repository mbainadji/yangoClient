import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, FlatList, Keyboard } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { calculateDistance as getGeoDistance } from '../utils/geo';

export default function BookingScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const [origin, setOrigin] = useState({ lat: 3.848, lng: 11.502 });
  const [dest, setDest] = useState({ lat: 3.857, lng: 11.520 });
  const [destinationName, setDestinationName] = useState('');
  const [isDestinationSelected, setIsDestinationSelected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [carPosition, setCarPosition] = useState<any>(null);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log(err),
      { enableHighAccuracy: true }
    );
  }, []);

  // Recherche d'adresses via Nominatim (OpenStreetMap) - conservé tel quel
  const searchPlaces = async (text: string) => {
    setDestinationName(text);
    setIsDestinationSelected(false);
    if (text.length < 1) {
      setSuggestions([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const viewboxBias = `&viewbox=${origin.lng-1},${origin.lat+1},${origin.lng+1},${origin.lat-1}&bounded=0`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=15&countrycodes=cm&accept-language=fr${viewboxBias}`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'YangoClientApp' }
        });
        const json = await response.json();
        setSuggestions(json);
      } catch (error) {
        console.error("Erreur Nominatim:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const selectSuggestion = (item: any) => {
    Keyboard.dismiss();
    setDestinationName(item.display_name);
    setSuggestions([]);
    setIsDestinationSelected(true);
    setDest({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  };

  useEffect(() => { 
    if (isDestinationSelected) {
      const d = getGeoDistance(origin.lat, origin.lng, dest.lat, dest.lng);
      setDistance(d);
      setPrice(Math.ceil(d) * 250);
      setCarPosition({ latitude: origin.lat, longitude: origin.lng });

      // Ajuster la vue de la carte pour montrer les deux points
      mapRef.current?.fitToCoordinates(
        [
          { latitude: origin.lat, longitude: origin.lng },
          { latitude: dest.lat, longitude: dest.lng },
        ],
        { edgePadding: { top: 100, right: 50, bottom: 250, left: 50 }, animated: true }
      );

      // Animer la voiture le long du trajet
      animateCar();
    }
  }, [dest, origin, isDestinationSelected]);

  const animateCar = () => {
    const duration = 5000;
    const steps = 60;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      if (progress >= 1) {
        setCarPosition({ latitude: dest.lat, longitude: dest.lng });
        clearInterval(interval);
        return;
      }
      const lat = origin.lat + (dest.lat - origin.lat) * progress;
      const lng = origin.lng + (dest.lng - origin.lng) * progress;
      setCarPosition({ latitude: lat, longitude: lng });
    }, duration / steps);
  };

  const recenterMap = () => {
    mapRef.current?.animateToRegion({
      latitude: origin.lat,
      longitude: origin.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const handleBooking = async () => {
    if (!isDestinationSelected) return Alert.alert("Erreur", "Veuillez sélectionner une destination dans la liste");
    
    navigation.navigate('ConfirmRide', {
      vehicle: { name: 'Yango Custom', estimate: price },
      destination: destinationName,
      origin: 'Ma position actuelle',
      originCoords: origin,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: origin.lat,
          longitude: origin.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
      >
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          title="Départ"
          pinColor="#2ecc71"
        />

        {isDestinationSelected && (
          <>
            <Marker
              coordinate={{ latitude: dest.lat, longitude: dest.lng }}
              title="Arrivée"
              pinColor="#D32F2F"
            />
            <Polyline
              coordinates={[
                { latitude: origin.lat, longitude: origin.lng },
                { latitude: dest.lat, longitude: dest.lng },
              ]}
              strokeColor="#D32F2F"
              strokeWidth={3}
              lineDashPattern={[10, 5]}
            />
            {carPosition && (
              <Marker coordinate={carPosition} title="Véhicule">
                <View style={styles.carMarker}>
                  <Text style={{ fontSize: 20 }}>🚗</Text>
                </View>
              </Marker>
            )}
          </>
        )}
      </MapView>
      
      <View style={styles.header}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TextInput 
            style={styles.input} 
            placeholder="Où allez-vous ?" 
            placeholderTextColor="#888"
            value={destinationName}
            onChangeText={searchPlaces}
          />
          {isSearching && (
            <ActivityIndicator style={styles.inputLoader} color="#D32F2F" />
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                  <View style={styles.suggestionRow}>
                    <Text style={styles.suggestionIcon}>📍</Text>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>{item.display_name.split(',')[0]}</Text>
                      <Text style={styles.suggestionSubtitle} numberOfLines={1}>{item.display_name.split(',').slice(1).join(',').trim()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.locateBtn} onPress={recenterMap}>
        <Text style={styles.locateIcon}>🎯</Text>
      </TouchableOpacity>

      <View style={styles.summary}>
        <Text style={styles.sumTitle}>Récapitulatif</Text>
        <View style={styles.row}>
          <Text>Distance : {distance} km</Text>
          <Text style={styles.price}>{price} FCFA</Text>
        </View>
        <TouchableOpacity 
          style={[styles.btn, !isDestinationSelected && {backgroundColor: '#EEE'}]} 
          onPress={handleBooking}
          disabled={loading || !isDestinationSelected}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>COMMANDER</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  carMarker: { backgroundColor: '#FFF', padding: 4, borderRadius: 20, elevation: 5 },
  header: { position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { backgroundColor: '#FFF', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 10, elevation: 5 },
  backIcon: { fontSize: 24, color: '#D32F2F', fontWeight: 'bold' },
  input: { flex: 1, backgroundColor: '#FFF', padding: 15, paddingRight: 45, borderRadius: 10, elevation: 5, color: '#D32F2F' },
  inputLoader: { position: 'absolute', right: 15 },
  suggestionsContainer: { backgroundColor: '#FFF', marginTop: 5, borderRadius: 10, maxHeight: 200, elevation: 5 },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center' },
  suggestionIcon: { fontSize: 16, marginRight: 10 },
  suggestionTextContainer: { flex: 1 },
  suggestionTitle: { color: '#D32F2F', fontSize: 14, fontWeight: 'bold' },
  suggestionSubtitle: { color: '#888', fontSize: 11, marginTop: 2 },
  locateBtn: { position: 'absolute', bottom: 180, right: 20, backgroundColor: '#FFF', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 5, zIndex: 5 },
  locateIcon: { fontSize: 20 },
  summary: { backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 20 },
  sumTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  price: { fontSize: 20, fontWeight: '900', color: '#D32F2F' },
  btn: { backgroundColor: '#D32F2F', padding: 18, borderRadius: 12, alignItems: 'center' },
  btnText: { fontWeight: 'bold', color: '#FFF' }
});
