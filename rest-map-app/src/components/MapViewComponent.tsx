import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Spot, MapRegion } from '../types';

interface MapViewComponentProps {
  spots: Spot[];
  region: MapRegion;
  onRegionChange: (region: MapRegion) => void;
  onSpotPress: (spot: Spot) => void;
}

// Native MapView component using react-native-maps
const NativeMapView: React.FC<MapViewComponentProps> = ({
  spots,
  region,
  onRegionChange,
  onSpotPress,
}) => {
  // Dynamic import for react-native-maps (only available on native)
  const MapView = require('react-native-maps').default;
  const { Marker } = require('react-native-maps');

  const getMarkerColor = (type: string): string => {
    switch (type) {
      case 'smoking':
        return '#FF6B6B';
      case 'toilet':
        return '#4ECDC4';
      case 'cafe':
        return '#A67C52';
      default:
        return '#888888';
    }
  };

  const getMarkerEmoji = (type: string): string => {
    switch (type) {
      case 'smoking':
        return '🚬';
      case 'toilet':
        return '🚻';
      case 'cafe':
        return '☕';
      default:
        return '📍';
    }
  };

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      onRegionChangeComplete={onRegionChange}
      showsUserLocation
      showsMyLocationButton
    >
      {spots.map((spot) => (
        <Marker
          key={`${spot.isOfficial ? 'public' : 'user'}-${spot.id}`}
          coordinate={{
            latitude: spot.latitude,
            longitude: spot.longitude,
          }}
          title={spot.name}
          description={spot.address}
          pinColor={getMarkerColor(spot.type)}
          onPress={() => onSpotPress(spot)}
        >
          <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(spot.type) }]}>
            <Text style={styles.markerEmoji}>{getMarkerEmoji(spot.type)}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
};

// Web fallback component (simple list view since react-native-maps doesn't support web)
const WebMapView: React.FC<MapViewComponentProps> = ({
  spots,
  region,
  onSpotPress,
}) => {
  const getMarkerEmoji = (type: string): string => {
    switch (type) {
      case 'smoking':
        return '🚬';
      case 'toilet':
        return '🚻';
      case 'cafe':
        return '☕';
      default:
        return '📍';
    }
  };

  return (
    <View style={styles.webContainer}>
      <View style={styles.webHeader}>
        <Text style={styles.webHeaderText}>
          Map View (Web) - Region: {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
        </Text>
        <Text style={styles.webSubtext}>
          {spots.length} spots found. Tap a spot to view details.
        </Text>
      </View>
      <View style={styles.spotList}>
        {spots.length === 0 ? (
          <Text style={styles.emptyText}>No spots to display. Try adjusting filters.</Text>
        ) : (
          spots.map((spot) => (
            <View
              key={`${spot.isOfficial ? 'public' : 'user'}-${spot.id}`}
              style={styles.spotCard}
              // @ts-ignore - Web-specific prop
              onClick={() => onSpotPress(spot)}
            >
              <Text style={styles.spotEmoji}>{getMarkerEmoji(spot.type)}</Text>
              <View style={styles.spotInfo}>
                <Text style={styles.spotName}>{spot.name}</Text>
                <Text style={styles.spotAddress}>{spot.address}</Text>
                <Text style={styles.spotType}>
                  {spot.type} {spot.isOfficial ? '(Official)' : '(User submitted)'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

// Main component that switches based on platform
const MapViewComponent: React.FC<MapViewComponentProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebMapView {...props} />;
  }
  return <NativeMapView {...props} />;
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
  },
  markerContainer: {
    padding: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerEmoji: {
    fontSize: 16,
  },
  // Web styles
  webContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webHeader: {
    padding: 16,
    backgroundColor: '#4A90D9',
  },
  webHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  spotList: {
    flex: 1,
    padding: 10,
  },
  spotCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  spotEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  spotInfo: {
    flex: 1,
  },
  spotName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  spotAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  spotType: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 16,
  },
});

export default MapViewComponent;
