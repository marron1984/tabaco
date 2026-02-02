'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase, getAnonymousId } from '@/lib/supabase';
import type { Spot, Review, Confidence, ReportReason } from '@/types/database';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="text-gray-500">地図を読み込み中...</div>
    </div>
  ),
});

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

const CONFIDENCE_LABELS = {
  sure: '確実',
  maybe: 'たぶん',
  unsure: '不明',
};

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'illegal_or_danger', label: '違法・危険な情報' },
  { value: 'outdated', label: '情報が古い・閉鎖済み' },
  { value: 'harassment', label: '不適切な内容' },
  { value: 'wrong_location', label: '位置が間違っている' },
  { value: 'other', label: 'その他' },
];

export default function SpotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [spot, setSpot] = useState<Spot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewConfidence, setReviewConfidence] = useState<Confidence>('maybe');
  const [reviewVisitedAt, setReviewVisitedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report form
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportTargetType, setReportTargetType] = useState<'spot' | 'review'>('spot');
  const [reportTargetId, setReportTargetId] = useState<string>('');
  const [reportReason, setReportReason] = useState<ReportReason>('outdated');
  const [reportNote, setReportNote] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch spot
        const { data: spotData, error: spotError } = await supabase
          .from('spots')
          .select('*')
          .eq('id', id)
          .single();

        if (spotError) throw spotError;
        setSpot(spotData);

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('spot_id', id)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;
        setReviews(reviewsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('スポットの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reviewBody.length < 10) {
      alert('口コミは10文字以上必要です');
      return;
    }

    setSubmittingReview(true);

    try {
      const { error } = await supabase.from('reviews').insert({
        spot_id: id,
        body: reviewBody,
        confidence: reviewConfidence,
        visited_at: reviewVisitedAt || null,
        anonymous_id: getAnonymousId(),
      });

      if (error) throw error;

      // Refresh reviews
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('spot_id', id)
        .order('created_at', { ascending: false });

      setReviews(data || []);
      setReviewBody('');
      setShowReviewForm(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('口コミの投稿に失敗しました');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenReport = (targetType: 'spot' | 'review', targetId: string) => {
    setReportTargetType(targetType);
    setReportTargetId(targetId);
    setShowReportForm(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);

    try {
      const { error } = await supabase.from('reports').insert({
        target_type: reportTargetType,
        target_id: reportTargetId,
        reason: reportReason,
        note: reportNote || null,
        anonymous_id: getAnonymousId(),
      });

      if (error) throw error;

      alert('通報を受け付けました。ご協力ありがとうございます。');
      setShowReportForm(false);
      setReportNote('');
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('通報の送信に失敗しました');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-red-500 mb-4">{error || 'スポットが見つかりません'}</p>
        <button
          onClick={() => router.push('/')}
          className="text-blue-500 underline"
        >
          トップに戻る
        </button>
      </div>
    );
  }

  const isToilet = spot.type === 'toilet';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className={`sticky top-0 z-10 ${
          isToilet ? 'bg-blue-500' : 'bg-orange-500'
        } text-white`}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="text-lg">
            ← 戻る
          </button>
          <span className="text-2xl">{isToilet ? '🚻' : '🚬'}</span>
          <button
            onClick={() => handleOpenReport('spot', spot.id)}
            className="text-sm opacity-80 hover:opacity-100"
          >
            通報
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Map */}
        <div className="h-48">
          <Map
            spots={[spot]}
            center={[spot.lng, spot.lat]}
            zoom={16}
            interactive={false}
          />
        </div>

        {/* Info Card */}
        <div className="bg-white -mt-6 mx-4 rounded-xl shadow-lg p-4 relative z-10">
          {/* Status Badge */}
          {spot.status === 'needs_verify' && (
            <div className="absolute -top-3 right-4 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              要確認
            </div>
          )}

          <div className="flex items-start gap-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                isToilet ? 'bg-blue-100' : 'bg-orange-100'
              }`}
            >
              {isToilet ? '🚻' : '🚬'}
            </div>
            <div className="flex-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isToilet
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {TYPE_LABELS[spot.type]}
              </span>
              <h1 className="font-bold text-lg text-gray-900 mt-1">
                {spot.title || `${TYPE_LABELS[spot.type]}スポット`}
              </h1>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {isToilet ? (
              <>
                {spot.toilet_is_free && (
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                    無料
                  </span>
                )}
                {spot.toilet_open_24h && (
                  <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                    24時間
                  </span>
                )}
                {spot.toilet_barrier_free && (
                  <span className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700">
                    バリアフリー
                  </span>
                )}
              </>
            ) : (
              <>
                {spot.smoking_type && (
                  <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                    {SMOKING_TYPE_LABELS[spot.smoking_type]}
                  </span>
                )}
                {spot.smoking_ashtray && (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                    灰皿あり
                  </span>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <p className="mt-4 text-gray-700 whitespace-pre-wrap">{spot.description}</p>

          {/* Evidence Hint */}
          {spot.evidence_hint && (
            <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded">
              根拠: {spot.evidence_hint}
            </p>
          )}

          {/* Meta */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
            <p>投稿日: {new Date(spot.created_at).toLocaleDateString('ja-JP')}</p>
            {spot.source_name && <p>出典: {spot.source_name}</p>}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-6 px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">口コミ ({reviews.length})</h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {showReviewForm ? 'キャンセル' : '口コミを書く'}
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-white rounded-xl p-4 shadow mb-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  口コミ <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">10文字以上</span>
                </label>
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="実際に利用した感想など"
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    確信度
                  </label>
                  <select
                    value={reviewConfidence}
                    onChange={(e) => setReviewConfidence(e.target.value as Confidence)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="sure">確実</option>
                    <option value="maybe">たぶん</option>
                    <option value="unsure">不明</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    訪問日（任意）
                  </label>
                  <input
                    type="date"
                    value={reviewVisitedAt}
                    onChange={(e) => setReviewVisitedAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submittingReview ? '投稿中...' : '口コミを投稿'}
              </button>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>まだ口コミはありません</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        review.confidence === 'sure'
                          ? 'bg-green-100 text-green-700'
                          : review.confidence === 'maybe'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {CONFIDENCE_LABELS[review.confidence]}
                    </span>
                    <button
                      onClick={() => handleOpenReport('review', review.id)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      通報
                    </button>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {review.body}
                  </p>
                  <div className="mt-2 text-xs text-gray-400 flex gap-3">
                    <span>{new Date(review.created_at).toLocaleDateString('ja-JP')}</span>
                    {review.visited_at && (
                      <span>訪問: {new Date(review.visited_at).toLocaleDateString('ja-JP')}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Report Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg text-gray-900 mb-4">通報</h3>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  理由
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={reportReason === option.value}
                        onChange={(e) => setReportReason(e.target.value as ReportReason)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  詳細（任意）
                </label>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="具体的な理由があれば記載"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submittingReport ? '送信中...' : '通報する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
