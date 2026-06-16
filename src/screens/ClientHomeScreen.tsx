import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  Image, 
  StatusBar,
  TextInput,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';

const DEFAULT_VEHICLES = [
  { id: '1', name: 'Yango Economy', subtitle: 'Économique', estimate: 1200, color: '#E5A93B' },
  { id: '2', name: 'Yango Comfort', subtitle: 'Confort', estimate: 2500, color: '#1E1E1E' },
  { id: '3', name: 'Yango XL', subtitle: 'Grand volume', estimate: 4500, color: '#1E1E1E' }
];

const ROUTE_COORDS = [
  { latitude: 3.848, longitude: 11.502 },
  { latitude: 3.851, longitude: 11.508 },
  { latitude: 3.853, longitude: 11.512 },
  { latitude: 3.857, longitude: 11.520 }
];

const NEARBY_CARS = [
  { id: 'c1', latitude: 3.8495, longitude: 11.505, heading: -45 },
  { id: 'c2', latitude: 3.852, longitude: 11.509, heading: 60 },
  { id: 'c3', latitude: 3.8525, longitude: 11.507, heading: 30 },
  { id: 'c4', latitude: 3.8545, longitude: 11.515, heading: 115 },
  { id: 'c5', latitude: 3.8562, longitude: 11.518, heading: -75 }
];

export default function ClientHomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number}>({ lat: 3.848, lng: 11.502 });
  const [userAddress, setUserAddress] = useState('Position actuelle');
  const [destination, setDestination] = useState('');
  const [destCoords, setDestCoords] = useState({ lat: 3.857, lng: 11.520 });
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState(DEFAULT_VEHICLES[0]);
  const [syncing, setSyncing] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [activeSos, setActiveSos] = useState<any>(null);

  // Écouter les réservations actives de l'utilisateur
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('bookings')
      .where('userId', '==', user.uid)
      .where('status', 'in', ['searching', 'accepted', 'arrived'])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot(snapshot => {
        if (snapshot && !snapshot.empty) {
          setActiveBooking({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setActiveBooking(null);
        }
      }, err => console.log("Erreur Firestore Listener:", err));

    const unsubscribeSos = firestore()
      .collection('sos_alerts')
      .where('userId', '==', user.uid)
      .where('status', '==', 'urgent')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot(snapshot => {
        if (snapshot && !snapshot.empty) {
          setActiveSos({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setActiveSos(null);
        }
      }, err => console.log("Erreur Firestore SOS Listener:", err));

    return () => {
      unsubscribe();
      unsubscribeSos();
    };
  }, []);

  const [watchId, setWatchId] = useState<number | null>(null);

  // Gestion de la géolocalisation réelle
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getRealLocation();
        }
      } else {
        getRealLocation();
      }
    };

    const getRealLocation = () => {
      try {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            setUserAddress('Position actuelle détectée');
          },
          (error) => {
            console.log("Info GPS:", error.message);
            // On ne bloque pas l'app si le GPS échoue, on reste sur les coordonnées par défaut
          },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
        );
      } catch (e) {
        console.warn("Geolocation service non disponible");
      }
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    const loadRideOptions = async () => {
      setSyncing(true);
      try {
        const snapshot = await firestore().collection('rideOptions').orderBy('order').get();
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() as any }));
          setVehicles(loaded);
          setSelectedVehicle(loaded[0] as any);
        }
      } catch (error) {
        console.warn('Firestore load rideOptions error:', error);
      } finally {
        setSyncing(false);
      }
    };

    loadRideOptions();
  }, []);

  const cancelRide = async () => {
    if (!activeBooking) return;
    try {
      await firestore().collection('bookings').doc(activeBooking.id).update({ status: 'cancelled' });
      Alert.alert("Annulée", "Votre course a été annulée.");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'annuler la course.");
    }
  };

  const cancelSos = async () => {
    if (!activeSos) return;
    try {
      await firestore().collection('sos_alerts').doc(activeSos.id).update({ status: 'resolved' });
      Alert.alert("Terminé", "L'alerte SOS a été marquée comme résolue.");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'annuler l'alerte.");
    }
  };

  const handleRideNow = async () => {
    navigation.navigate('ConfirmRide', { 
      vehicle: selectedVehicle,
      destination: destination,
      origin: 'Ma position actuelle'
    });
  };

  const getCarImage = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('economy')) {
        return require('../assets/car_share.png');
    } else if (lowerName.includes('comfort')) {
        return require('../assets/car_private.png');
    } else if (lowerName.includes('xl')) {
        return require('../assets/car_luxury.png');
    }
    return require('../assets/car_private.png');
  };

  const getCarRotation = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('economy')) return '-20deg';
    if (lowerName.includes('comfort')) return '15deg';
    return '0deg';
  };

  const formatEstimate = (estimate: any) => {
    if (typeof estimate === 'number') {
      return `${estimate} FCFA`;
    }
    const str = String(estimate);
    if (!str.includes('$') && !str.includes('F')) {
      return `Est. $${str}`;
    }
    return `Est. ${str}`;
  };

  // Generate HTML for Leaflet Free Map (using CartoDB basemap tiles, 100% free and API-key-less)
  const mapHtml = useMemo(() => {
    const startCoords = [userLocation.lat, userLocation.lng];
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
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F5F5F5; }
          .start-marker {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(229, 169, 59, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .start-marker-inner {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #D32F2F;
          }
          .dest-marker {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: rgba(229, 169, 59, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .dest-marker-inner {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #D32F2F;
            border: 1.5px solid #FFF;
          }
          .car-container {
            transition: transform 0.2s;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { 
            zoomControl: false, 
            attributionControl: false,
            dragging: true,
            touchZoom: true,
            scrollWheelZoom: true
          }).setView([3.852, 11.511], 14);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(map);

          const start = ${JSON.stringify(startCoords)};
          const dest = [${destCoords.lat}, ${destCoords.lng}];
          const polyline = L.polyline([start, dest], { color: '#D32F2F', weight: 5, dashArray: '10, 10' }).addTo(map);
          
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

          // Start Point Marker
          const startIcon = L.divIcon({
            className: 'start-marker-icon',
            html: '<div class="start-marker"><div class="start-marker-inner"></div></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          L.marker(start, { icon: startIcon }).addTo(map);

          // Destination Point Marker
          const destIcon = L.divIcon({
            className: 'dest-marker-icon',
            html: '<div class="dest-marker"><div class="dest-marker-inner"></div></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });
          L.marker(dest, { icon: destIcon }).addTo(map);

          // Nearby Car Markers
          const cars = ${JSON.stringify(NEARBY_CARS)};
          const carIconUrl = "data:image/svg+xml;utf8," + encodeURIComponent(\`${carSvg.trim()}\`);
          
          cars.forEach(car => {
            const carIcon = L.divIcon({
              className: 'car-marker-icon',
              html: '<div class="car-container" style="transform: rotate(' + car.heading + 'deg);"><img src="' + carIconUrl + '" style="width:20px; height:40px;" /></div>',
              iconSize: [20, 40],
              iconAnchor: [10, 20]
            });
            L.marker([car.latitude, car.longitude], { icon: carIcon }).addTo(map);
          });
        </script>
      </body>
      </html>
    `;
  }, [userLocation, destCoords]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <WebView
        style={styles.map}
        source={{ html: mapHtml }}
      />

      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => navigation.openDrawer()}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      {/* SOS Button fixe */}
      <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate('Sos')}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      {/* Bouton Commencer la course */}
      <View style={styles.bottomContainer}>
        {activeSos ? (
          <View style={[styles.activeRideCard, { borderColor: '#D32F2F', borderWidth: 2 }]}>
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#D32F2F" />
              <Text style={styles.statusText}>URGENCE EN COURS</Text>
            </View>
            <Text style={styles.rideInfo}>Vers : {activeSos.hospital?.split(',')[0]}</Text>
            <TouchableOpacity style={[styles.cancelButton, {backgroundColor: '#D32F2F'}]} onPress={cancelSos}>
              <Text style={[styles.cancelButtonText, {color: '#FFF'}]}>ANNULER L'URGENCE</Text>
            </TouchableOpacity>
          </View>
        ) : activeBooking ? (
          <View style={styles.activeRideCard}>
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#D32F2F" />
              <Text style={styles.statusText}>
                {activeBooking.status === 'searching' ? 'Recherche de chauffeur...' : 
                 activeBooking.status === 'accepted' ? 'Chauffeur en route' : 'Chauffeur arrivé'}
              </Text>
            </View>
            
            <Text style={styles.rideInfo} numberOfLines={1}>📍 {activeBooking.destination}</Text>
            
            {activeBooking.status !== 'searching' && (
              <View style={styles.driverInfoBox}>
                <Text style={styles.driverName}>{activeBooking.driverName || 'Chauffeur Yango'}</Text>
                <Text style={styles.vehicleDetails}>{activeBooking.vehiclePlate || 'Toyota Corolla • Rouge'}</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.cancelButton, {marginTop: 10}]} onPress={cancelRide}>
              <Text style={styles.cancelButtonText}>ANNULER LA COURSE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.startRideBtn} 
            onPress={() => navigation.navigate('Booking')}
          >
            <Text style={styles.startRideText}>COMMENCER LA COURSE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { 
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0E0E0E',
  },
  sosButton: { 
    position: 'absolute', 
    bottom: 80, 
    right: 20, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FF3B30', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 999,
    elevation: 10,
  },
  sosText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  startRideBtn: {
    backgroundColor: '#D32F2F',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
  },
  startRideText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  menuButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 50,
    height: 50,
    backgroundColor: '#FFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 100,
  },
  menuIcon: { fontSize: 24, color: '#D32F2F' },
  activeRideCard: { backgroundColor: '#FFF', width: '100%', padding: 20, borderRadius: 20, elevation: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusText: { marginLeft: 10, fontWeight: 'bold', color: '#D32F2F' },
  rideInfo: { fontSize: 14, color: '#666', marginBottom: 15 },
  cancelButton: { backgroundColor: '#F0F0F0', padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelButtonText: { color: '#333', fontWeight: 'bold', fontSize: 12 },
  driverInfoBox: { padding: 10, backgroundColor: '#F9F9F9', borderRadius: 10, marginBottom: 5 },
  driverName: { fontWeight: 'bold', color: '#000' },
  vehicleDetails: { fontSize: 12, color: '#666' },
});