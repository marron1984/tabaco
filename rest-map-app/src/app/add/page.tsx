'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase, getAnonymousId } from '@/lib/supabase';
import { createSpotSchema, type CreateSpotInput } from '@/lib/validations';
import type { SmokingType } from '@/types/database';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="text-gray-500">地図を読み込み中...</div>
    </div>
  ),
});

const SMOKING_TYPE_OPTIONS: { value: SmokingType; label: string }[] = [
  { value: 'designated_area', label: '喫煙所' },
  { value: 'inside_ok', label: '店内喫煙可' },
  { value: 'outdoor_ok', label: '屋外可' },
  { value: 'heated_only', label: '加熱式のみ' },
  { value: 'unclear', label: '不明' },
];

export default function AddSpotPage() {
  const router = useRouter();
  const [type, setType] = useState<'toilet' | 'smoking'>('toilet');
  const [location, setLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceHint, setEvidenceHint] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toilet options
  const [toiletIsFree, setToiletIsFree] = useState(true);
  const [toilet24h, setToilet24h] = useState(false);
  const [toiletBarrierFree, setToiletBarrierFree] = useState(false);

  // Smoking options
  const [smokingType, setSmokingType] = useState<SmokingType>('designated_area');
  const [smokingAshtray, setSmokingAshtray] = useState(false);

  const handleMapClick = (lngLat: { lng: number; lat: number }) => {
    setLocation(lngLat);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location) {
      setError('地図上で位置を選択してください');
      return;
    }

    const input: CreateSpotInput = {
      type,
      title: title || undefined,
      description,
      evidence_hint: evidenceHint || undefined,
      lat: location.lat,
      lng: location.lng,
      agreed_to_rules: agreed as true,
      // Toilet specific
      toilet_is_free: type === 'toilet' ? toiletIsFree : undefined,
      toilet_open_24h: type === 'toilet' ? toilet24h : undefined,
      toilet_barrier_free: type === 'toilet' ? toiletBarrierFree : undefined,
      // Smoking specific
      smoking_type: type === 'smoking' ? smokingType : undefined,
      smoking_ashtray: type === 'smoking' ? smokingAshtray : undefined,
    };

    const result = createSpotSchema.safeParse(input);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setSubmitting(true);

    try {
      const anonymousId = getAnonymousId();

      const { error: insertError } = await supabase.from('spots').insert({
        type,
        title: title || null,
        description,
        evidence_hint: evidenceHint || null,
        lat: location.lat,
        lng: location.lng,
        region_tag: 'kansai',
        status: 'active',
        anonymous_id: anonymousId,
        toilet_is_free: type === 'toilet' ? toiletIsFree : null,
        toilet_open_24h: type === 'toilet' ? toilet24h : null,
        toilet_barrier_free: type === 'toilet' ? toiletBarrierFree : null,
        smoking_type: type === 'smoking' ? smokingType : null,
        smoking_ashtray: type === 'smoking' ? smokingAshtray : null,
      });

      if (insertError) throw insertError;

      router.push('/');
    } catch (err) {
      console.error('Error creating spot:', err);
      setError('投稿に失敗しました。しばらく経ってから再度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-gray-600 text-lg">
            ← 戻る
          </button>
          <h1 className="font-semibold text-gray-900">スポットを追加</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              種別 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('toilet')}
                className={`py-3 px-4 rounded-xl text-center transition-colors ${
                  type === 'toilet'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                🚻 トイレ
              </button>
              <button
                type="button"
                onClick={() => setType('smoking')}
                className={`py-3 px-4 rounded-xl text-center transition-colors ${
                  type === 'smoking'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                🚬 喫煙
              </button>
            </div>
          </div>

          {/* Map for Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              位置 <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">地図をタップして選択</span>
            </label>
            <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
              <Map
                spots={[]}
                onMapClick={handleMapClick}
                selectedLocation={location}
                zoom={15}
              />
            </div>
            {location && (
              <p className="text-sm text-green-600 mt-2">
                ✓ 位置を選択しました ({location.lat.toFixed(6)}, {location.lng.toFixed(6)})
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名前（任意）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：〇〇駅前公衆トイレ"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明 <span className="text-red-500">*</span>
              <span className="text-gray-500 font-normal ml-2">20文字以上</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="場所の詳細、アクセス方法、営業時間など"
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/1000</p>
          </div>

          {/* Evidence Hint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              根拠メモ（任意）
            </label>
            <input
              type="text"
              value={evidenceHint}
              onChange={(e) => setEvidenceHint(e.target.value)}
              placeholder="例：公式サイトで確認、実際に利用した等"
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Type-specific Options */}
          {type === 'toilet' ? (
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-blue-900">トイレ詳細</h3>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={toiletIsFree}
                  onChange={(e) => setToiletIsFree(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-700">無料</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={toilet24h}
                  onChange={(e) => setToilet24h(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-700">24時間利用可</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={toiletBarrierFree}
                  onChange={(e) => setToiletBarrierFree(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-700">バリアフリー対応</span>
              </label>
            </div>
          ) : (
            <div className="bg-orange-50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-orange-900">喫煙詳細</h3>
              <div>
                <label className="block text-sm text-gray-700 mb-2">喫煙タイプ</label>
                <div className="grid grid-cols-2 gap-2">
                  {SMOKING_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSmokingType(option.value)}
                      className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                        smokingType === option.value
                          ? 'bg-orange-500 text-white'
                          : 'bg-white border border-orange-200 text-orange-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={smokingAshtray}
                  onChange={(e) => setSmokingAshtray(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-700">灰皿あり</span>
              </label>
            </div>
          )}

          {/* Agreement */}
          <div className="bg-red-50 rounded-xl p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded mt-0.5"
              />
              <span className="text-sm text-gray-700">
                以下を確認し、同意します：
                <ul className="mt-2 space-y-1 text-red-700">
                  <li>• 禁止区域・私有地無断・路上など違法・迷惑の助長は投稿しません</li>
                  <li>• 施設ルール・条例を優先します</li>
                  <li>• 虚偽や誤解を招く情報は投稿しません</li>
                </ul>
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !agreed || !location}
            className="w-full py-4 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {submitting ? '投稿中...' : 'スポットを投稿'}
          </button>
        </form>
      </main>
    </div>
  );
}
