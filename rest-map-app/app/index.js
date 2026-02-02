import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Demo data for testing without Firebase (Osaka area)
const DEMO_PUBLIC_SPOTS = [
  { id: '1', name: 'ヨドバシカメラ梅田 喫煙所', type: 'smoking', lat: 34.704067, lng: 135.496244, address: '大阪市北区大深町1-1', isPublic: true },
  { id: '2', name: '大阪駅前第3ビル トイレ', type: 'toilet', lat: 34.700909, lng: 135.498291, address: '大阪市北区梅田1-1-3', isPublic: true },
];

const DEMO_MEMBER_SPOTS = [
  { id: '3', name: '難波 秘密の喫煙所', type: 'smoking', lat: 34.665487, lng: 135.501038, address: '難波駅周辺', isPublic: false },
  { id: '4', name: 'アメ村カフェ＆スモーク', type: 'cafe', lat: 34.672314, lng: 135.498556, address: '中央区西心斎橋', isPublic: false },
];

// Web-compatible Map component
function MapComponent({ spots, onSpotPress, region }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webMapContainer}>
        <Text style={styles.webMapTitle}>Map View (Web)</Text>
        <Text style={styles.webMapSubtitle}>{spots.length} spots found</Text>
        <View style={styles.spotList}>
          {spots.map(spot => (
            <TouchableOpacity
              key={spot.id}
              style={styles.spotCard}
              onPress={() => onSpotPress(spot)}
            >
              <Text style={styles.spotEmoji}>
                {spot.type === 'smoking' ? '🚬' : spot.type === 'toilet' ? '🚻' : '☕'}
              </Text>
              <View style={styles.spotInfo}>
                <Text style={styles.spotName}>{spot.name}</Text>
                <Text style={styles.spotAddress}>{spot.address}</Text>
                <Text style={styles.spotBadge}>
                  {spot.isPublic ? 'Official' : 'User Submitted'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // Native MapView
  const MapView = require('react-native-maps').default;
  const { Marker } = require('react-native-maps');

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsUserLocation
    >
      {spots.map(spot => (
        <Marker
          key={spot.id}
          coordinate={{ latitude: spot.lat, longitude: spot.lng }}
          title={spot.name}
          description={spot.address}
          pinColor={spot.type === 'smoking' ? '#FF6B6B' : spot.type === 'toilet' ? '#4ECDC4' : '#A67C52'}
          onPress={() => onSpotPress(spot)}
        />
      ))}
    </MapView>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const { user, isGuest, isMember, signOut, loading: authLoading } = useAuth();

  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  // Default region: Osaka Station area
  const [region, setRegion] = useState({
    latitude: 34.702485,
    longitude: 135.495951,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [filter, setFilter] = useState({ smoking: true, toilet: true, cafe: true });

  // Get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setRegion(prev => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
      }
    })();
  }, []);

  // Fetch spots based on auth state
  const fetchSpots = useCallback(async () => {
    setLoading(true);
    try {
      // Try Firestore first
      let publicSpots = [];
      let memberSpots = [];

      try {
        const publicQuery = query(collection(db, 'publicSpots'));
        const publicSnapshot = await getDocs(publicQuery);
        publicSpots = publicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        // Firestore not configured, use demo data
        publicSpots = DEMO_PUBLIC_SPOTS;
      }

      if (isMember) {
        try {
          const memberQuery = query(collection(db, 'userSpots'));
          const memberSnapshot = await getDocs(memberQuery);
          memberSpots = memberSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          memberSpots = DEMO_MEMBER_SPOTS;
        }
      }

      // If no Firestore data, use demo
      if (publicSpots.length === 0) {
        publicSpots = DEMO_PUBLIC_SPOTS;
        memberSpots = isMember ? DEMO_MEMBER_SPOTS : [];
      }

      // Apply filters
      const allSpots = [...publicSpots, ...memberSpots].filter(spot => {
        if (spot.type === 'smoking' && !filter.smoking) return false;
        if (spot.type === 'toilet' && !filter.toilet) return false;
        if (spot.type === 'cafe' && !filter.cafe) return false;
        return true;
      });

      setSpots(allSpots);
    } catch (error) {
      console.error('Error fetching spots:', error);
      setSpots(DEMO_PUBLIC_SPOTS);
    } finally {
      setLoading(false);
    }
  }, [isMember, filter]);

  useEffect(() => {
    if (!authLoading) {
      fetchSpots();
    }
  }, [authLoading, fetchSpots]);

  // Apply search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSpots(spots);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = spots.filter(spot =>
        spot.name.toLowerCase().includes(query) ||
        (spot.address && spot.address.toLowerCase().includes(query))
      );
      setFilteredSpots(filtered);
    }
  }, [spots, searchQuery]);

  const handleSpotPress = (spot) => {
    router.push(`/spot/${spot.id}?isPublic=${spot.isPublic}`);
  };

  const toggleFilter = (type) => {
    setFilter(prev => ({ ...prev, [type]: !prev[type] }));
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.statusText}>
            {isMember ? `Welcome, ${user?.email || 'Member'}` : 'Browsing as Guest'}
          </Text>
          {isGuest && (
            <Text style={styles.guestHint}>Sign in to see hidden spots</Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => router.push('/debug')}
          >
            <Text style={styles.debugButtonText}>Debug</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => isMember ? signOut() : router.push('/login')}
          >
            <Text style={styles.authButtonText}>
              {isMember ? 'Sign Out' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="スポットを検索..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter.smoking && styles.filterActive]}
          onPress={() => toggleFilter('smoking')}
        >
          <Text style={styles.filterEmoji}>🚬</Text>
          <Text style={[styles.filterText, filter.smoking && styles.filterTextActive]}>
            Smoking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter.toilet && styles.filterActive]}
          onPress={() => toggleFilter('toilet')}
        >
          <Text style={styles.filterEmoji}>🚻</Text>
          <Text style={[styles.filterText, filter.toilet && styles.filterTextActive]}>
            Toilet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter.cafe && styles.filterActive]}
          onPress={() => toggleFilter('cafe')}
        >
          <Text style={styles.filterEmoji}>☕</Text>
          <Text style={[styles.filterText, filter.cafe && styles.filterTextActive]}>
            Cafe
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map or List */}
      <View style={styles.mapContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#4A90D9" />
        ) : (
          <MapComponent
            spots={filteredSpots}
            region={region}
            onSpotPress={handleSpotPress}
          />
        )}
      </View>

      {/* Spot count */}
      <View style={styles.footer}>
        <Text style={styles.spotCount}>
          {filteredSpots.length} spots {searchQuery ? '(filtered)' : isGuest ? '(public only)' : ''}
        </Text>
      </View>

      {/* Add Spot FAB - Members only */}
      {isMember && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/add-spot')}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusText: { fontSize: 14, fontWeight: '600', color: '#333' },
  guestHint: { fontSize: 11, color: '#666', marginTop: 2 },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  debugButton: {
    backgroundColor: '#888',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  debugButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  profileButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  profileButtonText: { fontSize: 18 },
  authButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  authButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  searchClear: {
    fontSize: 16,
    color: '#999',
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#fff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterActive: { backgroundColor: '#4A90D9' },
  filterEmoji: { fontSize: 14, marginRight: 4 },
  filterText: { fontSize: 12, color: '#666' },
  filterTextActive: { color: '#fff' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  spotCount: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    overflow: 'hidden',
  },
  // Web styles
  webMapContainer: { flex: 1, backgroundColor: '#f0f0f0' },
  webMapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#4A90D9',
    color: '#fff',
  },
  webMapSubtitle: {
    fontSize: 14,
    padding: 10,
    backgroundColor: '#4A90D9',
    color: 'rgba(255,255,255,0.8)',
  },
  spotList: { padding: 10 },
  spotCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  spotEmoji: { fontSize: 32, marginRight: 12 },
  spotInfo: { flex: 1 },
  spotName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  spotAddress: { fontSize: 14, color: '#666', marginTop: 4 },
  spotBadge: { fontSize: 11, color: '#999', marginTop: 4 },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    marginTop: -2,
  },
});
