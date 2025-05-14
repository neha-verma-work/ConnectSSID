import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SSIDListScreen = ({ navigation }) => {
  const [ssidList, setSSIDList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSSID, setEditingSSID] = useState(null);
  const [newSSID, setNewSSID] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadSSIDs();
    
    // Refresh list when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadSSIDs();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadSSIDs = async () => {
    try {
      setLoading(true);
      const ssidListJSON = await AsyncStorage.getItem('ssidList');
      
      if (ssidListJSON) {
        setSSIDList(JSON.parse(ssidListJSON));
      } else {
        setSSIDList([]);
      }
    } catch (error) {
      console.error('Load error:', error);
      Alert.alert('Error', 'Failed to load saved networks.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingSSID(item);
    setNewSSID(item.ssid);
    setNewPassword(item.password);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Network',
      'Are you sure you want to delete this network?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const updatedList = ssidList.filter(item => item.id !== id);
              await AsyncStorage.setItem('ssidList', JSON.stringify(updatedList));
              setSSIDList(updatedList);
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete network.');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  const saveEditedNetwork = async () => {
    if (!newSSID.trim()) {
      Alert.alert('Error', 'Network name cannot be empty');
      return;
    }

    try {
      // Check if new SSID already exists (excluding the current item)
      const duplicateSSID = ssidList.some(
        item => item.ssid === newSSID && item.id !== editingSSID.id
      );
      
      if (duplicateSSID) {
        Alert.alert('Error', 'This network name already exists');
        return;
      }

      const updatedList = ssidList.map(item => {
        if (item.id === editingSSID.id) {
          return { ...item, ssid: newSSID, password: newPassword };
        }
        return item;
      });
      
      await AsyncStorage.setItem('ssidList', JSON.stringify(updatedList));
      setSSIDList(updatedList);
      setModalVisible(false);
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update network information.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading networks...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {ssidList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved networks found</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddSSID')}
          >
            <Text style={styles.buttonText}>Add Network</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ssidList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.networkItem}>
              <View style={styles.networkInfo}>
                <Text style={styles.ssidText}>{item.ssid}</Text>
                <Text style={styles.passwordText}>Password: {item.password}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEdit(item)}
                >
                  <Icon name="edit" size={24} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Icon name="delete" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Edit Network Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Network</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Network Name (SSID)</Text>
              <TextInput
                style={styles.input}
                value={newSSID}
                onChangeText={setNewSSID}
                placeholder="Enter WiFi network name"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter WiFi password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEditedNetwork}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 10,
  },
  networkItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  networkInfo: {
    flex: 1,
  },
  ssidText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  passwordText: {
    marginTop: 5,
    color: '#555',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 5,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SSIDListScreen;