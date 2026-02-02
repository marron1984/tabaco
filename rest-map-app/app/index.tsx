import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../src/contexts/AuthContext';
import { getAllSpots } from '../src/services/firestore';
import MapViewComponent from '../src/components/MapViewComponent';
import FilterButtons from '../src/components/FilterButtons';
import { Spot, SpotFilter, MapRegion } from '../src/types';

// Default region (Tokyo)
const DEFAULT_REGION: MapRegion = {
  latitude: 35.6762,
  longitude: 139.6503,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Demo spots for testing when Firestore is not configured
const DEMO_SPOTS: Spot[] = [
  {
    id: 'demo-1',
    name: 'Shibuya Station Smoking Area',
    type: 'smoking',
    latitude: 35.6580,
    longitude: 139.7016,
    address: 'Shibuya Station, Tokyo',
    description: 'Official smoking area near Hachiko exit',
    isOfficial: true,
    source: 'Tokyo Metro',
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  },
  {
    id: 'demo-2',
    name: 'Shinjuku Public Toilet',
    type: 'toilet',
    latitude: 35.6896,
    longitude: 139.6917,
    address: 'Shinjuku Station South Exit',
    description: 'Clean public restroom with wheelchair access',
    isOfficial: true,
    facilities: ['wheelchair accessible', 'baby changing'],
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  },
  {
    id: 'demo-3',
    name: 'Hidden Gem Cafe',
    type: 'cafe',
    latitude: 35.6620,
    longitude: 139.7050,
    address: 'Shibuya Backstreet',
    description: 'Quiet cafe with great wifi',
    isOfficial: false,
    submittedBy: 'user123',
    isVerified: true,
    upvotes: 15,
    downvotes: 2,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  },
  {
    id: 'demo-4',
    name: 'Rooftop Smoking Spot',
    type: 'smoking',
    latitude: 35.6700,
    longitude: 139.7030,
    address: 'Near Harajuku Station',
    description: 'Nice view, usually empty',
    isOfficial: false,
    submittedBy: 'user456',
    isVerified: false,
    upvotes: 8,
    downvotes: 1,
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
  },
];

export default function MapScreen() {
  const router = useRouter();
  const { user, authState, isAuthenticated, signOut } = useAuth();

  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [filter, setFilter] = useState<SpotFilter>({
    showSmoking: true,
    showToilet: true,
    showCafe: true,
  });

  // Get user location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      } catch (error) {
        console.log('Location permission denied or error:', error);
      }
    })();
  }, []);

  // Fetch spots
  const fetchSpots = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSpots = await getAllSpots(isAuthenticated, filter);

      // If no spots from Firestore, use demo data
      if (fetchedSpots.length === 0) {
        // Filter demo spots based on authentication
        const demoData = isAuthenticated
          ? DEMO_SPOTS
          : DEMO_SPOTS.filter((s) => s.isOfficial);

        // Apply type filter
        const filteredDemo = demoData.filter((spot) => {
          if (spot.type === 'smoking' && !filter.showSmoking) return false;
          if (spot.type === 'toilet' && !filter.showToilet) return false;
          if (spot.type === 'cafe' && !filter.showCafe) return false;
          return true;
        });

        setSpots(filteredDemo);
      } else {
        setSpots(fetchedSpots);
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
      // Fallback to demo data
      setSpots(DEMO_SPOTS.filter((s) => isAuthenticated || s.isOfficial));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filter]);

  useEffect(() => {
    if (authState !== 'loading') {
      fetchSpots();
    }
  }, [authState, fetchSpots]);

  const handleSpotPress = (spot: Spot) => {
    const spotType = spot.isOfficial ? 'public' : 'user';
    router.push(`/spot/${spot.id}?type=${spotType}`);
  };

  const handleRegionChange = (newRegion: MapRegion) => {
    setRegion(newRegion);
  };

  const handleAuthAction = () => {
    if (isAuthenticated) {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut, style: 'destructive' },
      ]);
    } else {
      router.push('/login');
    }
  };

  const handleAddSpot = () => {
    if (!isAuthenticated) {
      Alert.alert('Login Required', 'Please sign in to add a new spot.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/login') },
      ]);
      return;
    }
    router.push('/add-spot');
  };

  if (authState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with auth status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.statusText}>
            {isAuthenticated
              ? `Welcome, ${user?.displayName || user?.email || 'User'}`
              : 'Browsing as Guest'}
          </Text>
          {!isAuthenticated && (
            <Text style={styles.guestNote}>Sign in to see user spots</Text>
          )}
        </View>
        <TouchableOpacity style={styles.authButton} onPress={handleAuthAction}>
          <Text style={styles.authButtonText}>
            {isAuthenticated ? 'Sign Out' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <FilterButtons filter={filter} onFilterChange={setFilter} />
      </View>

      {/* Map view */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A90D9" />
          </View>
        ) : (
          <MapViewComponent
            spots={spots}
            region={region}
            onRegionChange={handleRegionChange}
            onSpotPress={handleSpotPress}
          />
        )}
      </View>

      {/* Add spot button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddSpot}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Spot count indicator */}
      <View style={styles.spotCount}>
        <Text style={styles.spotCountText}>
          {spots.length} spots {!isAuthenticated && '(public only)'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  guestNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  authButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  filterContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 80 : 100,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  mapContainer: {
    flex: 1,
    marginTop: 50,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  spotCount: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  spotCountText: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    overflow: 'hidden',
  },
});
