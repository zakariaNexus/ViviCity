import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const PickerField = ({ label, value, options, onSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item) => {
    onSelect(item);
    setModalVisible(false);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
        <Text style={{ color: value ? '#000' : '#999' }}>
          {value || `Choisissez un ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" style={styles.icon} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sélectionner un {label.toLowerCase()}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PickerField;

const styles = StyleSheet.create({
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  icon: {
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    maxHeight: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10
  },
  cancelText: {
    color: '#007bff',
    fontSize: 16
  }
});
