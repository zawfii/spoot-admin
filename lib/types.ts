export type UserRole = 'admin' | 'editor';

export interface AdminPlace {
  id: string;
  name: string;
  category: string;
  city: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  hours: string | null;
  price_range: string | null;
  atmosphere: string[] | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  venue_type: string | null;
  google_place_id: string | null;
}

export interface SpootList {
  id: string;
  title: string;
  emoji: string | null;
  city: string | null;
  is_published: boolean;
  created_at: string;
}

export interface SpootListPlace {
  id: string;
  list_id: string;
  place_id: string;
  position: number;
  note: string | null;
  place?: Pick<AdminPlace, 'id' | 'name' | 'city' | 'category'>;
}

export interface SpootGuide {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  intro: string | null;
  city: string | null;
  theme: string | null;
  is_published: boolean;
  created_at: string;
}

export interface SpootGuidePlace {
  id: string;
  guide_id: string;
  place_id: string;
  position: number;
  editorial_note: string | null;
  place?: Pick<AdminPlace, 'id' | 'name' | 'city' | 'category'>;
}

export interface FeaturedPlace {
  id: string;
  place_id: string;
  position: number;
  valid_until: string | null;
  place?: Pick<AdminPlace, 'id' | 'name' | 'city' | 'category'>;
}
