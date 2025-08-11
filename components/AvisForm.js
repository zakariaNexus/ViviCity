import { Ionicons } from '@expo/vector-icons';
import Slider from "@react-native-community/slider";
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Location from "expo-location";
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Toast from 'react-native-toast-message';
import { auth, db } from '../firebase';

const screenWidth = Dimensions.get("window").width;

const Star = ({ filled, onPress }) => (
  <TouchableOpacity onPress={onPress}>
    <Text style={{ fontSize: 28 }}>{filled ? "⭐" : "☆"}</Text>
  </TouchableOpacity>
);

const AvisForm = (props) => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [ville, setVille] = useState("");
  const [quartier, setQuartier] = useState("");
  const [adresseComplete, setAdresseComplete] = useState("");
  const [securite, setSecurite] = useState(5);
  const [proprete, setProprete] = useState(5);
  const [loadingAdresse, setLoadingAdresse] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [gpsFailed, setGpsFailed] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    if (props.latitude && props.longitude) {
      setLatitude(props.latitude);
      setLongitude(props.longitude);
    }
  }, [props.latitude, props.longitude]);

  const demanderPermissionGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsFailed(true);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      setGpsFailed(false);
    } catch (err) {
      console.log("Erreur GPS :", err);
      setGpsFailed(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsConnected(true);
        setShowAuthModal(false);
        setCurrentUserEmail(user.email);

        if (!props.latitude || !props.longitude) {
          await demanderPermissionGPS();
        }
      } else {
        setIsConnected(false);
        setShowAuthModal(true);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchAdresse = async () => {
      try {
        const geoResult = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (geoResult.length > 0) {
          const adresse = geoResult[0];
          setVille(adresse.city || adresse.region || "Non identifié");
          setQuartier(adresse.district || adresse.subregion || "Non identifié");

          const adresseFormatee = `${adresse.name || ""}, ${adresse.street || ""}, ${adresse.district || ""}, ${adresse.city || adresse.region || ""}`;
          setAdresseComplete(adresseFormatee);
        }
      } catch (error) {
        console.error("Erreur reverse geocode :", error);
      } finally {
        setLoadingAdresse(false);
      }
    };

    if (latitude && longitude) {
      fetchAdresse();
    }
  }, [latitude, longitude]);

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, "avis"), {
        note,
        commentaire,
        ville,
        quartier,
        securite,
        proprete,
        adresse: adresseComplete,
        latitude,
        longitude,
        timestamp: new Date(),
        email: currentUserEmail,
      });

      Toast.show({
        type: 'success',
        text1: 'Merci pour ton avis 🙌',
        text2: 'Il a bien été enregistré',
        position: 'bottom',
        visibilityTime: 2000,
      });

      setTimeout(() => {
        navigation.navigate('Map', { latitude, longitude });
      }, 2000);
    } catch (e) {
      console.error("Erreur d'enregistrement :", e);
      Toast.show({
        type: 'error',
        text1: 'Erreur ❌',
        text2: "Impossible d'enregistrer ton avis",
        position: 'bottom',
      });
    }
  };

  if (isConnected && gpsFailed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Ionicons name="location-outline" size={48} color="#ccc" style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'center' }}>
          Position non disponible
        </Text>
        <Text style={{ fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22 }}>
          Pour garantir une évaluation pertinente de votre quartier, nous avons besoin de votre position exacte.{"\n\n"}
          Elle nous permet d’associer votre avis au bon lieu de résidence, afin d’améliorer la qualité de vie de façon ciblée.
        </Text>

        <TouchableOpacity
          onPress={demanderPermissionGPS}
          style={{
            marginTop: 24,
            backgroundColor: '#007AFF',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>Activer la localisation</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 14, color: '#888' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isConnected && (latitude === null || longitude === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12 }}>Localisation en cours...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} scrollEnabled={isConnected}>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.mapHeader}
                initialRegion={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={{ latitude, longitude }} />
              </MapView>
              <View style={styles.overlayHeader}>
                <Ionicons name="location" size={20} color="red" />
                {loadingAdresse ? (
                  <ActivityIndicator size="small" color="gray" style={{ marginLeft: 6 }} />
                ) : (
                  <Text style={styles.quartierText}>{quartier || "Chargement..."}</Text>
                )}
              </View>
            </View>

            <Text style={styles.label}>Note globale</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} filled={i <= note} onPress={() => setNote(i)} />
              ))}
            </View>

            <Text style={styles.label}>Niveau de sécurité : {securite}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={securite}
              onValueChange={setSecurite}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#ddd"
            />

            <Text style={styles.label}>Propreté : {proprete}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={proprete}
              onValueChange={setProprete}
              minimumTrackTintColor="#34C759"
              maximumTrackTintColor="#ddd"
            />

            <Text style={styles.label}>Ton commentaire</Text>
            <TextInput
              style={styles.input}
              placeholder="Donne ton avis ici..."
              multiline
              value={commentaire}
              onChangeText={setCommentaire}
            />

            <Text style={styles.label}>Ville</Text>
            <TextInput style={styles.input} value={ville} onChangeText={setVille} />

            <Text style={styles.label}>Quartier</Text>
            <TextInput style={styles.input} value={quartier} onChangeText={setQuartier} />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Envoyer l'avis</Text>
            </TouchableOpacity>
          </ScrollView>

          {showAuthModal && (
            <Modal visible={showAuthModal} transparent animationType="fade">
              <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Veuillez vous connecter</Text>

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setShowAuthModal(false);
                      navigation.navigate('Login', { redirectTo: 'Rate' });
                    }}
                  >
                    <Text style={styles.modalButtonText}>Se connecter</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShowAuthModal(false);
                      navigation.navigate('Register', { redirectTo: 'Rate' });
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 60,
    width: screenWidth,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  label: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: "bold",
    fontSize: 16,
    color: '#333',
  },
  stars: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  slider: {
    width: "100%",
    height: 40,
    marginVertical: 8,
  },
  mapContainer: {
    height: 220,
    marginBottom: 24,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  mapHeader: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayHeader: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  quartierText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 30,
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
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

export default AvisForm;
