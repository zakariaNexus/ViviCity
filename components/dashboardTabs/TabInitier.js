import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { addDoc, collection } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
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
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebase';
import PickerField from '../PickerField';

const themes = {
  proprete: ['Nettoyage des espaces publics', 'Installation de poubelles', 'Tri des déchets', 'Ramassage citoyen', 'Autre'],
  securite: ['Ronde de quartier', 'Installation d’éclairage', 'Signalisation zones à risques', 'Groupe de vigilance locale', 'Autre'],
  environnement: ['Plantation d’arbres', 'Jardin partagé', 'Collecte déchets verts', 'Lutte contre nuisibles', 'Autre'],
  entraide: ['Distribution alimentaire', 'Covoiturage solidaire', 'Garde d’enfants', 'Collecte de vêtements', 'Autre'],
  mobilite: ['Zone piétonne', 'Parking vélos', 'Réaménagement trottoirs', 'Proposition de circuit de bus', 'Autre'],
  decoration: ['Fresques murales', 'Jardinières de rue', 'Réhabilitation de bancs', 'Mise en valeur monuments', 'Autre']
};

import { useNavigation } from '@react-navigation/native';

const TabInitier = () => {
  const navigation = useNavigation();
  const [showRecap, setShowRecap] = useState(false);
  const [region, setRegion] = useState(null);
  const [marker, setMarker] = useState(null);
  const [theme, setTheme] = useState('');
  const [type, setType] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date(Date.now() + 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(coords);
      setMarker({ latitude: coords.latitude, longitude: coords.longitude });
    })();
  }, []);

  const handleSubmit = async () => {
    if (!titre || !theme || !type || !marker) {
      alert("Merci de compléter tous les champs et de positionner le marqueur sur la carte.");
      return;
    }
    setShowRecap(true);
  };

  const minDate = new Date(Date.now() + 86400000);
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      if (selectedDate >= minDate && selectedDate <= maxDate) {
        setDate(selectedDate);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Date invalide',
          text2: 'Choisissez une date entre demain et 6 mois maximum.'
        });
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {region && (
        <MapView
          style={{ height: 250 }}
          region={region}
          onPress={(e) => setMarker(e.nativeEvent.coordinate)}
        >
          {marker && <Marker coordinate={marker} draggable onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)} />} 
        </MapView>
      )}
      <Text style={styles.infoText}>
        Déplacez le marqueur sur le lieu exact de l'action. Ce point servira de lieu de rencontre le jour de l'exécution.
      </Text>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Titre de l'action</Text>
            <TextInput style={styles.input} value={titre} onChangeText={setTitre} placeholder="Ex : Nettoyage du parc" />
            <PickerField label="Thème" value={theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : ''} options={Object.keys(themes).map(k => k.charAt(0).toUpperCase() + k.slice(1))} onSelect={val => { const key = val.toLowerCase(); setTheme(key); setType(''); }} />
            {theme && <PickerField label="Type d'action" value={type} options={themes[theme]} onSelect={setType} />}

            <Text style={styles.label}>Date d'exécution</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="calendar" size={16} color="#555" style={{ marginRight: 8 }} />
                <Text>{date ? date.toLocaleDateString('fr-FR') : ''}</Text>
              </View>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                onChange={handleDateChange}
                minimumDate={minDate}
                maximumDate={maxDate}
                locale="fr-FR"
                themeVariant="light"
              />
            )}

            <Text style={styles.label}>Description (optionnelle)</Text>
            <TextInput style={[styles.input, { height: 80 }]} multiline numberOfLines={4} placeholder="Ajoutez une description..." value={description} onChangeText={setDescription} />
            <TouchableOpacity
              style={[styles.submitButton, (!titre || !theme || !type || !marker) && { backgroundColor: '#ccc' }]}
              onPress={handleSubmit}
              disabled={!titre || !theme || !type || !marker}
            >
              <Text style={styles.submitText}>Lancer l'action</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal visible={showRecap} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.label}>Récapitulatif :</Text>
            <Text><Text style={{fontWeight:'bold'}}>Titre :</Text> {titre}</Text>
            <Text><Text style={{fontWeight:'bold'}}>Thème :</Text> {theme}</Text>
            <Text><Text style={{fontWeight:'bold'}}>Type :</Text> {type}</Text>
            <Text><Text style={{fontWeight:'bold'}}>Date :</Text> {date.toLocaleDateString()}</Text>
            <Text><Text style={{fontWeight:'bold'}}>Description :</Text> {description || 'Aucune'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
              <TouchableOpacity onPress={async () => {
                try {
                  await addDoc(collection(db, 'actions'), {
                    titre,
                    theme,
                    type,
                    description,
                    date,
                    location: marker,
                    email: auth.currentUser.email,
                    timestamp: new Date(),
                    participants: [],
                  });
                  Toast.show({ type: 'success', text1: 'Merci pour votre contribution 🙌', text2: 'Votre action a été enregistrée !' });
                  setTitre(''); setTheme(''); setType(''); setDescription(''); setDate(new Date(Date.now() + 86400000));
                } catch (e) {
                  console.log('Erreur enregistrement action :', e);
                  alert('Erreur lors de la soumission.');
                }
                setShowRecap(false);
navigation.navigate('Dashboard');
              }} style={[styles.submitButton, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.submitText}>Confirmer</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowRecap(false)} style={[styles.submitButton, { backgroundColor: '#aaa', flex: 1, marginLeft: 8 }]}>
                <Text style={styles.submitText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TabInitier;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  formContainer: { backgroundColor: '#fff', padding: 16, paddingBottom: 40, flexGrow: 1, justifyContent: 'flex-start' },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, fontSize: 14, backgroundColor: '#fff', marginBottom: 16 },
  submitButton: { backgroundColor: '#007bff', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  infoText: { padding: 12, paddingBottom: 0, fontSize: 13, color: '#555' }
});
