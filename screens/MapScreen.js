import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { auth, db } from '../firebase';

const MapScreen = () => {
  const [zoneMoyennes, setZoneMoyennes] = useState([]);
  const [critere, setCritere] = useState('note');
  const [zoomLevel, setZoomLevel] = useState(10);
  const [showFilter, setShowFilter] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const route = useRoute();
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [cacheData, setCacheData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = onAuthStateChanged(auth, (user) => {
      setIsConnected(!!user);
      setShowAuthModal(!user);
    });

    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Localisation requise",
          "Merci d'autoriser l'accès à la position pour afficher la carte."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    };

    getLocation();
    return () => checkAuth();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (cacheData.length === 0) {
        const snapshot = await getDocs(collection(db, 'avis'));
        const rawData = snapshot.docs.map(doc => doc.data());
        setCacheData(rawData);
      }

      const grouped = {};
      const roundCoord = (coord, precision) => {
        const factor = Math.pow(10, precision);
        return Math.round(coord * factor) / factor;
      };

      const precision = zoomLevel >= 13 ? 3 : zoomLevel >= 11 ? 2 : 1;

      (cacheData.length > 0 ? cacheData : []).forEach(avis => {
        const latKey = roundCoord(avis.latitude, precision);
        const lngKey = roundCoord(avis.longitude, precision);
        const key = `${latKey}-${lngKey}`;

        let valeur = parseFloat(avis[critere]);
        valeur = critere === 'note'
          ? Math.min(5, Math.max(0, valeur))
          : Math.min(10, Math.max(0, valeur));

        if (!grouped[key]) {
          grouped[key] = { total: 0, count: 0, lat: latKey, lng: lngKey };
        }

        grouped[key].total += valeur;
        grouped[key].count += 1;
      });

      const moyennes = Object.entries(grouped).map(([_, g]) => ({
        moyenne: (g.total / g.count).toFixed(1),
        count: g.count,
        latitude: g.lat,
        longitude: g.lng
      }));

      setZoneMoyennes(moyennes);
    } catch (error) {
      console.error('Erreur de récupération :', error);
    } finally {
      setLoading(false);
    }
  }, [critere, zoomLevel, cacheData]);

  useEffect(() => {
    fetchData();
    auditData();
  }, [fetchData]);

  useEffect(() => {
    if (cacheData.length > 0) fetchData();
  }, [cacheData]);

  const getBadgeColor = note => {
    const n = parseFloat(note);
    if (isNaN(n)) return 'gray';
    if (critere === 'note') {
      if (n >= 4) return 'green';
      if (n >= 2.5) return 'orange';
      return 'red';
    } else {
      if (n >= 8) return 'green';
      if (n >= 5) return 'orange';
      return 'red';
    }
  };

  const recenterMap = () => {
    if (userLocation) {
      const region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      mapRef.current?.animateToRegion(region, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filterIcon} onPress={() => setShowFilter(!showFilter)}>
        <Ionicons name="options-outline" size={24} color="black" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.recenterIcon} onPress={recenterMap}>
        <Ionicons name="locate" size={24} color="black" />
      </TouchableOpacity>

      {showFilter && (
        <Picker
          selectedValue={critere}
          style={styles.picker}
          onValueChange={itemValue => setCritere(itemValue)}
        >
          <Picker.Item label="Note globale" value="note" />
          <Picker.Item label="Sécurité" value="securite" />
          <Picker.Item label="Propreté" value="proprete" />
        </Picker>
      )}

      {!userLocation ? (
        <ActivityIndicator style={{ marginTop: 100 }} size="large" color="#007AFF" />
      ) : (
        <MapView
          key={critere}
          style={styles.map}
          ref={mapRef}
          region={mapRegion}
          scrollEnabled={isConnected}
          zoomEnabled={isConnected}
          onRegionChangeComplete={(region) => {
            const zoom = Math.min(20, Math.max(1, Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2)));
            setZoomLevel(zoom);
            setMapRegion(region);
          }}
        >
          {zoneMoyennes.map((zone, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
            >
              <View style={[styles.badge, { backgroundColor: getBadgeColor(zone.moyenne) }]}>
                <Text style={styles.badgeNote}>
                  {zone.moyenne} / 5 ★
                </Text>
                {zoomLevel >= 12 && (
                  <Text style={styles.badgeCount}>({zone.count} avis)</Text>
                )}
              </View>
              <View style={styles.markerDot} />
            </Marker>
          ))}
        </MapView>
      )}

      {showAuthModal && (
        <Modal visible={showAuthModal} transparent animationType="fade">
          <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Connecte-toi pour naviguer sur la carte</Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowAuthModal(false);
                  navigation.navigate('Login', { redirectTo: 'Map' });
                }}
              >
                <Text style={styles.modalButtonText}>Se connecter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowAuthModal(false);
                  navigation.navigate('Register', { redirectTo: 'Map' });
                }}
              >
                <Text style={styles.modalLink}>S'inscrire</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: 'white',
    zIndex: 10
  },
  map: {
    width: '100%',
    height: '75%'
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    maxWidth: 80,
  },
  badgeNote: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  badgeCount: {
    color: 'white',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
    marginTop: 4,
    alignSelf: 'center'
  },
  filterIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 4
  },
  recenterIcon: {
    position: 'absolute',
    top: 60,
    right: 10,
    zIndex: 1000,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 4
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalLink: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 10,
  },
  modalCancel: {
    fontSize: 14,
    color: '#888',
  },
});

const auditData = async () => {
  const snapshot = await getDocs(collection(db, "avis"));
  snapshot.forEach(doc => {
    const d = doc.data();
    const anomalies = [];

    if (d.note > 5 || d.note < 0) anomalies.push(`note: ${d.note}`);
    if (d.securite > 10 || d.securite < 0) anomalies.push(`securite: ${d.securite}`);
    if (d.proprete > 10 || d.proprete < 0) anomalies.push(`proprete: ${d.proprete}`);

    if (anomalies.length > 0) {
      console.warn(`⚠️ Anomalie [${doc.id}]: ${anomalies.join(', ')}`);
    }
  });
};

export default MapScreen;
