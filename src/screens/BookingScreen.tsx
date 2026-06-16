import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, FlatList, Keyboard } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { calculateDistance as getGeoDistance } from '../utils/geo';

export default function BookingScreen() {
  const navigation = useNavigation<any>();
  const webViewRef = useRef<WebView>(null);
  const [origin, setOrigin] = useState({ lat: 3.848, lng: 11.502 });
  const [dest, setDest] = useState({ lat: 3.857, lng: 11.520 });
  const [destinationName, setDestinationName] = useState('');
  const [isDestinationSelected, setIsDestinationSelected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log(err),
      { enableHighAccuracy: true }
    );
  }, []);

  // Recherche d'adresses via Google Places Autocomplete
  const searchPlaces = async (text: string) => {
    setDestinationName(text);
    setIsDestinationSelected(false);
    if (text.length < 1) {
      setSuggestions([]);
      return;
    }

    // Annuler le scan précédent si l'utilisateur continue de taper
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    // Attendre 500ms avant de lancer la recherche (Debounce)
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);

      try {
        // Amélioration de la requête Nominatim :
        // - limit=15 : pour voir plus de carrefours et quartiers
        // - accept-language=fr : pour mieux matcher "Carrefour", "Quartier", etc.
        // - viewbox : on donne un indice sur la zone actuelle pour prioriser les résultats proches
        const viewboxBias = `&viewbox=${origin.lng-1},${origin.lat+1},${origin.lng+1},${origin.lat-1}&bounded=0`;
        
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=15&countrycodes=cm&accept-language=fr${viewboxBias}`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'YangoClientApp' // Nominatim requiert un User-Agent
          }
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

  // Récupérer les coordonnées GPS d'un lieu sélectionné
  const selectSuggestion = (item: any) => {
    Keyboard.dismiss();
    setDestinationName(item.display_name);
    setSuggestions([]);
    setIsDestinationSelected(true);
    
    // OpenStreetMap donne déjà les coordonnées lat/lon
    setDest({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
  };

  // Recalculer la distance et le prix uniquement quand c'est nécessaire
  useEffect(() => { 
    if (isDestinationSelected) {
      const d = getGeoDistance(origin.lat, origin.lng, dest.lat, dest.lng);
      setDistance(d);
      setPrice(Math.ceil(d) * 250);
    }
  }, [dest, origin, isDestinationSelected]);

  // Fonction pour recentrer la carte avec une transition fluide
  const recenterMap = () => {
    const js = `window.map.flyTo([${origin.lat}, ${origin.lng}], 15, {
      animate: true,
      duration: 1.5, // Durée en secondes
      easeLinearity: 0.25
    });`;
    webViewRef.current?.injectJavaScript(js);
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

  const carSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 60" width="30" height="60">
      <rect x="1" y="8" width="4" height="10" rx="2" fill="%23111" />
      <rect x="25" y="8" width="4" height="10" rx="2" fill="%23111" />
      <rect x="1" y="42" width="4" height="10" rx="2" fill="%23111" />
      <rect x="25" y="42" width="4" height="10" rx="2" fill="%23111" />
      <rect x="4" y="4" width="22" height="52" rx="6" fill="%23D0D0D0" />
      <rect x="5" y="3" width="20" height="52" rx="6" fill="%23FFFFFF" />
      <path d="M 7,16 L 23,16 L 21,22 L 9,22 Z" fill="%231A1A1A" />
      <rect x="8" y="22" width="14" height="16" rx="2" fill="%23EFEFEF" />
      <path d="M 8,38 L 22,38 L 21,43 L 9,43 Z" fill="%231A1A1A" />
      <rect x="7" y="3" width="4" height="2" rx="0.5" fill="%23F7C74B" />
      <rect x="19" y="3" width="4" height="2" rx="0.5" fill="%23F7C74B" />
    </svg>
  `.trim();

  const mapHtml = useMemo(() => `
    <!DOCTYPE html><html><head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>body,html,#map{margin:0;padding:0;height:100%}</style>
    </head><body><div id="map"></div><script>
      window.map = L.map('map', {zoomControl:false}).setView([${origin.lat}, ${origin.lng}], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
      L.marker([${origin.lat}, ${origin.lng}]).addTo(map).bindPopup('Départ');
      
      ${isDestinationSelected ? `
        const startPos = [${origin.lat}, ${origin.lng}];
        const destPos = [${dest.lat}, ${dest.lng}];
        L.marker(destPos).addTo(map).bindPopup('Arrivée'); 
        const route = L.polyline([startPos, destPos], {color:'#D32F2F', dashArray: '5, 10'}).addTo(map);
        map.fitBounds(route.getBounds(), { padding: [50, 50] });

        // Animation voiture
        const carIcon = L.divIcon({
          className: 'car-marker-icon',
          html: '<div id="car-rotate" style="transform: rotate(0deg);"><img src="data:image/svg+xml;utf8,${encodeURIComponent(carSvg)}" style="width:20px; height:40px;" /></div>',
          iconSize: [20, 40],
          iconAnchor: [10, 20]
        });
        const carMarker = L.marker(startPos, { icon: carIcon }).addTo(map);

        function animateTrip() {
          let startTime = null;
          const duration = 5000; // Durée du trajet simulé (5s)
          const angle = Math.atan2(destPos[1] - startPos[1], destPos[0] - startPos[0]) * 180 / Math.PI;
          const rotateDiv = document.getElementById('car-rotate');
          if (rotateDiv) rotateDiv.style.transform = 'rotate(' + angle + 'deg)';

          function frame(time) {
            if (!startTime) startTime = time;
            const progress = (time - startTime) / duration;
            if (progress < 1) {
              const currentLat = startPos[0] + (destPos[0] - startPos[0]) * progress;
              const currentLng = startPos[1] + (destPos[1] - startPos[1]) * progress;
              carMarker.setLatLng([currentLat, currentLng]);
              requestAnimationFrame(frame);
            } else {
              carMarker.setLatLng(destPos);
            }
          }
          requestAnimationFrame(frame);
        }
        setTimeout(animateTrip, 500);
      ` : ''}
    </script></body></html>
  `, [origin, dest, isDestinationSelected]);

  return (
    <View style={styles.container}>
      <WebView 
        ref={webViewRef}
        source={{ html: mapHtml }} 
        style={styles.map} 
      />
      
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

      {/* Bouton pour revenir au point de départ */}
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