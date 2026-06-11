import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  Image, 
  StatusBar 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { db } from '../services/firebaseConfig';

const DEFAULT_VEHICLES = [
  { id: '1', name: 'Go Share', subtitle: 'Go Share', estimate: 40.50, color: '#E5A93B' },
  { id: '2', name: 'Go Private', subtitle: 'Go Private', estimate: 65.50, color: '#1E1E1E' },
  { id: '3', name: 'Go Luxury', subtitle: 'Go Luxury', estimate: 128.20, color: '#1E1E1E' }
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
  const [vehicles, setVehicles] = useState(DEFAULT_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState(DEFAULT_VEHICLES[0]);
  const [destination] = useState('Université de Yaoundé');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadRideOptions = async () => {
      setSyncing(true);
      try {
        const snapshot = await db.collection('rideOptions').orderBy('order').get();
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setVehicles(loaded as any);
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

  const handleRideNow = async () => {
    setLoading(true);
    try {
      await db.collection('bookings').add({
        vehicleName: selectedVehicle.name,
        vehicleType: selectedVehicle.name,
        pricePerKm: selectedVehicle.name === 'Go Luxury' ? 128 : selectedVehicle.name === 'Go Private' ? 65 : 40,
        destination,
        status: 'requested',
        createdAt: new Date()
      });
      Alert.alert('Réservation envoyée', 'Votre course a bien été enregistrée.');
    } catch (error) {
      console.warn('Firestore booking error:', error);
      Alert.alert('Erreur', 'Impossible d’enregistrer votre demande actuellement.');
    } finally {
      setLoading(false);
    }
  };

  const getCarImage = (name: string) => {
    switch (name) {
      case 'Go Share':
        return require('../assets/car_share.png');
      case 'Go Private':
        return require('../assets/car_private.png');
      case 'Go Luxury':
        return require('../assets/car_luxury.png');
      default:
        return require('../assets/car_private.png');
    }
  };

  const getCarRotation = (name: string) => {
    switch (name) {
      case 'Go Share':
        return '-20deg';
      case 'Go Private':
        return '15deg';
      case 'Go Luxury':
        return '0deg';
      default:
        return '0deg';
    }
  };

  const formatEstimate = (estimate: any) => {
    if (typeof estimate === 'number') {
      return `Est. $${estimate.toFixed(2)}`;
    }
    const str = String(estimate);
    if (!str.includes('$') && !str.includes('F')) {
      return `Est. $${str}`;
    }
    return `Est. ${str}`;
  };

  // Generate HTML for Leaflet Free Map (using CartoDB basemap tiles, 100% free and API-key-less)
  const getMapHtml = () => {
    // Top-down white car icon SVG with URL-encoded '#' replaced by '%23' for Android WebView compatibility
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
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0E0E0E; }
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
            background: #E5A93B;
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
            background: #E5A93B;
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
          
          L.tileLayer('https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          const routeCoords = ${JSON.stringify(ROUTE_COORDS.map(c => [c.latitude, c.longitude]))};
          const polyline = L.polyline(routeCoords, { color: '#E5A93B', weight: 4 }).addTo(map);
          
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

          // Start Point Marker
          const startIcon = L.divIcon({
            className: 'start-marker-icon',
            html: '<div class="start-marker"><div class="start-marker-inner"></div></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          L.marker(routeCoords[0], { icon: startIcon }).addTo(map);

          // Destination Point Marker
          const destIcon = L.divIcon({
            className: 'dest-marker-icon',
            html: '<div class="dest-marker"><div class="dest-marker-inner"></div></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });
          L.marker(routeCoords[routeCoords.length - 1], { icon: destIcon }).addTo(map);

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
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* WebView Map Background */}
      <WebView
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: getMapHtml() }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        scrollEnabled={false}
      />

      {/* Custom Header Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Bottom Sheet UI */}
      <View style={styles.bottomSheet}>
        {syncing && (
          <View style={styles.syncRow}>
            <ActivityIndicator color="#E5A93B" size="small" />
            <Text style={styles.syncText}>Mise à jour des services...</Text>
          </View>
        )}

        <View style={styles.cardListContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={vehicles}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.rideList}
            renderItem={({ item }) => {
              const active = selectedVehicle.id === item.id;
              return (
                <TouchableOpacity 
                  style={[
                    styles.rideCard, 
                    active ? styles.rideCardActive : styles.rideCardInactive
                  ]} 
                  onPress={() => setSelectedVehicle(item)}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={getCarImage(item.name)} 
                    style={[
                      styles.carImage, 
                      { transform: [{ rotate: getCarRotation(item.name) }] }
                    ]} 
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.rideName}>{item.name}</Text>
                    <Text 
                      style={[
                        styles.ridePrice, 
                        active ? styles.ridePriceActive : styles.ridePriceInactive
                      ]}
                    >
                      {formatEstimate(item.estimate)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Ride Now Button Area */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleRideNow} 
          disabled={loading}
          activeOpacity={0.9}
        >
          <Text style={styles.actionText}>
            {loading ? 'RESERVATION...' : 'RIDE NOW'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SOS Button (Moved to top right to preserve clean bottom view) */}
      <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate('Sos')}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0A0A' 
  },
  map: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0E0E0E',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backArrow: {
    color: '#E5A93B',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  bottomSheet: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: '#0A0A0A', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28,
    paddingTop: 40,
    overflow: 'visible',
  },
  syncRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
  },
  syncText: { 
    color: '#E5A93B', 
    fontSize: 12,
    marginLeft: 6 
  },
  cardListContainer: {
    overflow: 'visible',
    paddingHorizontal: 16,
  },
  rideList: { 
    paddingTop: 35, // Space for the overlapping cars
    paddingBottom: 20,
    overflow: 'visible',
  },
  rideCard: { 
    width: 135, 
    height: 170,
    borderRadius: 24, 
    padding: 16, 
    marginRight: 12, 
    justifyContent: 'flex-end',
    position: 'relative',
    overflow: 'visible',
  },
  rideCardActive: { 
    backgroundColor: '#E5A93B',
  },
  rideCardInactive: {
    backgroundColor: '#1E1E1E',
  },
  carImage: {
    position: 'absolute',
    top: -45,
    left: '50%',
    marginLeft: -65,
    width: 130,
    height: 140,
    resizeMode: 'contain',
  },
  cardInfo: {
    marginTop: 'auto',
  },
  rideName: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 4 
  },
  ridePrice: { 
    fontSize: 13, 
    fontWeight: '600'
  },
  ridePriceActive: {
    color: '#3E2723',
  },
  ridePriceInactive: {
    color: '#8E8E93',
  },
  actionButton: { 
    backgroundColor: '#000000', 
    paddingVertical: 24, 
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: '#181818',
  },
  actionText: { 
    color: '#E5A93B', 
    fontWeight: '800', 
    fontSize: 17,
    letterSpacing: 2,
  },
  sosButton: { 
    position: 'absolute', 
    top: 50, 
    right: 20, 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#FF3B30', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10,
  },
  sosText: { 
    color: '#FFF', 
    fontSize: 12, 
    fontWeight: '800' 
  }
});