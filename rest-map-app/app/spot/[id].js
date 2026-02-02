'use client';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { COLORS, SHADOWS, SPACING, RADIUS, SPOT_COLORS } from '../../constants/theme';

// Force client-side rendering for dynamic routes
export const unstable_settings = {
  render: 'client',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

// Demo data (Osaka area)
const DEMO_SPOTS = {
  '1': { id: '1', name: 'ヨドバシカメラ梅田 喫煙所', type: 'smoking', lat: 34.704067, lng: 135.496244, address: '大阪市北区大深町1-1', description: '梅田駅直結のヨドバシカメラ横にある公式喫煙所。屋外で換気が良い。', isPublic: true },
  '2': { id: '2', name: '大阪駅前第3ビル トイレ', type: 'toilet', lat: 34.700909, lng: 135.498291, address: '大阪市北区梅田1-1-3', description: '地下街直結の清潔なトイレ。多目的トイレも完備。', isPublic: true },
  '3': { id: '3', name: '難波 秘密の喫煙所', type: 'smoking', lat: 34.665487, lng: 135.501038, address: '難波駅周辺', description: '地元民しか知らない穴場スポット。混雑時でも比較的空いている。', isPublic: false },
  '4': { id: '4', name: 'アメ村カフェ＆スモーク', type: 'cafe', lat: 34.672314, lng: 135.498556, address: '中央区西心斎橋', description: '喫煙可能なカフェ。コーヒーも美味しい。Wi-Fi完備。', isPublic: false },
};

const DEMO_REVIEWS = [
  { id: 'r1', userName: 'osaka_local', rating: 4, comment: '分かりやすい場所にあって便利！', spotId: '1' },
  { id: 'r2', userName: 'traveler_jp', rating: 5, comment: '梅田で一番見つけやすい喫煙所。', spotId: '1' },
  { id: 'r3', userName: 'cafe_lover', rating: 5, comment: 'コーヒーも雰囲気も最高です。', spotId: '4' },
];

// Tag Component
function Tag({ label, color, textColor }) {
  return (
    <View style={[styles.tag, { backgroundColor: color }]}>
      <Text style={[styles.tagText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

// Review Card Component
function ReviewCard({ review }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerAvatar}>
          <Text style={styles.reviewerInitial}>
            {review.userName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{review.userName}</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <Text key={star} style={styles.starSmall}>
                {star <= review.rating ? '★' : '☆'}
              </Text>
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
    </View>
  );
}

export default function SpotDetailScreen() {
  const params = useLocalSearchParams();
  const id = params?.id || '';
  const isPublic = params?.isPublic || 'true';
  const router = useRouter();
  const { user, isGuest, isMember } = useAuth();

  const [spot, setSpot] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSpotData();
    }
  }, [id]);

  const fetchSpotData = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const collectionName = isPublic === 'true' ? 'publicSpots' : 'userSpots';
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSpot({ id: docSnap.id, ...docSnap.data() });
      } else {
        setSpot(DEMO_SPOTS[id] || { id, name: 'Unknown Spot', type: 'unknown', address: 'Unknown', description: '' });
      }

      if (isMember) {
        try {
          const reviewsRef = collection(db, 'reviews');
          const reviewsSnap = await getDocs(reviewsRef);
          const spotReviews = reviewsSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(r => r.spotId === id);
          setReviews(spotReviews.length > 0 ? spotReviews : DEMO_REVIEWS.filter(r => r.spotId === id));
        } catch (e) {
          setReviews(DEMO_REVIEWS.filter(r => r.spotId === id));
        }
      }
    } catch (error) {
      console.error('Error fetching spot:', error);
      setSpot(DEMO_SPOTS[id] || { id, name: 'Unknown Spot', type: 'unknown', address: 'Unknown', description: '' });
      if (isMember) {
        setReviews(DEMO_REVIEWS.filter(r => r.spotId === id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      Alert.alert('エラー', 'コメントを入力してください');
      return;
    }

    setSubmitting(true);
    try {
      const review = {
        spotId: id,
        userId: user?.uid,
        userName: user?.email?.split('@')[0] || 'Anonymous',
        rating: newRating,
        comment: newComment.trim(),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'reviews'), review);

      setReviews(prev => [{ ...review, id: Date.now().toString() }, ...prev]);
      setNewComment('');
      setNewRating(5);
      setShowReviewForm(false);
      Alert.alert('完了', 'レビューを投稿しました！');
    } catch (error) {
      const review = {
        id: Date.now().toString(),
        userName: user?.email?.split('@')[0] || 'You',
        rating: newRating,
        comment: newComment.trim(),
      };
      setReviews(prev => [review, ...prev]);
      setNewComment('');
      setShowReviewForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const openInMaps = () => {
    if (!spot?.lat || !spot?.lng) {
      Alert.alert('エラー', 'このスポットの座標が登録されていません');
      return;
    }

    const label = encodeURIComponent(spot.name);
    const lat = spot.lat;
    const lng = spot.lng;

    let url;
    if (Platform.OS === 'ios') {
      url = `maps:?q=${label}&ll=${lat},${lng}`;
    } else if (Platform.OS === 'android') {
      url = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  const getSpotTypeInfo = (type) => {
    return SPOT_COLORS[type] || { bg: '#F3F4F6', text: '#374151', emoji: '📍' };
  };

  const renderStars = (rating, interactive = false) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => interactive && setNewRating(star)}
          style={styles.starButton}
        >
          <Text style={[styles.star, star <= rating && styles.starFilled]}>
            {star <= rating ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Show loading state
  if (loading || !id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS?.primary || '#3B82F6'} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  // Show error state if no spot found
  if (!spot) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😢</Text>
        <Text style={styles.errorText}>スポットが見つかりません</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Safe access to spot properties
  const spotType = spot?.type || 'unknown';
  const spotName = spot?.name || 'Unknown Spot';
  const spotAddress = spot?.address || '住所不明';
  const spotDescription = spot?.description || '';
  const spotIsPublic = spot?.isPublic ?? true;
  const spotLat = spot?.lat;
  const spotLng = spot?.lng;

  const typeInfo = getSpotTypeInfo(spotType);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Immersive Header */}
      <View style={[styles.header, { backgroundColor: typeInfo?.bg || '#F3F4F6' }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>{typeInfo?.emoji || '📍'}</Text>
          <Text style={styles.headerTitle}>{spotName}</Text>
          <View style={styles.headerBadges}>
            <Tag
              label={spotType === 'smoking' ? '喫煙所' : spotType === 'toilet' ? 'トイレ' : 'カフェ'}
              color="rgba(255,255,255,0.9)"
              textColor={typeInfo?.text || '#374151'}
            />
            <Tag
              label={spotIsPublic ? '公式' : 'ユーザー投稿'}
              color={spotIsPublic ? (COLORS?.success || '#10B981') : '#F97316'}
              textColor={COLORS?.textLight || '#FFFFFF'}
            />
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Content Card */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentCard}>
          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>場所</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationIcon}>
                <Text style={styles.locationEmoji}>📍</Text>
              </View>
              <Text style={styles.locationText}>{spotAddress}</Text>
            </View>
            {spotLat && spotLng && (
              <TouchableOpacity style={styles.mapButton} onPress={openInMaps} activeOpacity={0.8}>
                <Text style={styles.mapButtonIcon}>🗺️</Text>
                <Text style={styles.mapButtonText}>マップで開く</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Description Section */}
          {spotDescription ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>説明</Text>
              <Text style={styles.descriptionText}>{spotDescription}</Text>
            </View>
          ) : null}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>レビュー</Text>
              {isMember && reviews.length > 0 && (
                <View style={styles.avgRating}>
                  <Text style={styles.avgRatingStar}>★</Text>
                  <Text style={styles.avgRatingText}>
                    {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {isGuest ? (
              <View style={styles.guestPrompt}>
                <Text style={styles.guestIcon}>🔐</Text>
                <Text style={styles.guestText}>
                  ログインするとレビューの閲覧・投稿ができます
                </Text>
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={() => router.push('/login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.guestButtonText}>ログイン</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Write Review Button */}
                {!showReviewForm && (
                  <TouchableOpacity
                    style={styles.writeReviewButton}
                    onPress={() => setShowReviewForm(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.writeReviewIcon}>✍️</Text>
                    <Text style={styles.writeReviewText}>レビューを書く</Text>
                  </TouchableOpacity>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <View style={styles.reviewForm}>
                    <Text style={styles.formLabel}>評価</Text>
                    {renderStars(newRating, true)}

                    <Text style={styles.formLabel}>コメント</Text>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={4}
                      placeholder="感想を共有してください..."
                      placeholderTextColor={COLORS.textMuted}
                      value={newComment}
                      onChangeText={setNewComment}
                      editable={!submitting}
                    />

                    <View style={styles.formButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowReviewForm(false)}
                      >
                        <Text style={styles.cancelText}>キャンセル</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.disabled]}
                        onPress={handleSubmitReview}
                        disabled={submitting}
                        activeOpacity={0.8}
                      >
                        {submitting ? (
                          <ActivityIndicator color={COLORS.textLight} size="small" />
                        ) : (
                          <Text style={styles.submitText}>投稿する</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <View style={styles.emptyReviews}>
                    <Text style={styles.emptyIcon}>💬</Text>
                    <Text style={styles.emptyText}>
                      まだレビューがありません{'\n'}最初のレビューを書きましょう！
                    </Text>
                  </View>
                ) : (
                  reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS?.background || '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS?.textSecondary || '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
  },
  backButtonText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 15,
  },

  // Immersive Header
  header: {
    height: HEADER_HEIGHT,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  headerBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  headerBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  headerBackIcon: {
    fontSize: 20,
    color: COLORS.textPrimary,
  },

  // Content Card
  scrollView: {
    flex: 1,
    marginTop: -SPACING.xl,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  contentCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    minHeight: 500,
    ...SHADOWS.medium,
  },

  // Tags
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Sections
  section: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  avgRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  avgRatingStar: {
    fontSize: 14,
    color: '#F59E0B',
    marginRight: 2,
  },
  avgRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  locationEmoji: {
    fontSize: 18,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  mapButtonIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  mapButtonText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 15,
  },

  // Description
  descriptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  // Guest Prompt
  guestPrompt: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
  },
  guestIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  guestText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  guestButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
  },
  guestButtonText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 15,
  },

  // Write Review
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  writeReviewIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  writeReviewText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },

  // Review Form
  reviewForm: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  starButton: {
    paddingRight: SPACING.xs,
  },
  star: {
    fontSize: 32,
    color: '#D1D5DB',
  },
  starFilled: {
    color: '#F59E0B',
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontWeight: '500',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  disabled: {
    opacity: 0.6,
  },
  submitText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 15,
  },

  // Empty Reviews
  emptyReviews: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Review Card
  reviewCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
  },
  starSmall: {
    fontSize: 12,
    color: '#F59E0B',
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
});
