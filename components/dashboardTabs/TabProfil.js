import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebase';

const TabProfil = ({ user, onLogout }) => {
  const [pseudo, setPseudo] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [userAvis, setUserAvis] = useState([]);

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedPseudo = await AsyncStorage.getItem('pseudo');
        const cachedImage = await AsyncStorage.getItem('imageUri');
        if (cachedPseudo) setPseudo(cachedPseudo);
        if (cachedImage) setImageUri(cachedImage);
        if (!cachedPseudo && user?.nom) setPseudo(user.nom);
        if (!cachedImage && user?.photoURL) setImageUri(user.photoURL);
      } catch (e) {
        console.log('Erreur chargement cache local :', e);
      }
    };

    const fetchUserAvis = async () => {
      try {
        const q = query(
          collection(db, 'avis'),
          where('email', '==', user.email)
        );
        const snapshot = await getDocs(q);
        const avisFiltres = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUserAvis(avisFiltres);
      } catch (e) {
        console.log('Erreur récupération avis Firestore :', e);
      }
    };

    if (user?.email) {
      loadCachedData();
      fetchUserAvis();
    }
  }, [user]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('pseudo', pseudo);
      if (imageUri) await AsyncStorage.setItem('imageUri', imageUri);
      Alert.alert('Profil mis à jour', 'Vos informations ont été enregistrées.');
    } catch (e) {
      console.log('Erreur sauvegarde cache local :', e);
    }
  };

  const renderInitials = (name) => {
    return name?.split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{renderInitials(pseudo || user?.nom)}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.useremail}>{user?.email}</Text>
          <TextInput
            style={styles.input}
            placeholder="Choisissez un pseudo"
            placeholderTextColor="#aaa"
            value={pseudo}
            onChangeText={setPseudo}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {userAvis.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Mes avis</Text>
          <FlatList
            data={userAvis}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.avisCard}>
                <Text style={styles.avisVille}>{item.ville}</Text>
                <Text style={styles.avisNote}>Note : {item.note}/5</Text>
                <Text style={styles.avisCommentaire}>{item.commentaire}</Text>
                {item.timestamp && (
                  <Text style={styles.avisDate}>
                    {new Date(item.timestamp.seconds * 1000).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
            scrollEnabled={false}
          />
        </>
      ) : (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 16, color: '#777', textAlign: 'center' }}>
            Tu n'as pas encore laissé d'avis.
          </Text>
          <Text style={{ fontSize: 14, color: '#999', marginTop: 6, textAlign: 'center' }}>
            Commence en évaluant ton quartier pour aider la communauté !
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default TabProfil;

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
    paddingBottom: 100,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#007bff',
    borderRadius: 40,
    width: 80,
    height: 80,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  useremail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutText: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  avisCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avisVille: {
    fontSize: 16,
    fontWeight: '600',
  },
  avisNote: {
    color: '#007bff',
    fontSize: 14,
  },
  avisCommentaire: {
    fontSize: 14,
    color: '#333',
  },
  avisDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
