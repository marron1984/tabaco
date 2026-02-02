import { Timestamp } from 'firebase/firestore';

// Spot types
export type SpotType = 'smoking' | 'toilet' | 'cafe';

// Base spot interface
export interface BaseSpot {
  id: string;
  name: string;
  type: SpotType;
  latitude: number;
  longitude: number;
  address: string;
  description?: string;
  imageUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Public spots (viewable by guests) - official public toilets and smoking areas
export interface PublicSpot extends BaseSpot {
  isOfficial: true;
  source?: string; // e.g., "City Government", "Train Station"
  openingHours?: string;
  facilities?: string[]; // e.g., ["wheelchair accessible", "baby changing"]
}

// User-submitted spots (login required to view)
export interface UserSpot extends BaseSpot {
  isOfficial: false;
  submittedBy: string; // User ID
  isVerified: boolean;
  upvotes: number;
  downvotes: number;
}

// Combined spot type
export type Spot = PublicSpot | UserSpot;

// Reviews (login required)
export interface Review {
  id: string;
  spotId: string;
  spotType: 'public' | 'user'; // Which collection the spot belongs to
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  helpfulCount: number;
}

// User profile
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  createdAt: Timestamp;
  spotsSubmitted: number;
  reviewsWritten: number;
}

// Auth state
export type AuthState = 'loading' | 'guest' | 'authenticated';

// Filter state
export interface SpotFilter {
  showSmoking: boolean;
  showToilet: boolean;
  showCafe: boolean;
}

// Map region
export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
