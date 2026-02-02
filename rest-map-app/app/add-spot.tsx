import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../src/contexts/AuthContext';
import { createUserSpot } from '../src/services/firestore';
import { SpotType } from '../src/types';

const SPOT_TYPES: { type: SpotType; emoji: string; label: string }[] = [
  { type: 'smoking', emoji: '🚬', label: 'Smoking Area' },
  { type: 'toilet', emoji: '🚻', label: 'Toilet' },
  { type: 'cafe', emoji: '☕', label: 'Cafe' },
];

export default function AddSpotScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [type, setType] = useState<SpotType>('smoking');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please sign in to add a new spot.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [isAuthenticated]);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());

      // Try to get address from coordinates (reverse geocoding)
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addresses.length > 0) {
          const addr = addresses[0];
          const parts = [addr.street, addr.city, addr.region, addr.country].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch {
        // Reverse geocoding may not be available, that's OK
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location.');
    } finally {
      setGettingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a spot name.');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address.');
      return false;
    }
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Please enter coordinates or use your current location.');
      return false;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Error', 'Please enter a valid latitude (-90 to 90).');
      return false;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Error', 'Please enter a valid longitude (-180 to 180).');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const spotId = await createUserSpot({
        name: name.trim(),
        type,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address.trim(),
        description: description.trim() || undefined,
        isOfficial: false,
        submittedBy: user.uid,
      });

      if (spotId) {
        Alert.alert('Success', 'Your spot has been submitted!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        // For demo purposes, still show success (Firestore not configured)
        Alert.alert('Success', 'Your spot has been submitted! (Demo mode)', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit spot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        {/* Spot type selector */}
        <Text style={styles.label}>Spot Type</Text>
        <View style={styles.typeSelector}>
          {SPOT_TYPES.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeButton,
                type === item.type && styles.typeButtonActive,
              ]}
              onPress={() => setType(item.type)}
              disabled={loading}
            >
              <Text style={styles.typeEmoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  type === item.type && styles.typeLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Name */}
        <Text style={styles.label}>Spot Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Station Smoking Area"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        {/* Address */}
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Near Shibuya Station Exit B8"
          value={address}
          onChangeText={setAddress}
          editable={!loading}
        />

        {/* Location */}
        <Text style={styles.label}>Coordinates *</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={loading || gettingLocation}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color="#4A90D9" />
          ) : (
            <Text style={styles.locationButtonText}>📍 Use Current Location</Text>
          )}
        </TouchableOpacity>

        <View style={styles.coordsContainer}>
          <View style={styles.coordInput}>
            <Text style={styles.coordLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              placeholder="35.6762"
              value={latitude}
              onChangeText={setLatitude}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
          <View style={styles.coordInput}>
            <Text style={styles.coordLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              placeholder="139.6503"
              value={longitude}
              onChangeText={setLongitude}
              keyboardType="numeric"
              editable={!loading}
            />
          </View>
        </View>

        {/* Description */}
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add any helpful details..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!loading}
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Spot</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          * Your submission will be reviewed by the community. Please ensure the information is accurate.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90D9',
  },
  typeEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  typeLabelActive: {
    color: '#4A90D9',
  },
  locationButton: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#4A90D9',
    fontWeight: '500',
  },
  coordsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  coordLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: '#4A90D9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
