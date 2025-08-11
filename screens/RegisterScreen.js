import { useNavigation, useRoute } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { auth } from '../firebase';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const redirectTo = route.params?.redirectTo;
  const locationParams = route.params?.locationParams;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);

      if (redirectTo) {
        if (locationParams) {
          navigation.replace(redirectTo, {
            latitude: locationParams.latitude,
            longitude: locationParams.longitude
          });
        } else {
          navigation.replace(redirectTo);
        }
      } else {
        navigation.replace('Dashboard');
      }

    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le compte.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Créer un compte</Text>

        <TextInput
          placeholder="Adresse mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={(text) => setEmail(text)}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          value={password}
          onChangeText={(text) => setPassword(text)}
          style={styles.input}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>S'inscrire</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login', { redirectTo, locationParams })}>
          <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.linkTextSecondary}>Retour à l’accueil</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  linkText: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 8,
  },
  linkTextSecondary: {
    fontSize: 14,
    color: '#888',
  },
});
