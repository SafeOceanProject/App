import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert, // Import Alert for better error messages
} from 'react-native';
import ApiService from './src/services/ApiService'; // Correct import path from root

// A simple reusable component for displaying a piece of weather data
const WeatherDetail = ({ label, value, unit }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}{unit}</Text>
  </View>
);

const WeatherScreen = ({ user, onLogout }) => { // Accept user and onLogout props
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Function to fetch weather data from the API
  const fetchWeather = async (query) => {
    setLoading(true);
    setWeatherData(null);
    setError(null);
    try {
      console.log(`Fetching weather for: ${query}`);
      // This now calls the function we added to ApiService.js
      const data = await ApiService.getWeather(query);
      setWeatherData(data);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch weather data. Is the PHP server running?';
      setError(errorMessage);
      Alert.alert('Error', errorMessage); // Show a user-friendly alert
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchWeather(searchQuery.trim());
    }
  };

  // Handle "Use My Location" button press
  const handleCurrentLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Safe Ocean Project needs access to your location for weather data.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError('Location permission denied.');
          return;
        }
      } catch (err) {
        console.warn(err);
        setError('Error requesting location permission.');
        return;
      }
    }

    setLoading(true);
    // Use the official React Native Community Geolocation library if installed, or the built-in one.
    // For simplicity, we assume the built-in navigator.geolocation for now.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(`${latitude},${longitude}`);
      },
      (geoError) => {
        setError('Failed to get current location. Please enable GPS.');
        setLoading(false);
        console.log(geoError);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
    );
  };
  
  // Fetch default weather on initial load
  useEffect(() => {
    fetchWeather('San Diego, CA'); // Default location
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8f4f8" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.header}>
            <Text style={styles.title}>Safe Ocean Project</Text>
            {user && <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>}
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter city or zip code..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.locationButton} onPress={handleCurrentLocation}>
            <Text style={styles.buttonText}>📍 Use My Location</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Fetching Conditions...</Text>
          </View>
        )}

        {error && !loading && <Text style={styles.errorText}>{error}</Text>}

        {weatherData && !loading && (
          <View style={styles.weatherContainer}>
            <Text style={styles.locationText}>{weatherData.location}</Text>
            <Text style={styles.temperatureText}>{Math.round(weatherData.temperature)}°F</Text>
            <Text style={styles.conditionText}>{weatherData.condition}</Text>
            
            <View style={styles.detailsGrid}>
                <WeatherDetail label="Feels Like" value={Math.round(weatherData.feels_like)} unit="°F" />
                <WeatherDetail label="Humidity" value={weatherData.humidity} unit="%" />
                <WeatherDetail label="Wind" value={weatherData.wind_speed} unit=" mph" />
                <WeatherDetail label="Pressure" value={weatherData.pressure} unit='"Hg' />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// All the styles for the components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4f8',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0d47a1',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  locationButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  weatherContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  locationText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
  },
  temperatureText: {
    fontSize: 72,
    fontWeight: '200',
    color: '#111',
    marginVertical: 10,
  },
  conditionText: {
    fontSize: 20,
    color: '#555',
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  detailItem: {
    alignItems: 'center',
    width: '45%',
    marginVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default WeatherScreen;