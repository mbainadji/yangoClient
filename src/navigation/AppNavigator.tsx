import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import auth from '@react-native-firebase/auth';

// Import des écrans
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ClientHomeScreen from '../screens/ClientHomeScreen';
import BookingScreen from '../screens/BookingScreen';
import SosScreen from '../screens/SosScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ConfirmRideScreen from '../screens/ConfirmRideScreen';
import DestinationSearchScreen from '../screens/DestinationSearchScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

/**
 * Pile de navigation pour les fonctionnalités de course
 * On l'isole pour que le Drawer reste propre
 */
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="ConfirmRide" component={ConfirmRideScreen} />
      <Stack.Screen name="DestinationSearch" component={DestinationSearchScreen} />
    </Stack.Navigator>
  );
}

/**
 * Composant personnalisé pour le contenu du Drawer
 */
function CustomDrawerContent(props: any) {
  const user = auth().currentUser;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.drawerHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>Bonjour,</Text>
        <Text style={styles.userEmail}>{user?.email || 'Utilisateur'}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

/**
 * Menu latéral principal
 */
function MainDrawer() {
  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#D32F2F',
        drawerStyle: { backgroundColor: '#FFF', width: 280 }
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeStack} 
        options={{ title: 'Accueil' }} 
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            navigation.navigate('Home', { screen: 'ClientHome' });
          },
        })}
      />
      <Drawer.Screen name="History" component={HistoryScreen} options={{ title: 'Mes courses' }} />
      <Drawer.Screen name="Sos" component={SosScreen} options={{ title: 'Centre de secours' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mon Profil' }} />
    </Drawer.Navigator>
  );
}

/**
 * Navigateur Racine
 */
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      {/* Une fois connecté, on bascule sur le Drawer */}
      <Stack.Screen name="MainApp" component={MainDrawer} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    backgroundColor: '#D32F2F',
    height: 180,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#D32F2F',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    color: '#EEE',
    fontSize: 14,
  },
  userEmail: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});