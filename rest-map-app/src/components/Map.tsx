'use client';

import { useEffect, useRef, useState } from 'react';
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

const SPOT_COLORS: Record<string, string> = {
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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [maplibregl, setMaplibregl] = useState<typeof import('maplibre-gl') | null>(null);

  // Dynamically import MapLibre on client side only
  useEffect(() => {
    import('maplibre-gl').then((module) => {
      setMaplibregl(module);
    });
    // Import CSS
    import('maplibre-gl/dist/maplibre-gl.css');
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !maplibregl) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
      center,
      zoom,
      attributionControl: true,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    if (interactive) {
      mapRef.current.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right'
      );
    }

    mapRef.current.on('load', () => {
      setMapLoaded(true);
    });

    if (onMapClick) {
      mapRef.current.on('click', (e) => {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      });
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [maplibregl, center, zoom, interactive, onMapClick]);

  // Update markers when spots change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !maplibregl) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    spots.forEach((spot) => {
      const el = document.createElement('div');
      el.className = 'spot-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${SPOT_COLORS[spot.type] || '#6B7280'};
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
        .addTo(mapRef.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSpotClick?.(spot);
      });

      markersRef.current.push(marker);
    });
  }, [spots, mapLoaded, maplibregl, onSpotClick]);

  // Handle selected location marker
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !maplibregl) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
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

      selectedMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(mapRef.current);

      mapRef.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 16,
      });
    }
  }, [selectedLocation, mapLoaded, maplibregl]);

  // Show loading state while MapLibre loads
  if (!maplibregl) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">地図を読み込み中...</div>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
  );
}
