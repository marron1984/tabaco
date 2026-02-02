'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS, SHADOWS, SPACING, RADIUS, SPOT_COLORS } from '../constants/theme';

// Force client-side rendering
export const unstable_settings = {
  render: 'client',
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const BOTTOM_SHEET_MIN = 180;
const BOTTOM_SHEET_MAX = SCREEN_HEIGHT * 0.65;

// Demo data for testing without Firebase (Osaka area)
const DEMO_PUBLIC_SPOTS = [
  { id: '1', name: 'ヨドバシカメラ梅田 喫煙所', type: 'smoking', lat: 34.704067, lng: 135.496244, address: '大阪市北区大深町1-1', isPublic: true },
  { id: '2', name: '大阪駅前第3ビル トイレ', type: 'toilet', lat: 34.700909, lng: 135.498291, address: '大阪市北区梅田1-1-3', isPublic: true },
];

const DEMO_MEMBER_SPOTS = [
  { id: '3', name: '難波 秘密の喫煙所', type: 'smoking', lat: 34.665487, lng: 135.501038, address: '難波駅周辺', isPublic: false },
  { id: '4', name: 'アメ村カフェ＆スモーク', type: 'cafe', lat: 34.672314, lng: 135.498556, address: '中央区西心斎橋', isPublic: false },
];

// Glassmorphism Map component
function MapComponent({ spots = [], onSpotPress, region }) {
  // Safe spots array
  const safeSpots = Array.isArray(spots) ? spots : [];

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.webMapText}>Map View</Text>
        <Text style={styles.webMapSubtext}>大阪エリア</Text>
      </View>
    );
  }

  // Dynamic import for native maps
  let MapView, Marker;
  try {
    MapView = require('react-native-maps').default;
    Marker = require('react-native-maps').Marker;
  } catch (e) {
    // Fallback if maps not available
    return (
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.webMapText}>Map</Text>
        <Text style={styles.webMapSubtext}>{safeSpots.length} spots</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={false}
      customMapStyle={mapStyle}
    >
      {safeSpots.map(spot => {
        if (!spot?.id || !spot?.lat || !spot?.lng) return null;
        const spotType = spot?.type || 'unknown';
        return (
          <Marker
            key={spot.id}
            coordinate={{ latitude: spot.lat, longitude: spot.lng }}
            title={spot?.name || 'Unknown'}
            description={spot?.address || ''}
            onPress={() => onSpotPress && onSpotPress(spot)}
          >
            <View style={[styles.marker, { backgroundColor: SPOT_COLORS?.[spotType]?.bg || COLORS?.glass || '#F3F4F6' }]}>
              <Text style={styles.markerEmoji}>{SPOT_COLORS?.[spotType]?.emoji || '📍'}</Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

// Spot Card Component
function SpotCard({ spot, onPress }) {
  if (!spot) return null;

  const spotType = spot?.type || 'unknown';
  const spotName = spot?.name || 'Unknown';
  const spotAddress = spot?.address || '';
  const spotIsPublic = spot?.isPublic ?? true;

  const typeColor = SPOT_COLORS?.[spotType] || { bg: '#F3F4F6', text: '#374151', emoji: '📍' };

  return (
    <TouchableOpacity
      style={styles.spotCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.spotCardIcon, { backgroundColor: typeColor?.bg || '#F3F4F6' }]}>
        <Text style={styles.spotCardEmoji}>{typeColor?.emoji || '📍'}</Text>
      </View>
      <View style={styles.spotCardContent}>
        <Text style={styles.spotCardName} numberOfLines={1}>{spotName}</Text>
        <Text style={styles.spotCardAddress} numberOfLines={1}>{spotAddress}</Text>
        <View style={styles.spotCardTags}>
          <View style={[styles.tag, { backgroundColor: typeColor?.bg || '#F3F4F6' }]}>
            <Text style={[styles.tagText, { color: typeColor?.text || '#374151' }]}>
              {spotType === 'smoking' ? '喫煙所' : spotType === 'toilet' ? 'トイレ' : 'カフェ'}
            </Text>
          </View>
          {!spotIsPublic && (
            <View style={[styles.tag, styles.tagUser]}>
              <Text style={styles.tagTextUser}>ユーザー投稿</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.spotCardArrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MapScreen() {
  const router = useRouter();
  const { user, isGuest, isMember, signOut, loading: authLoading } = useAuth();
  const bottomSheetAnim = useRef(new Animated.Value(BOTTOM_SHEET_MIN)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 34.702485,
    longitude: 135.495951,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [filter, setFilter] = useState({ smoking: true, toilet: true, cafe: true });

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

  const fetchSpots = useCallback(async () => {
    setLoading(true);
    try {
      let publicSpots = [];
      let memberSpots = [];

      try {
        const publicQuery = query(collection(db, 'publicSpots'));
        const publicSnapshot = await getDocs(publicQuery);
        publicSpots = publicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
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

      if (publicSpots.length === 0) {
        publicSpots = DEMO_PUBLIC_SPOTS;
        memberSpots = isMember ? DEMO_MEMBER_SPOTS : [];
      }

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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSpots(spots);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = spots.filter(spot =>
        spot.name.toLowerCase().includes(q) ||
        (spot.address && spot.address.toLowerCase().includes(q))
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

  const toggleBottomSheet = () => {
    const toValue = isExpanded ? BOTTOM_SHEET_MIN : BOTTOM_SHEET_MAX;
    Animated.spring(bottomSheetAnim, {
      toValue,
      useNativeDriver: false,
      friction: 10,
    }).start();
    setIsExpanded(!isExpanded);
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Fullscreen Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <MapComponent
            spots={filteredSpots}
            region={region}
            onSpotPress={handleSpotPress}
          />
        )}
      </View>

      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="スポットを検索..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { key: 'smoking', label: '喫煙所', emoji: '🚬' },
            { key: 'toilet', label: 'トイレ', emoji: '🚻' },
            { key: 'cafe', label: 'カフェ', emoji: '☕' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterPill,
                filter[item.key] && styles.filterPillActive,
              ]}
              onPress={() => toggleFilter(item.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterEmoji}>{item.emoji}</Text>
              <Text style={[
                styles.filterLabel,
                filter[item.key] && styles.filterLabelActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Top Right Actions */}
      <View style={styles.topRightActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>👤</Text>
        </TouchableOpacity>
        {isMember && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSmall]}
            onPress={signOut}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIconSmall}>🚪</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { height: bottomSheetAnim }]}>
        {/* Handle */}
        <TouchableOpacity style={styles.bottomSheetHandle} onPress={toggleBottomSheet}>
          <View style={styles.handle} />
          <Text style={styles.bottomSheetTitle}>
            {filteredSpots.length} スポット {isGuest && '(公開のみ)'}
          </Text>
        </TouchableOpacity>

        {/* Spot List */}
        <ScrollView
          style={styles.spotList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.spotListContent}
        >
          {filteredSpots.map(spot => (
            <SpotCard
              key={spot.id}
              spot={spot}
              onPress={() => handleSpotPress(spot)}
            />
          ))}
          {filteredSpots.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>スポットが見つかりません</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* FAB - Add Spot */}
      {isMember && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/add-spot')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Guest Login Prompt */}
      {isGuest && (
        <TouchableOpacity
          style={styles.loginPrompt}
          onPress={() => router.push('/login')}
          activeOpacity={0.9}
        >
          <Text style={styles.loginPromptText}>
            ログインして隠れスポットを発見 →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Minimal map style for cleaner look
const mapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  // Map
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  webMapPlaceholder: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  webMapSubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Markers
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  markerEmoji: {
    fontSize: 20,
  },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm + 4 : SPACING.sm,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Filter Pills
  filterScroll: {
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterEmoji: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterLabelActive: {
    color: COLORS.textLight,
  },

  // Top Right Actions
  topRightActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: SPACING.md,
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  actionButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionIconSmall: {
    fontSize: 16,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.large,
  },
  bottomSheetHandle: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: SPACING.sm,
  },
  bottomSheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Spot List
  spotList: {
    flex: 1,
  },
  spotListContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // Spot Card
  spotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  spotCardIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  spotCardEmoji: {
    fontSize: 24,
  },
  spotCardContent: {
    flex: 1,
  },
  spotCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  spotCardAddress: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  spotCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.xs,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tagUser: {
    backgroundColor: '#F3E8FF',
  },
  tagTextUser: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7C3AED',
  },
  spotCardArrow: {
    paddingLeft: SPACING.sm,
  },
  arrowText: {
    fontSize: 24,
    color: COLORS.textMuted,
    fontWeight: '300',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: BOTTOM_SHEET_MIN + SPACING.md,
    right: SPACING.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  fabIcon: {
    fontSize: 32,
    color: COLORS.textLight,
    fontWeight: '300',
    marginTop: -2,
  },

  // Guest Login Prompt
  loginPrompt: {
    position: 'absolute',
    bottom: BOTTOM_SHEET_MIN + SPACING.md,
    left: SPACING.md,
    right: 80,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    ...SHADOWS.medium,
  },
  loginPromptText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
