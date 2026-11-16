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
  status: string | null;
  created_at: string | null;
}

export interface SpootList {
  id: string;
  title: string;
  emoji: string | null;
  city: string | null;
  cover_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface SpootListPlace {
  id: string;
  list_id: string;
  place_id: string;
  position: number;
  note: string | null;
  place?: Pick<AdminPlace, 'id' | 'name' | 'city' | 'category' | 'address'>;
}

export interface SpootGuide {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  city: string | null;
  theme: string | null;
  is_published: boolean;
  is_sponsored: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  author_id: string | null;
  created_at: string;
}

export type BlockType = 'text' | 'place' | 'heading' | 'quote' | 'image' | 'separator';

export type BlockInstruction = 'popraw' | 'rozwin' | 'skróć' | 'formalny' | 'luźny' | 'magazynowy';

export interface GuideBlock {
  id: string;
  guide_id: string;
  position: number;
  type: BlockType;
  content: Record<string, string>;
  // Populated client-side for 'place' blocks:
  place?: Pick<AdminPlace, 'id' | 'name' | 'category' | 'city' | 'address'> | null;
}

export interface GuideStats {
  totalViews: number;
  uniqueReaders: number;
}

export interface FeaturedPlace {
  id: string;
  place_id: string;
  position: number;
  valid_until: string | null;
  place?: Pick<AdminPlace, 'id' | 'name' | 'city' | 'category'>;
}
