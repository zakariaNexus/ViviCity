import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { auth, db } from '../firebase';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [ville, setVille] = useState('');
  const [noteVille, setNoteVille] = useState(null);
  const [avisProches, setAvisProches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsConnected(!!user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation(false);
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);

      let adresse = await Location.reverseGeocodeAsync(loc.coords);
      const villeTrouvee = adresse[0]?.city || adresse[0]?.region || 'Ville inconnue';
      setVille(villeTrouvee);

      const snapshot = await getDocs(collection(db, 'avis'));
      const avis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const avisDansVille = avis.filter(a => a.ville === villeTrouvee);
      const moyenneVille = avisDansVille.length
        ? (avisDansVille.reduce((sum, a) => sum + parseFloat(a.note), 0) / avisDansVille.length).toFixed(1)
        : '–';
      setNoteVille(moyenneVille);

      const rayonKm = 5;
      const rayonDeg = rayonKm / 111;
      const avisRadius = avis.filter(a => {
        const dLat = a.latitude - loc.coords.latitude;
        const dLng = a.longitude - loc.coords.longitude;
        return dLat * dLat + dLng * dLng <= rayonDeg * rayonDeg;
      });

      console.log('Avis affichés (proches)', avisRadius.map(a => a.id));
      setAvisProches(avisRadius);

      setLoading(false);
    })();
  }, []);

  const getBadgeColor = (note) => {
    const n = parseFloat(note);
    if (isNaN(n)) return "#ccc";
    if (n >= 4) return "#34C759";
    if (n >= 2.5) return "#FFCC00";
    return "#FF3B30";
  };

  const renderStars = (note) => {
    const fullStars = Math.floor(note);
    const hasHalf = note - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    return (
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {[...Array(fullStars)].map((_, i) => (
          <FontAwesome key={`f-${i}`} name="star" size={14} color="#FFD700" />
        ))}
        {hasHalf && <FontAwesome name="star-half" size={14} color="#FFD700" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FontAwesome key={`e-${i}`} name="star-o" size={14} color="#FFD700" />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bienvenue sur <Text style={styles.brand}>ViviCity</Text></Text>

      <Text style={styles.explanation}>
        ViviCity est une application citoyenne 100% gratuite. Elle te permet d'évaluer ton quartier, de découvrir les ressentis d'autres habitants, et surtout, d'agir pour améliorer ton cadre de vie.
      </Text>

      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 8, fontSize: 14, color: '#555' }}>
            Chargement de votre position et des avis...
          </Text>
        </View>
      ) : location ? (
        <>
          <MapView
            style={styles.map}
            region={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.045,
              longitudeDelta: 0.045,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {avisProches.map((a) => (
              <Marker
                key={a.id}
                coordinate={{ latitude: a.latitude, longitude: a.longitude }}
              >
                <View style={[styles.badge, { backgroundColor: getBadgeColor(a.note) }]}>
                  <Text style={styles.badgeText}>{parseFloat(a.note).toFixed(1)}/5</Text>
                </View>
                <View style={styles.markerDot} />
              </Marker>
            ))}
          </MapView>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>📍 Ville : {ville}</Text>
            <Text style={styles.infoText}>⭐ Note moyenne : {noteVille}</Text>
          </View>

          <FlatList
            horizontal
            data={avisProches.slice(0, 10)}
            keyExtractor={(item) => item.id}
            style={styles.reviewList}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                {renderStars(parseFloat(item.note))}
                <Text numberOfLines={4} ellipsizeMode="tail" style={styles.reviewText}>
                  {item.commentaire || 'Pas de commentaire.'}
                </Text>
              </View>
            )}
          />

          <View style={styles.buttonGroupInline}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.button}
              onPress={() =>
                isConnected
                  ? navigation.navigate('Dashboard')
                  : navigation.navigate('Login', { redirectTo: 'Dashboard' })
              }
            >
              <Text style={styles.buttonText}>
                {isConnected ? "Mon tableau de bord" : "Je me connecte pour contribuer"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                const coords = {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude
                };
                if (isConnected) {
                  navigation.navigate('Rate', coords);
                } else {
                  navigation.navigate('Login', {
                    redirectTo: 'Rate',
                    locationParams: coords
                  });
                }
              }}
            >
              <Text style={styles.linkButtonText}>Évaluer mon quartier 📝</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Map')}>
              <Text style={styles.linkButtonText}>Découvrir tous les quartiers ↗️</Text>
            </TouchableOpacity>
          </View>

          {isConnected && (
            <TouchableOpacity
              onPress={() => {
                signOut(auth)
                  .then(() => console.log('Déconnecté avec succès'))
                  .catch((err) => console.error('Erreur lors de la déconnexion :', err));
              }}
            >
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.infoBox}>
          <Text style={{ fontSize: 14, textAlign: 'center' }}>
            📍 La position n’a pas pu être récupérée. Veuillez activer les services de localisation dans vos paramètres ou réessayer plus tard.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    padding: 14,
    backgroundColor: '#f4f4f4'
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center'
  },
  brand: { color: '#007AFF' },
  explanation: {
    fontSize: 16,
    color: '#444',
    marginBottom: 12,
    textAlign: 'center'
  },
  map: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginVertical: 6
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 50,
  },
  badgeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  markerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#333",
    marginTop: 4,
    alignSelf: "center",
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 3,
  },
  reviewList: {
    marginTop: 10,
    marginBottom: 4
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 5,
    width: 180,
    height: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
  },
  buttonGroupInline: {
    marginTop: 12,
    alignItems: 'center'
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '600'
  },
  linkButton: {
    marginBottom: 6,
  },
  linkButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '500'
  },
  logoutText: {
    fontSize: 13,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
    textDecorationLine: 'underline'
  }
});
