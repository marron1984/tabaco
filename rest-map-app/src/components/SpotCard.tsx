'use client';

import Link from 'next/link';
import type { Spot } from '@/types/database';

interface SpotCardProps {
  spot: Spot;
}

const TYPE_LABELS = {
  toilet: 'トイレ',
  smoking: '喫煙',
};

const SMOKING_TYPE_LABELS = {
  designated_area: '喫煙所',
  inside_ok: '店内喫煙可',
  outdoor_ok: '屋外可',
  heated_only: '加熱式のみ',
  unclear: '不明',
};

export default function SpotCard({ spot }: SpotCardProps) {
  const isToilet = spot.type === 'toilet';

  return (
    <Link href={`/spot/${spot.id}`}>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
              isToilet ? 'bg-blue-100' : 'bg-orange-100'
            }`}
          >
            {isToilet ? '🚻' : '🚬'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isToilet
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {TYPE_LABELS[spot.type]}
              </span>
              {spot.status === 'needs_verify' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                  要確認
                </span>
              )}
            </div>

            <h3 className="font-medium text-gray-900 truncate">
              {spot.title || `${TYPE_LABELS[spot.type]}スポット`}
            </h3>

            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {spot.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {isToilet ? (
                <>
                  {spot.toilet_is_free && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600">
                      無料
                    </span>
                  )}
                  {spot.toilet_open_24h && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600">
                      24時間
                    </span>
                  )}
                  {spot.toilet_barrier_free && (
                    <span className="text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-600">
                      バリアフリー
                    </span>
                  )}
                </>
              ) : (
                <>
                  {spot.smoking_type && (
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600">
                      {SMOKING_TYPE_LABELS[spot.smoking_type]}
                    </span>
                  )}
                  {spot.smoking_ashtray && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      灰皿あり
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="text-gray-400 text-xl">›</div>
        </div>
      </div>
    </Link>
  );
}
