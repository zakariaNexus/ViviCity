import { StyleSheet, Text, View } from 'react-native';

const TabIncident = () => {
  return (
    <View style={styles.tabContent}>
      <Text>Signaler un problème d’hygiène, de sécurité ou de civisme...</Text>
    </View>
  );
};

export default TabIncident;

const styles = StyleSheet.create({
  tabContent: {
    marginBottom: 100,
  },
});
