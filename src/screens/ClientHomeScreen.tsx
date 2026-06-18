import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, StatusBar,
  PermissionsAndroid, Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Geolocation from 'react-native-geolocation-service';

export default function ClientHomeScreen() {
  const navigation = useNavigation<any>();
  const webViewRef = useRef<any>(null);
  const [userLocation, setUserLocation] = useState({ lat: 3.848, lng: 11.502 });
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);

  // GPS client
  useEffect(() => {
    const requestAndGet = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      Geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.log(err),
        { enableHighAccuracy: false, timeout: 20000 }
      );
    };
    requestAndGet();
  }, []);

  // Écouter la course active du client
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsub = firestore()
      .collection('courses')
      .where('clientId', '==', user.uid)
      .where('status', 'in', ['en_attente', 'acceptee'])
      .orderBy('createdAt', 'desc')
      .limit(1)
      .onSnapshot(snap => {
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
          setActiveCourse(data);

          // Si chauffeur a une position
          if ((data as any).driverLocation) {
            const dl = (data as any).driverLocation;
            setDriverLocation({ lat: dl.lat, lng: dl.lng });

            // Envoyer position chauffeur à la WebView
            webViewRef.current?.injectJavaScript(`
              updateDriverMarker(${dl.lat}, ${dl.lng});
              true;
            `);
          }

          // Notifier si chauffeur vient d'accepter
          if ((data as any).status === 'acceptee' && !(activeCourse?.driverId)) {
            Alert.alert("Chauffeur trouvé !", "Un chauffeur a accepté votre course. Il arrive bientôt.");
          }
        } else {
          setActiveCourse(null);
          setDriverLocation(null);
        }
      }, err => console.log(err));

    return unsub;
  }, []);

  const cancelRide = async () => {
    if (!activeCourse) return;
    await firestore().collection('courses').doc(activeCourse.id).update({ status: 'annulee' }).catch(() => {});
    setActiveCourse(null);
    Alert.alert("Annulée", "Votre course a été annulée.");
  };

  const mapHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>body, html, #map { margin:0; padding:0; width:100%; height:100%; }</style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false })
          .setView([${userLocation.lat}, ${userLocation.lng}], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

        // Marker client
        L.circleMarker([${userLocation.lat}, ${userLocation.lng}], { radius: 8, color: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 1 })
          .bindPopup('Vous').addTo(map);

        // Marker chauffeur (mis à jour dynamiquement)
        let driverMarker = null;

        function updateDriverMarker(lat, lng) {
          if (driverMarker) {
            driverMarker.setLatLng([lat, lng]);
          } else {
            driverMarker = L.marker([lat, lng], {
              icon: L.divIcon({
                html: '<div style="font-size:24px">🚗</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })
            }).bindPopup('Chauffeur').addTo(map);
          }
          map.panTo([lat, lng]);
        }
      </script>
    </body>
    </html>
  `, [userLocation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <WebView ref={webViewRef} style={styles.map} source={{ html: mapHtml }} />

      <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate('Sos')}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        {activeCourse ? (
          <View style={styles.activeRideCard}>
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#D32F2F" />
              <Text style={styles.statusText}>
                {activeCourse.status === 'en_attente' ? 'Recherche de chauffeur...' : '🚗 Chauffeur en route'}
              </Text>
            </View>
            <Text style={styles.rideInfo}>📍 {activeCourse.destination}</Text>
            <Text style={styles.ridePrice}>{activeCourse.price}</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelRide}>
              <Text style={styles.cancelButtonText}>ANNULER LA COURSE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startRideBtn} onPress={() => navigation.navigate('Booking')}>
            <Text style={styles.startRideText}>COMMENCER LA COURSE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFill },
  menuButton: { position: 'absolute', top: 60, left: 20, width: 50, height: 50, backgroundColor: '#FFF', borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5, zIndex: 100 },
  menuIcon: { fontSize: 24, color: '#D32F2F' },
  sosButton: { position: 'absolute', bottom: 160, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', zIndex: 999, elevation: 10 },
  sosText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  startRideBtn: { backgroundColor: '#D32F2F', paddingVertical: 18, borderRadius: 30, alignItems: 'center', elevation: 5 },
  startRideText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  activeRideCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusText: { marginLeft: 10, fontWeight: 'bold', color: '#D32F2F' },
  rideInfo: { fontSize: 14, color: '#666', marginBottom: 5 },
  ridePrice: { fontSize: 20, fontWeight: '900', color: '#D32F2F', marginBottom: 15 },
  cancelButton: { backgroundColor: '#F0F0F0', padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelButtonText: { color: '#333', fontWeight: 'bold', fontSize: 12 },
});
