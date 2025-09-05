import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Geolocation from '@react-native-community/geolocation';
import ApiService from '../services/ApiService';

const ReportHazardScreen = ({ navigation }) => {
  const [hazardType, setHazardType] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get the current user from storage
    const loadUser = async () => {
      const user = await ApiService.getStoredUser();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const getCurrentLocation = () => {
    setIsLoading(true);
    Geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLoading(false);
        Alert.alert('Success', 'Location captured successfully!');
      },
      (error) => {
        setIsLoading(false);
        Alert.alert('Error', 'Could not get your location. Please enter manually.');
        console.log(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!hazardType) {
      Alert.alert('Error', 'Please select a hazard type.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description.');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Please capture your location first.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to report a hazard.');
      return;
    }

    setIsLoading(true);

    try {
      const hazardData = {
        user_id: currentUser.id,
        hazard_type: hazardType,
        description: description.trim(),
        location_name: locationName.trim() || 'Unknown Location',
        latitude: latitude,
        longitude: longitude
      };

      const response = await ApiService.reportHazard(hazardData);
      
      Alert.alert('Success', 'Hazard reported successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
      // Clear the form
      setHazardType('');
      setDescription('');
      setLocationName('');
      setLatitude(null);
      setLongitude(null);
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to report hazard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Report a Marine Hazard</Text>
        <Text style={styles.subtitle}>Help keep our waters safe</Text>
      </View>

      <View style={styles.form}>
        {/* Hazard Type Picker */}
        <Text style={styles.label}>Hazard Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={hazardType}
            onValueChange={(itemValue) => setHazardType(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select hazard type..." value="" />
            <Picker.Item label="Pollution" value="Pollution" />
            <Picker.Item label="Marine Debris" value="Marine Debris" />
            <Picker.Item label="Entangled Animal" value="Entangled Animal" />
            <Picker.Item label="Vessel Issue" value="Vessel Issue" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the hazard in detail..."
          value={description}
          onChangeText={setDescription}
          multiline={true}
          numberOfLines={4}
        />

        {/* Location Name */}
        <Text style={styles.label}>Location Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 'Near the pier', 'Main beach'"
          value={locationName}
          onChangeText={setLocationName}
        />

        {/* Location Coordinates */}
        <Text style={styles.label}>Location Coordinates *</Text>
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          <Text style={styles.locationButtonText}>
            {latitude && longitude 
              ? `✓ Location Captured (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` 
              : 'Get Current Location'
            }
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Report Hazard</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#FF5722',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ReportHazardScreen;