import { useRoute } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import AvisForm from '../components/AvisForm';

export default function RatingScreen() {
  const route = useRoute();
  const latitude = route?.params?.latitude;
  const longitude = route?.params?.longitude;

  const hasValidLocation =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {hasValidLocation ? (
          <AvisForm latitude={latitude} longitude={longitude} />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#555', textAlign: 'center', paddingHorizontal: 20 }}>
              La localisation est manquante ou incorrecte. Veuillez revenir à l’accueil et réessayer.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
