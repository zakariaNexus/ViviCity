import { StyleSheet, Text, View } from 'react-native';

const TabFeliciter = () => {
  return (
    <View style={styles.tabContent}>
      <Text>Féliciter une initiative ou un bon comportement citoyen...</Text>
    </View>
  );
};

export default TabFeliciter;

const styles = StyleSheet.create({
  tabContent: {
    marginBottom: 100,
  },
});
