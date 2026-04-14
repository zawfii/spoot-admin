import { createClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
  const supabase = createClient();
  const [places, lists, guides, featured] = await Promise.all([
    supabase.from('places').select('id', { count: 'exact', head: true }),
    supabase.from('spoot_lists').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('spoot_guides').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('featured_places').select('id', { count: 'exact', head: true }),
  ]);
  return {
    placesTotal: places.count ?? 0,
    listsPublished: lists.count ?? 0,
    guidesPublished: guides.count ?? 0,
    featuredCount: featured.count ?? 0,
  };
}

export async function getPlaces(search = '', city = '') {
  const supabase = createClient();
  let query = supabase
    .from('places')
    .select('id, name, category, city, lat, lng')
    .order('name');

  if (search) query = query.ilike('name', `%${search}%`);
  if (city) query = query.eq('city', city);

  const { data } = await query.limit(100);
  return data ?? [];
}

export async function getDistinctCities() {
  const supabase = createClient();
  const { data } = await supabase.from('places').select('city').not('city', 'is', null);
  const cities = [...new Set((data ?? []).map(r => r.city).filter(Boolean))].sort();
  return cities as string[];
}

export async function getPlace(id: string) {
  const supabase = createClient();
  const { data } = await supabase.from('places').select('*').eq('id', id).single();
  return data;
}

export async function getSpootLists() {
  const supabase = createClient();
  const { data } = await supabase
    .from('spoot_lists')
    .select('*, spoot_list_places(count)')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getGuides() {
  const supabase = createClient();
  const { data } = await supabase
    .from('spoot_guides')
    .select('*, spoot_guide_places(count)')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getFeaturedPlaces() {
  const supabase = createClient();
  const { data } = await supabase
    .from('featured_places')
    .select('*, place:places(id, name, city, category)')
    .order('position');
  return data ?? [];
}

// --- Ownership Requests ---

export type OwnershipRequestRow = {
  id: string;
  user_id: string;
  place_id: string;
  nip: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  place_name: string;
  user_email: string;
};

export async function getOwnershipRequests(filter: 'all' | 'pending' = 'pending'): Promise<OwnershipRequestRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('ownership_requests')
    .select(`
      id, user_id, place_id, nip, message, status, admin_note, created_at,
      places(name),
      profiles(email)
    `)
    .order('created_at', { ascending: false });

  if (filter === 'pending') query = query.eq('status', 'pending');

  const { data, error } = await query;
  if (error) { console.error('getOwnershipRequests:', error.message); return []; }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    place_id: row.place_id,
    nip: row.nip,
    message: row.message,
    status: row.status,
    admin_note: row.admin_note,
    created_at: row.created_at,
    place_name: row.places?.name ?? '—',
    user_email: row.profiles?.email ?? row.user_id,
  }));
}

export async function getPendingOwnershipCount(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from('ownership_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count ?? 0;
}
