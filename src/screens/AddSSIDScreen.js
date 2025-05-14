import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddSSIDScreen = ({ navigation }) => {
  const [ssid, setSSID] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    if (!ssid.trim()) {
      Alert.alert('Error', 'Please enter a network name (SSID)');
      return;
    }

    try {
      setSaving(true);
      
      // Get existing SSID list
      const existingListJSON = await AsyncStorage.getItem('ssidList');
      const existingList = existingListJSON ? JSON.parse(existingListJSON) : [];
      
      // Check if SSID already exists
      const ssidExists = existingList.some(network => network.ssid === ssid);
      if (ssidExists) {
        Alert.alert('Network Exists', 'This network name already exists in your list.');
        setSaving(false);
        return;
      }
      
      // Add new SSID to list
      const updatedList = [...existingList, { ssid, password, id: Date.now().toString() }];
      
      // Save updated list
      await AsyncStorage.setItem('ssidList', JSON.stringify(updatedList));
      
      Alert.alert('Success', 'WiFi network saved successfully!', [
        { 
          text: 'OK', 
          onPress: () => {
            setSaving(false);
            navigation.goBack();
          } 
        }
      ]);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save network information.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingBottom: insets.bottom }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add New WiFi Network</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Network Name (SSID)</Text>
          <TextInput
            style={styles.input}
            value={ssid}
            onChangeText={setSSID}
            placeholder="Enter WiFi network name"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter WiFi password"
            // secureTextEntry
            autoCapitalize="none"
          />
        </View>
        
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Network'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
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
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddSSIDScreen;