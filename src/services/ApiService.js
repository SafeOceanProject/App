import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Configuration ---
// IMPORTANT: This IP address must match the local IP of the computer running XAMPP.
// You can find it by typing `ipconfig` in a Windows command prompt.
const API_BASE_URL = 'http://192.168.0.100/php_api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // This part adds the user's token to every request if they are logged in.
    this.api.interceptors.request.use(async (config) => {
      const userString = await AsyncStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
      return config;
    });
  }

  // --- Authentication ---

  /**
   * Logs in a user.
   * @param {object} credentials - { email, password }
   * @returns {Promise<object>} The user data from the API.
   */
  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials);
      if (response.data && response.data.user) {
        // Save the logged-in user to the device's storage
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      // Re-throw the error so the UI can handle it
      throw error.response?.data || { message: 'Login failed' };
    }
  }

  /**
   * Registers a new user.
   * @param {object} userData - { name, email, password }
   * @returns {Promise<object>} The success message from the API.
   */
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  }

  /**
   * Logs the user out by clearing stored data.
   */
  async logout() {
    await AsyncStorage.removeItem('user');
  }

  /**
   * Gets the currently stored user from device storage.
   * @returns {Promise<object|null>} The user object or null if not found.
   */
  async getStoredUser() {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  // --- Weather ---

  /**
   * Fetches weather data for a given location query.
   * @param {string} query - A location string (e.g., "San Diego, CA" or "lat,lon").
   * @returns {Promise<object>} The weather data from the API.
   */
  async getWeather(query) {
    try {
      // Use 'get' method and pass the query as a URL parameter
      const response = await this.api.get(`/weather/get?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch weather' };
    }
  }
}

// Export a single, shared instance of the ApiService
export default new ApiService();