import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // ← manquait


const firebaseConfig = {
  apiKey: "AIzaSyCJ2IBSXqtzSs7QvTlwAYZuKjCEfOaZaac",
  authDomain: "vivicity-c30d3.firebaseapp.com",
  projectId: "vivicity-c30d3",
  storageBucket: "vivicity-c30d3.firebasestorage.app",
  messagingSenderId: "716336553488",
  appId: "1:716336553488:web:27a5290b455c8c6addb495",
  measurementId: "G-21TNXSFK25"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };

