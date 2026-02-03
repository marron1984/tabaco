export type SpotType = 'toilet' | 'smoking';
export type SpotStatus = 'active' | 'needs_verify' | 'hidden';
export type SmokingType = 'designated_area' | 'inside_ok' | 'outdoor_ok' | 'heated_only' | 'unclear';
export type Confidence = 'sure' | 'maybe' | 'unsure';
export type ReportReason = 'illegal_or_danger' | 'outdated' | 'harassment' | 'wrong_location' | 'other';
export type ReportTargetType = 'spot' | 'review';

export interface Spot {
  id: string;
  type: SpotType;
  title: string | null;
  description: string;
  evidence_hint: string | null;
  lat: number;
  lng: number;
  region_tag: string;
  status: SpotStatus;
  anonymous_id: string;
  created_at: string;
  updated_at: string;
  last_verified_at: string;
  // Toilet specific
  toilet_is_free: boolean | null;
  toilet_open_24h: boolean | null;
  toilet_barrier_free: boolean | null;
  // Smoking specific
  smoking_type: SmokingType | null;
  smoking_ashtray: boolean | null;
  // Import source
  source_name: string | null;
  source_id: string | null;
  source_url: string | null;
  imported_at: string | null;
}

export interface Review {
  id: string;
  spot_id: string;
  body: string;
  confidence: Confidence;
  visited_at: string | null;
  anonymous_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  note: string | null;
  anonymous_id: string;
  created_at: string;
}

export interface RateLimit {
  key: string;
  count: number;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      spots: {
        Row: Spot;
        Insert: Omit<Spot, 'id' | 'created_at' | 'updated_at' | 'last_verified_at'>;
        Update: Partial<Omit<Spot, 'id'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: Partial<Omit<Review, 'id'>>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at'>;
        Update: Partial<Omit<Report, 'id'>>;
      };
      rate_limits: {
        Row: RateLimit;
        Insert: RateLimit;
        Update: Partial<RateLimit>;
      };
    };
  };
}
