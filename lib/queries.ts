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
  full_name: string | null;
  phone: string | null;
  nip: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  place_name: string;
  user_display_name: string;
};

export async function getOwnershipRequests(filter: 'all' | 'pending' = 'pending'): Promise<OwnershipRequestRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('ownership_requests')
    .select(`
      id, user_id, place_id, full_name, phone, nip, message, status, admin_note, created_at,
      places(name)
    `)
    .order('created_at', { ascending: false });

  if (filter === 'pending') query = query.eq('status', 'pending');

  const { data, error } = await query;
  if (error) { console.error('getOwnershipRequests:', error.message); return []; }

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r: any) => r.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  return rows.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    place_id: row.place_id,
    full_name: row.full_name ?? null,
    phone: row.phone ?? null,
    nip: row.nip,
    message: row.message,
    status: row.status,
    admin_note: row.admin_note,
    created_at: row.created_at,
    place_name: row.places?.name ?? '—',
    user_display_name: profileMap[row.user_id]?.display_name ?? row.user_id,
  }));
}

// --- Promotions ---

export type PromotionRow = {
  id: string;
  place_id: string;
  owner_id: string;
  package: '7d' | '14d' | '30d';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  active_from: string | null;
  active_until: string | null;
  admin_note: string | null;
  created_at: string;
  place_name: string;
  owner_display_name: string;
};

export async function getPromotions(filter: 'all' | 'pending' = 'pending'): Promise<PromotionRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('promotions')
    .select('id, place_id, owner_id, package, status, active_from, active_until, admin_note, created_at, places(name)')
    .order('created_at', { ascending: false });

  if (filter === 'pending') query = query.eq('status', 'pending');

  const { data, error } = await query;
  if (error) { console.error('getPromotions:', error.message); return []; }

  const rows = data ?? [];
  const ownerIds = [...new Set(rows.map((r: any) => r.owner_id))];
  const { data: profiles } = ownerIds.length
    ? await supabase.from('profiles').select('id, display_name').in('id', ownerIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  return rows.map((row: any) => ({
    id: row.id,
    place_id: row.place_id,
    owner_id: row.owner_id,
    package: row.package,
    status: row.status,
    active_from: row.active_from ?? null,
    active_until: row.active_until ?? null,
    admin_note: row.admin_note ?? null,
    created_at: row.created_at,
    place_name: row.places?.name ?? '—',
    owner_display_name: profileMap[row.owner_id]?.display_name ?? row.owner_id,
  }));
}

