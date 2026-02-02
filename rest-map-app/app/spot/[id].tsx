import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { getSpotById, getReviewsForSpot, createReview } from '../../src/services/firestore';
import { Spot, Review } from '../../src/types';

// Demo reviews for testing
const DEMO_REVIEWS: Review[] = [
  {
    id: 'review-1',
    spotId: 'demo-1',
    spotType: 'public',
    userId: 'user123',
    userName: 'TravelFan',
    rating: 4,
    comment: 'Clean and well-maintained. Easy to find near the station exit.',
    createdAt: { seconds: Date.now() / 1000 - 86400, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000 - 86400, nanoseconds: 0 } as any,
    helpfulCount: 5,
  },
  {
    id: 'review-2',
    spotId: 'demo-1',
    spotType: 'public',
    userId: 'user456',
    userName: 'LocalGuide',
    rating: 5,
    comment: 'Great spot! Usually not too crowded in the morning.',
    createdAt: { seconds: Date.now() / 1000 - 172800, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000 - 172800, nanoseconds: 0 } as any,
    helpfulCount: 3,
  },
];

export default function SpotDetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: 'public' | 'user' }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [spot, setSpot] = useState<Spot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Demo spot data for testing
  const getDemoSpot = (): Spot | null => {
    const demoSpots: Record<string, Spot> = {
      'demo-1': {
        id: 'demo-1',
        name: 'Shibuya Station Smoking Area',
        type: 'smoking',
        latitude: 35.6580,
        longitude: 139.7016,
        address: 'Shibuya Station, Tokyo',
        description: 'Official smoking area near Hachiko exit. Well-ventilated space with multiple ashtrays.',
        isOfficial: true,
        source: 'Tokyo Metro',
        openingHours: '5:00 AM - 12:00 AM',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
      'demo-2': {
        id: 'demo-2',
        name: 'Shinjuku Public Toilet',
        type: 'toilet',
        latitude: 35.6896,
        longitude: 139.6917,
        address: 'Shinjuku Station South Exit',
        description: 'Clean public restroom with wheelchair access and baby changing facilities.',
        isOfficial: true,
        facilities: ['wheelchair accessible', 'baby changing'],
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
      'demo-3': {
        id: 'demo-3',
        name: 'Hidden Gem Cafe',
        type: 'cafe',
        latitude: 35.6620,
        longitude: 139.7050,
        address: 'Shibuya Backstreet',
        description: 'Quiet cafe with great wifi. Perfect for remote work.',
        isOfficial: false,
        submittedBy: 'user123',
        isVerified: true,
        upvotes: 15,
        downvotes: 2,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
      'demo-4': {
        id: 'demo-4',
        name: 'Rooftop Smoking Spot',
        type: 'smoking',
        latitude: 35.6700,
        longitude: 139.7030,
        address: 'Near Harajuku Station',
        description: 'Nice view, usually empty. Access through the back elevator.',
        isOfficial: false,
        submittedBy: 'user456',
        isVerified: false,
        upvotes: 8,
        downvotes: 1,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
    };
    return demoSpots[id as string] || null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to fetch from Firestore first
        const fetchedSpot = await getSpotById(id as string, type as 'public' | 'user');

        if (fetchedSpot) {
          setSpot(fetchedSpot);
        } else {
          // Use demo data
          setSpot(getDemoSpot());
        }

        // Fetch reviews (only if authenticated)
        if (isAuthenticated) {
          const fetchedReviews = await getReviewsForSpot(id as string, type as 'public' | 'user');
          if (fetchedReviews.length > 0) {
            setReviews(fetchedReviews);
          } else {
            // Use demo reviews
            setReviews(DEMO_REVIEWS.filter((r) => r.spotId === id));
          }
        }
      } catch (error) {
        console.error('Error fetching spot:', error);
        setSpot(getDemoSpot());
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type, isAuthenticated]);

  const handleSubmitReview = async () => {
    if (!user || !spot) return;

    if (!newReviewComment.trim()) {
      Alert.alert('Error', 'Please write a comment.');
      return;
    }

    setSubmitting(true);
    try {
      const review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount'> = {
        spotId: spot.id,
        spotType: spot.isOfficial ? 'public' : 'user',
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        rating: newReviewRating,
        comment: newReviewComment.trim(),
      };

      await createReview(review);

      // Add to local state
      const newReview: Review = {
        ...review,
        id: Date.now().toString(),
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        helpfulCount: 0,
      };

      setReviews([newReview, ...reviews]);
      setNewReviewComment('');
      setNewReviewRating(5);
      setShowReviewForm(false);

      Alert.alert('Success', 'Your review has been submitted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSpotEmoji = (spotType: string): string => {
    switch (spotType) {
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

  const renderStars = (rating: number, interactive = false, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => onPress && onPress(star)}
          >
            <Text style={styles.star}>{star <= rating ? '★' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Spot not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Spot header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{getSpotEmoji(spot.type)}</Text>
        <Text style={styles.name}>{spot.name}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, spot.isOfficial ? styles.badgeOfficial : styles.badgeUser]}>
            <Text style={styles.badgeText}>
              {spot.isOfficial ? 'Official' : 'User Submitted'}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{spot.type}</Text>
          </View>
        </View>
      </View>

      {/* Spot details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.address}>{spot.address}</Text>
      </View>

      {spot.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{spot.description}</Text>
        </View>
      )}

      {spot.isOfficial && 'openingHours' in spot && spot.openingHours && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opening Hours</Text>
          <Text style={styles.hours}>{spot.openingHours}</Text>
        </View>
      )}

      {spot.isOfficial && 'facilities' in spot && spot.facilities && spot.facilities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.facilitiesList}>
            {spot.facilities.map((facility, index) => (
              <View key={index} style={styles.facilityBadge}>
                <Text style={styles.facilityText}>{facility}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!spot.isOfficial && 'upvotes' in spot && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Rating</Text>
          <View style={styles.votesContainer}>
            <Text style={styles.votes}>👍 {spot.upvotes}</Text>
            <Text style={styles.votes}>👎 {spot.downvotes}</Text>
            {'isVerified' in spot && spot.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Reviews section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>

        {!isAuthenticated ? (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Sign in to view and write reviews</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Add review button */}
            {!showReviewForm && (
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => setShowReviewForm(true)}
              >
                <Text style={styles.addReviewButtonText}>Write a Review</Text>
              </TouchableOpacity>
            )}

            {/* Review form */}
            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.formLabel}>Your Rating</Text>
                {renderStars(newReviewRating, true, setNewReviewRating)}

                <Text style={styles.formLabel}>Your Comment</Text>
                <TextInput
                  style={styles.reviewInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Share your experience..."
                  value={newReviewComment}
                  onChangeText={setNewReviewComment}
                  editable={!submitting}
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowReviewForm(false)}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.buttonDisabled]}
                    onPress={handleSubmitReview}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet. Be the first to write one!</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.userName}</Text>
                    {renderStars(review.rating)}
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <Text style={styles.reviewMeta}>
                    {review.helpfulCount > 0 && `${review.helpfulCount} found this helpful`}
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  badges: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
    marginTop: 4,
  },
  badgeOfficial: {
    backgroundColor: '#4CAF50',
  },
  badgeUser: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  address: {
    fontSize: 15,
    color: '#666',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  hours: {
    fontSize: 15,
    color: '#666',
  },
  facilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 13,
    color: '#1976D2',
  },
  votesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  votes: {
    fontSize: 16,
    marginRight: 16,
    color: '#666',
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  loginPrompt: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  addReviewButton: {
    backgroundColor: '#4A90D9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  reviewForm: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 24,
    color: '#FFD700',
    marginRight: 4,
  },
  reviewInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#4A90D9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noReviews: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 20,
  },
  reviewCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  reviewMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
