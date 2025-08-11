import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { db } from '../../firebase';

const themes = ['Environnement', 'Sécurité', 'Santé', 'Propreté', 'Loisirs', 'Entraide', 'Mobilité', 'Décoration', 'Autre'];

const TabActions = ({ navigation }) => {
  const [actions, setActions] = useState([]);
  const [filteredActions, setFilteredActions] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [location, setLocation] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      const auth = getAuth();
      const user = auth.currentUser;
      if (user) setUserEmail(user.email);
    })();
  }, []);

  useEffect(() => {
    const fetchActions = async () => {
      const snapshot = await getDocs(collection(db, 'actions'));
      const today = new Date();
      const fetched = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const lat = data.location?.latitude;
          const lng = data.location?.longitude;
          const theme = data.participants?.theme || 'Autre';
          const actionDate = data.date?.toDate?.() || new Date(data.date);
          return {
            id: doc.id,
            ...data,
            lat,
            lng,
            theme,
            userId: data.email,
            actionDate
          };
        })
        .filter(a => a.lat && a.lng && a.actionDate && a.actionDate >= today);

      console.log('✅ Actions chargées :', fetched);
      setActions(fetched);
    };
    fetchActions();
  }, []);

  useEffect(() => {
    if (!location) return;

    const distance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const filtered = actions.filter((a) => {
      const dist = distance(location.latitude, location.longitude, a.lat, a.lng);
      const themeMatch = selectedTheme ? a.theme === selectedTheme : true;
      return dist <= 10 && themeMatch;
    });

    const myActions = filtered.filter((a) => a.userId === userEmail);
    const otherActions = filtered.filter((a) => a.userId !== userEmail);
    setFilteredActions([...myActions, ...otherActions]);
  }, [selectedTheme, actions, location, userEmail]);

  const getIconForTheme = (theme) => {
    switch (theme) {
      case 'Environnement': return require('../../assets/icons/tree.png');
      case 'Sécurité': return require('../../assets/icons/security.png');
      case 'Santé': return require('../../assets/icons/help.png');
      case 'Propreté': return require('../../assets/icons/trash.png');
      case 'Loisirs': return require('../../assets/icons/paint.png');
      case 'Entraide': return require('../../assets/icons/help.png');
      case 'Mobilité': return require('../../assets/icons/default.png');
      case 'Décoration': return require('../../assets/icons/default.png');
      default: return require('../../assets/icons/default.png');
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {filteredActions.map((action) => (
              <Marker
                key={action.id}
                coordinate={{ latitude: action.lat, longitude: action.lng }}
                onPress={() => navigation.navigate('DetailsAction', { action })}
              >
                <Image source={getIconForTheme(action.theme)} style={styles.markerIcon} />
              </Marker>
            ))}
          </MapView>
        )}

        <FlatList
          horizontal
          data={themes}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterBar}
          renderItem={({ item: theme }) => (
            <TouchableOpacity
              style={[styles.filterButton, selectedTheme === theme && styles.activeFilter]}
              onPress={() => setSelectedTheme(theme === selectedTheme ? null : theme)}
            >
              <Text style={styles.filterText}>{theme}</Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          data={filteredActions}
          keyExtractor={(item) => item.id}
          nestedScrollEnabled
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('DetailsAction', { action: item })}>
              <View style={styles.card}>
                <Text style={styles.title}>{item.titre}</Text>
                <Text style={styles.details}>📅 {formatDate(item.date)} | 📍 {item.ville} - {item.quartier}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default TabActions;

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    height: 250,
    width: '100%',
  },
  markerIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  filterBar: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#f0f0f0'
  },
  filterButton: {
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ddd'
  },
  activeFilter: {
    backgroundColor: '#007bff'
  },
  filterText: {
    color: '#333'
  },
  card: {
    margin: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  details: {
    color: '#555'
  }
});
