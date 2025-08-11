import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import DashboardScreen from './screens/DashboardScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import MapScreen from './screens/MapScreen';
import { default as AvisForm, default as RatingScreen } from './screens/RatingScreen';
import RegisterScreen from './screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Accueil' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Tableau de bord' }} />
          <Stack.Screen name="Rate" component={RatingScreen} options={{ title: 'Évaluer' }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Carte interactive' }} />
          <Stack.Screen name="AvisForm" component={AvisForm} options={{ title: 'Donner un avis' }} />
        </Stack.Navigator>
        <Toast />
      </View>
    </NavigationContainer>
  );
}
