import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  PublicSpot,
  UserSpot,
  Spot,
  Review,
  SpotType,
  SpotFilter,
} from '../types';

// Collection names
const COLLECTIONS = {
  PUBLIC_SPOTS: 'publicSpots',
  USER_SPOTS: 'userSpots',
  REVIEWS: 'reviews',
  USERS: 'users',
} as const;

// Helper to convert Firestore document to typed object
const convertDoc = <T>(doc: DocumentData): T => {
  return {
    id: doc.id,
    ...doc.data(),
  } as T;
};

// ============ Public Spots (Guest accessible) ============

export const getPublicSpots = async (filter?: SpotFilter): Promise<PublicSpot[]> => {
  try {
    const constraints: QueryConstraint[] = [];

    // Apply type filter if specified
    if (filter) {
      const types: SpotType[] = [];
      if (filter.showSmoking) types.push('smoking');
      if (filter.showToilet) types.push('toilet');
      if (filter.showCafe) types.push('cafe');

      if (types.length > 0 && types.length < 3) {
        constraints.push(where('type', 'in', types));
      }
    }

    const q = query(collection(db, COLLECTIONS.PUBLIC_SPOTS), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => convertDoc<PublicSpot>(doc));
  } catch (error) {
    console.error('Error fetching public spots:', error);
    return [];
  }
};

export const getPublicSpotById = async (spotId: string): Promise<PublicSpot | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.PUBLIC_SPOTS, spotId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return convertDoc<PublicSpot>(snapshot);
    }
    return null;
  } catch (error) {
    console.error('Error fetching public spot:', error);
    return null;
  }
};

// ============ User Spots (Login required) ============

export const getUserSpots = async (filter?: SpotFilter): Promise<UserSpot[]> => {
  try {
    const constraints: QueryConstraint[] = [];

    if (filter) {
      const types: SpotType[] = [];
      if (filter.showSmoking) types.push('smoking');
      if (filter.showToilet) types.push('toilet');
      if (filter.showCafe) types.push('cafe');

      if (types.length > 0 && types.length < 3) {
        constraints.push(where('type', 'in', types));
      }
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, COLLECTIONS.USER_SPOTS), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => convertDoc<UserSpot>(doc));
  } catch (error) {
    console.error('Error fetching user spots:', error);
    return [];
  }
};

export const getUserSpotById = async (spotId: string): Promise<UserSpot | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.USER_SPOTS, spotId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return convertDoc<UserSpot>(snapshot);
    }
    return null;
  } catch (error) {
    console.error('Error fetching user spot:', error);
    return null;
  }
};

export const createUserSpot = async (
  spot: Omit<UserSpot, 'id' | 'createdAt' | 'updatedAt' | 'isVerified' | 'upvotes' | 'downvotes'>
): Promise<string | null> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTIONS.USER_SPOTS), {
      ...spot,
      isVerified: false,
      upvotes: 0,
      downvotes: 0,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating user spot:', error);
    return null;
  }
};

// ============ Combined Spots ============

export const getAllSpots = async (
  isAuthenticated: boolean,
  filter?: SpotFilter
): Promise<Spot[]> => {
  const publicSpots = await getPublicSpots(filter);

  if (!isAuthenticated) {
    return publicSpots;
  }

  const userSpots = await getUserSpots(filter);
  return [...publicSpots, ...userSpots];
};

export const getSpotById = async (
  spotId: string,
  spotType: 'public' | 'user'
): Promise<Spot | null> => {
  if (spotType === 'public') {
    return getPublicSpotById(spotId);
  }
  return getUserSpotById(spotId);
};

// ============ Reviews (Login required) ============

export const getReviewsForSpot = async (
  spotId: string,
  spotType: 'public' | 'user'
): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('spotId', '==', spotId),
      where('spotType', '==', spotType),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => convertDoc<Review>(doc));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const createReview = async (
  review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount'>
): Promise<string | null> => {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
      ...review,
      helpfulCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating review:', error);
    return null;
  }
};

export const updateReviewHelpful = async (
  reviewId: string,
  increment: number
): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const current = snapshot.data().helpfulCount || 0;
      await updateDoc(docRef, {
        helpfulCount: current + increment,
        updatedAt: Timestamp.now(),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating review:', error);
    return false;
  }
};
