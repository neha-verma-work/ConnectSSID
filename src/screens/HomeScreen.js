import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WifiManager from 'react-native-wifi-reborn';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const WifiConnector = NativeModules.WifiConnector;

const HomeScreen = ({ navigation }) => {
  const [connecting, setConnecting] = useState(false);
  const insets = useSafeAreaInsets();

  // Request location permissions (required for WiFi operations on Android)
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const result = await request(
        Platform.Version >= 29
          ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
          : PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION
      );
      return result === RESULTS.GRANTED;
    }
    return true; // iOS doesn't need this permission for our use case
  };

  const handleConnect = async () => {
    try {
      // Check permissions first
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required', 
          'Location permission is required to access WiFi information on Android.',
          [{ text: 'OK' }]
        );
        return;
      }

      setConnecting(true);
      const isEnabled = await WifiManager.isEnabled();
      if (!isEnabled) {
        WifiManager.setEnabled(true);
      }
      const ssidListJSON = await AsyncStorage.getItem('ssidList');
      const ssidList = ssidListJSON ? JSON.parse(ssidListJSON) : [];
      
      if (ssidList.length === 0) {
        Alert.alert('No Networks', 'No saved WiFi networks found.');
        setConnecting(false);
        return;
      }

      if (Platform.OS === 'ios') {
        // iOS doesn't allow direct WiFi connection from apps
        // Guide the user to Settings app instead
        Alert.alert(
          'iOS Limitation',
          'Due to iOS restrictions, we cannot connect to Wi-Fi networks directly. Would you like to open Wi-Fi settings?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openURL('App-Prefs:WIFI') }
          ]
        );
        setConnecting(false);
      } else {
        // Android connection flow
        let connectionSuccess = false;
        
        for (const network of ssidList) {
          try {
            {/* Mathod from react-native-wifi-reborn library*/}
            // Try to connect to this network
            // const result = await WifiManager.connectToProtectedSSID(
            //   network.ssid,
            //   network.password,
            //   false,// isWEP - set to false for WPA/WPA2
            //   false,
            // );
            // console.log("network ssid and password", network.ssid, network.password, WifiConnector.connectToWifi)
            {/*Android Native Module*/}
            const result = await WifiConnector.connectToWifi(network.ssid, network.password);
            console.log("----result----", result);
            // Wait to see if connection is successful
            const connectedSSID = await WifiManager.getCurrentWifiSSID();
            if (connectedSSID === network.ssid) {
              connectionSuccess = true;
              Alert.alert('Connected', `Successfully connected to ${network.ssid}`);
              break; // Exit the loop if successfully connected
            }
          } catch (error) {
            console.log(`Failed to connect to ${network.ssid}: ${error.message}`);
            // Continue to next network
          }
        }
        
        if (!connectionSuccess) {
          Alert.alert('Connection Failed', 'Could not connect to any of the saved networks.');
        }
        
        setConnecting(false);
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect to networks: ' + error.message);
      setConnecting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>WiFi Network Manager</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('AddSSID')}
      >
        <Text style={styles.buttonText}>Add WiFi Network</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('MyWebBrowser')}
      >
        <Text style={styles.buttonText}>Open WEb view</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('SSIDList')}
      >
        <Text style={styles.buttonText}>Show Saved Networks</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, connecting && styles.buttonDisabled]}
        onPress={handleConnect}
        disabled={connecting}
      >
        <Text style={styles.buttonText}>
          {connecting ? 'Connecting...' : 'Connect to Network'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
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

export default HomeScreen;