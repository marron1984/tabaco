'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import type { Spot } from '@/types/database';
import SpotCard from '@/components/SpotCard';
import FilterBar, { type FilterState } from '@/components/FilterBar';

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">地図を読み込み中...</div>
    </div>
  ),
});

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  toiletFreeOnly: false,
  toilet24h: false,
  toiletBarrierFree: false,
  smokingTypes: [],
};

export default function HomePage() {
  const router = useRouter();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [filteredSpots, setFilteredSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showList, setShowList] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        () => {
          // Default to Osaka if location not available
          setUserLocation([135.5023, 34.6937]);
        }
      );
    }
  }, []);

  // Fetch spots
  useEffect(() => {
    const fetchSpots = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('spots')
          .select('*')
          .in('status', ['active', 'needs_verify'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSpots(data || []);
      } catch (error) {
        console.error('Error fetching spots:', error);
        setSpots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = spots;

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter((spot) => spot.type === filters.type);
    }

    // Toilet filters
    if (filters.type === 'toilet' || filters.type === 'all') {
      if (filters.toiletFreeOnly) {
        result = result.filter((spot) => spot.type !== 'toilet' || spot.toilet_is_free);
      }
      if (filters.toilet24h) {
        result = result.filter((spot) => spot.type !== 'toilet' || spot.toilet_open_24h);
      }
      if (filters.toiletBarrierFree) {
        result = result.filter((spot) => spot.type !== 'toilet' || spot.toilet_barrier_free);
      }
    }

    // Smoking filters
    if (
      (filters.type === 'smoking' || filters.type === 'all') &&
      filters.smokingTypes.length > 0
    ) {
      result = result.filter(
        (spot) =>
          spot.type !== 'smoking' ||
          (spot.smoking_type && filters.smokingTypes.includes(spot.smoking_type))
      );
    }

    setFilteredSpots(result);
  }, [spots, filters]);

  const handleSpotClick = useCallback(
    (spot: Spot) => {
      router.push(`/spot/${spot.id}`);
    },
    [router]
  );

  return (
    <div className="h-screen w-screen flex flex-col relative">
      {/* Map */}
      <div className="flex-1 relative">
        <Map
          spots={filteredSpots}
          center={userLocation || undefined}
          onSpotClick={handleSpotClick}
        />

        {/* Filter Bar (Floating) */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <FilterBar filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Add Button (FAB) */}
        <button
          onClick={() => router.push('/add')}
          className="absolute bottom-24 right-4 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center text-2xl z-10"
        >
          +
        </button>

        {/* Toggle List Button */}
        <button
          onClick={() => setShowList(!showList)}
          className="absolute bottom-24 left-4 px-4 py-2 bg-white rounded-full shadow-lg text-sm font-medium text-gray-700 z-10"
        >
          {showList ? '地図を表示' : `リスト (${filteredSpots.length})`}
        </button>
      </div>

      {/* Bottom Sheet / List */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform z-20 ${
          showList ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'
        }`}
        style={{ height: '70vh' }}
      >
        {/* Handle */}
        <div
          className="flex justify-center py-3 cursor-pointer"
          onClick={() => setShowList(!showList)}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-2 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {filteredSpots.length} スポット
          </h2>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 60px)' }}>
          {loading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : filteredSpots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">🔍</p>
              <p>スポットが見つかりません</p>
            </div>
          ) : (
            filteredSpots.map((spot) => <SpotCard key={spot.id} spot={spot} />)
          )}
        </div>
      </div>

      {/* Rules Link */}
      <a
        href="/rules"
        className="absolute top-4 right-4 z-30 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg text-xs text-gray-600 hover:bg-white"
      >
        利用規約
      </a>
    </div>
  );
}
