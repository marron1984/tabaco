'use client';

import { useState } from 'react';

export interface FilterState {
  type: 'all' | 'toilet' | 'smoking';
  // Toilet filters
  toiletFreeOnly: boolean;
  toilet24h: boolean;
  toiletBarrierFree: boolean;
  // Smoking filters
  smokingTypes: string[];
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const SMOKING_TYPE_OPTIONS = [
  { value: 'designated_area', label: '喫煙所' },
  { value: 'inside_ok', label: '店内喫煙可' },
  { value: 'outdoor_ok', label: '屋外可' },
  { value: 'heated_only', label: '加熱式のみ' },
  { value: 'unclear', label: '不明' },
];

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleSmokingType = (value: string) => {
    const newTypes = filters.smokingTypes.includes(value)
      ? filters.smokingTypes.filter((t) => t !== value)
      : [...filters.smokingTypes, value];
    onFilterChange({ ...filters, smokingTypes: newTypes });
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-3">
      {/* Type Selection */}
      <div className="flex gap-2 mb-2">
        {[
          { value: 'all', label: 'すべて', icon: '📍' },
          { value: 'toilet', label: 'トイレ', icon: '🚻' },
          { value: 'smoking', label: '喫煙', icon: '🚬' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() =>
              onFilterChange({ ...filters, type: option.value as FilterState['type'] })
            }
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              filters.type === option.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* Toggle for detailed filters */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-sm text-gray-500 py-1"
      >
        {expanded ? '▲ フィルタを閉じる' : '▼ 詳細フィルタ'}
      </button>

      {/* Detailed Filters */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-3">
          {/* Toilet Filters */}
          {(filters.type === 'all' || filters.type === 'toilet') && (
            <div>
              <p className="text-xs text-gray-500 mb-1">トイレ条件</p>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.toiletFreeOnly}
                    onChange={(e) =>
                      onFilterChange({ ...filters, toiletFreeOnly: e.target.checked })
                    }
                    className="rounded"
                  />
                  無料のみ
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.toilet24h}
                    onChange={(e) =>
                      onFilterChange({ ...filters, toilet24h: e.target.checked })
                    }
                    className="rounded"
                  />
                  24時間
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.toiletBarrierFree}
                    onChange={(e) =>
                      onFilterChange({ ...filters, toiletBarrierFree: e.target.checked })
                    }
                    className="rounded"
                  />
                  バリアフリー
                </label>
              </div>
            </div>
          )}

          {/* Smoking Filters */}
          {(filters.type === 'all' || filters.type === 'smoking') && (
            <div>
              <p className="text-xs text-gray-500 mb-1">喫煙タイプ</p>
              <div className="flex flex-wrap gap-2">
                {SMOKING_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleSmokingType(option.value)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      filters.smokingTypes.length === 0 ||
                      filters.smokingTypes.includes(option.value)
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
