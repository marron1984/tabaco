'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Spot } from '@/types/database';

interface MapProps {
  spots: Spot[];
  center?: [number, number];
  zoom?: number;
  onSpotClick?: (spot: Spot) => void;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  selectedLocation?: { lng: number; lat: number } | null;
  interactive?: boolean;
}

const OSAKA_CENTER: [number, number] = [135.5023, 34.6937];

const SPOT_COLORS = {
  toilet: '#3B82F6',
  smoking: '#F97316',
};

export default function Map({
  spots,
  center = OSAKA_CENTER,
  zoom = 14,
  onSpotClick,
  onMapClick,
  selectedLocation,
  interactive = true,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const selectedMarker = useRef<maplibregl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
      center,
      zoom,
      attributionControl: true,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    if (interactive) {
      map.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right'
      );
    }

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when spots change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach((m) => m.remove());
    markers.current = [];

    // Add new markers
    spots.forEach((spot) => {
      const el = document.createElement('div');
      el.className = 'spot-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${SPOT_COLORS[spot.type]};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      `;
      el.innerHTML = spot.type === 'toilet' ? '🚻' : '🚬';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([spot.lng, spot.lat])
        .addTo(map.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSpotClick?.(spot);
      });

      markers.current.push(marker);
    });
  }, [spots, mapLoaded, onSpotClick]);

  // Handle selected location marker
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (selectedMarker.current) {
      selectedMarker.current.remove();
      selectedMarker.current = null;
    }

    if (selectedLocation) {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #EF4444;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      `;

      selectedMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(map.current);

      map.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 16,
      });
    }
  }, [selectedLocation, mapLoaded]);

  return (
    <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
  );
}
