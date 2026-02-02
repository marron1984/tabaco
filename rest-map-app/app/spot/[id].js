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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc, collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Demo data
const DEMO_SPOTS = {
  '1': { id: '1', name: 'Shibuya Station Smoking Area', type: 'smoking', address: 'Shibuya Station', description: 'Official smoking area near Hachiko exit. Well-ventilated with multiple ashtrays.', isPublic: true },
  '2': { id: '2', name: 'Shinjuku Public Toilet', type: 'toilet', address: 'Shinjuku Station', description: 'Clean public restroom with wheelchair access and baby changing facilities.', isPublic: true },
  '3': { id: '3', name: 'Hidden Cafe Spot', type: 'cafe', address: 'Near Shibuya', description: 'Quiet cafe with great wifi. Perfect for remote work.', isPublic: false },
  '4': { id: '4', name: 'Rooftop Smoking Area', type: 'smoking', address: 'Harajuku', description: 'Nice view, usually empty in the morning.', isPublic: false },
};

const DEMO_REVIEWS = [
  { id: 'r1', userName: 'TravelFan', rating: 4, comment: 'Clean and easy to find!', spotId: '1' },
  { id: 'r2', userName: 'LocalGuide', rating: 5, comment: 'Great spot, not too crowded.', spotId: '1' },
];

export default function SpotDetailScreen() {
  const { id, isPublic } = useLocalSearchParams();
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
    fetchSpotData();
  }, [id]);

  const fetchSpotData = async () => {
    setLoading(true);
    try {
      // Try Firestore
      const collectionName = isPublic === 'true' ? 'publicSpots' : 'userSpots';
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSpot({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Use demo data
        setSpot(DEMO_SPOTS[id] || { id, name: 'Unknown Spot', type: 'unknown', address: 'Unknown', description: 'No details available.' });
      }

      // Fetch reviews for members
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
      setSpot(DEMO_SPOTS[id] || { id, name: 'Unknown Spot', type: 'unknown', address: 'Unknown', description: 'No details available.' });
      if (isMember) {
        setReviews(DEMO_REVIEWS.filter(r => r.spotId === id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please write a comment.');
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
      Alert.alert('Success', 'Review submitted!');
    } catch (error) {
      // Demo mode: just add locally
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

  const getEmoji = (type) => {
    switch (type) {
      case 'smoking': return '🚬';
      case 'toilet': return '🚻';
      case 'cafe': return '☕';
      default: return '📍';
    }
  };

  const renderStars = (rating, interactive = false) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => interactive && setNewRating(star)}
        >
          <Text style={styles.star}>{star <= rating ? '★' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
      {/* Spot Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{getEmoji(spot.type)}</Text>
        <Text style={styles.name}>{spot.name}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, spot.isPublic ? styles.badgeOfficial : styles.badgeUser]}>
            <Text style={styles.badgeText}>
              {spot.isPublic ? 'Official' : 'User Submitted'}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{spot.type}</Text>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.text}>{spot.address}</Text>
      </View>

      {spot.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.text}>{spot.description}</Text>
        </View>
      )}

      {/* Reviews Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>

        {isGuest ? (
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
            {/* Write Review Button */}
            {!showReviewForm && (
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => setShowReviewForm(true)}
              >
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.formLabel}>Your Rating</Text>
                {renderStars(newRating, true)}

                <Text style={styles.formLabel}>Comment</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  placeholder="Share your experience..."
                  value={newComment}
                  onChangeText={setNewComment}
                  editable={!submitting}
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowReviewForm(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.disabled]}
                    onPress={handleSubmitReview}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
            ) : (
              reviews.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.userName}</Text>
                    {renderStars(review.rating)}
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: '#666', marginBottom: 20 },
  backButton: { backgroundColor: '#4A90D9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: '600' },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  badges: { flexDirection: 'row', marginTop: 12 },
  badge: { backgroundColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginHorizontal: 4 },
  badgeOfficial: { backgroundColor: '#4CAF50' },
  badgeUser: { backgroundColor: '#FF9800' },
  badgeText: { fontSize: 12, color: '#fff', fontWeight: '500' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  text: { fontSize: 15, color: '#666', lineHeight: 22 },
  loginPrompt: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  loginPromptText: { fontSize: 14, color: '#666', marginBottom: 12 },
  loginButton: { backgroundColor: '#4A90D9', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  loginButtonText: { color: '#fff', fontWeight: '600' },
  writeReviewButton: {
    backgroundColor: '#4A90D9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewText: { color: '#fff', fontWeight: '600' },
  reviewForm: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  formLabel: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 8, marginTop: 12 },
  starsContainer: { flexDirection: 'row' },
  star: { fontSize: 28, color: '#FFD700', marginRight: 4 },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  formButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 12 },
  cancelText: { color: '#666', fontWeight: '500' },
  submitButton: { backgroundColor: '#4A90D9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  disabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '600' },
  noReviews: { textAlign: 'center', color: '#999', fontStyle: 'italic', padding: 20 },
  reviewCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: '#333' },
  reviewComment: { fontSize: 14, color: '#666', lineHeight: 20 },
  bottomPadding: { height: 40 },
});
