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

export async function getDashboardExtras() {
  const supabase = createClient();
  const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const [
    placesPending,
    promotionsPending,
    ownershipPending,
    dishCategoriesPending,
    dealsPending,
    placesMissingCoords,
    promotionsExpiringSoon,
    listsUnpublished,
    guidesUnpublished,
    placesNew,
  ] = await Promise.all([
    supabase.from('places').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('ownership_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('dish_category_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('places').select('id', { count: 'exact', head: true }).or('lat.is.null,lng.is.null'),
    supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('status', 'approved').lte('active_until', in3Days).gt('active_until', now),
    supabase.from('spoot_lists').select('id', { count: 'exact', head: true }).eq('is_published', false),
    supabase.from('spoot_guides').select('id', { count: 'exact', head: true }).eq('is_published', false),
    supabase.from('places').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
  ]);

  return {
    needsAttention: {
      placesPending: placesPending.count ?? 0,
      promotionsPending: promotionsPending.count ?? 0,
      ownershipPending: ownershipPending.count ?? 0,
      dishCategoriesPending: dishCategoriesPending.count ?? 0,
      dealsPending: dealsPending.count ?? 0,
    },
    placesMissingCoords: placesMissingCoords.count ?? 0,
    promotionsExpiringSoon: promotionsExpiringSoon.count ?? 0,
    draftsUnpublished: (listsUnpublished.count ?? 0) + (guidesUnpublished.count ?? 0),
    placesNewLast7Days: placesNew.count ?? 0,
  };
}

export async function getPlaces(search = '', city = '', status = '') {
  const supabase = createClient();
  let query = supabase
    .from('places')
    .select('id, name, category, city, lat, lng, status')
    .order('name');

  if (search) query = query.ilike('name', `%${search}%`);
  if (city) query = query.eq('city', city);
  // Zaseedowane miejsca mają status null — liczą się jako zatwierdzone.
  if (status === 'active') query = query.or('status.eq.active,status.is.null');
  else if (status) query = query.eq('status', status);

  const { data } = await query.limit(100);
  return data ?? [];
}

export async function getDistinctCities() {
  const supabase = createClient();
  const { data } = await supabase.from('places').select('city').not('city', 'is', null);
  const cities = Array.from(new Set((data ?? []).map(r => r.city).filter(Boolean))).sort();
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
    .select('*, guide_blocks(type)')
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
  /** 'pending' = lokal dodany razem ze zgłoszeniem (panel właściciela), jeszcze niezatwierdzony. */
  place_status: string | null;
  place_address: string | null;
  user_display_name: string;
};

export type OwnershipStatus = 'pending' | 'approved' | 'rejected';

export async function getOwnershipCounts(): Promise<Record<OwnershipStatus, number>> {
  const supabase = createClient();
  const statuses: OwnershipStatus[] = ['pending', 'approved', 'rejected'];
  const counts = await Promise.all(statuses.map(status =>
    supabase.from('ownership_requests').select('id', { count: 'exact', head: true }).eq('status', status)
      .then(({ count }) => count ?? 0)
  ));
  return { pending: counts[0], approved: counts[1], rejected: counts[2] };
}

export async function getOwnershipRequests(filter: 'all' | OwnershipStatus = 'pending'): Promise<OwnershipRequestRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('ownership_requests')
    .select(`
      id, user_id, place_id, full_name, phone, nip, message, status, admin_note, created_at,
      places(name, status, address, city)
    `)
    .order('created_at', { ascending: false });

  if (filter !== 'all') query = query.eq('status', filter);

  const { data, error } = await query;
  if (error) { console.error('getOwnershipRequests:', error.message); return []; }

  const rows = data ?? [];
  const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
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
    place_status: row.places?.status ?? null,
    place_address: [row.places?.address, row.places?.city].filter(Boolean).join(', ') || null,
    user_display_name: profileMap[row.user_id]?.display_name ?? row.user_id,
  }));
}

// --- Aktywność właścicieli (supabase/migrations/20261125000000_owner_activity.sql w repo spotto) ---

export type OwnerOverviewRow = {
  owner_id: string;
  place_id: string;
  place_name: string | null;
  display_name: string | null;
  username: string | null;
  account_created: string;
  last_sign_in: string | null;
  last_active: string | null;
  active_sessions: number;
  logins: number;
  active_days_30: number;
  changes_30: number;
  last_change: string | null;
  menu_items: number;
  deals: number;
  promotions: number;
  photos: number;
  tracking_since: string | null;
};

export type OwnerActivityEvent = {
  owner_id: string;
  kind: 'login' | 'active' | 'change';
  entity: string | null;
  action: string | null;
  detail: string | null;
  created_at: string;
};

/** null = migracja z dziennikiem jeszcze nie wgrana. */
export async function getOwnerOverview(): Promise<OwnerOverviewRow[] | null> {
  const { data, error } = await createClient().rpc('admin_owner_overview');
  if (error) { console.error('getOwnerOverview:', error.message); return null; }
  return data ?? [];
}

export async function getOwnerRecentActivity(ownerIds: string[]): Promise<OwnerActivityEvent[]> {
  if (!ownerIds.length) return [];
  const { data, error } = await createClient()
    .from('owner_activity')
    .select('owner_id, kind, entity, action, detail, created_at')
    .in('owner_id', ownerIds)
    .in('kind', ['login', 'change'])
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) { console.error('getOwnerRecentActivity:', error.message); return []; }
  return data ?? [];
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
  const ownerIds = Array.from(new Set(rows.map((r: any) => r.owner_id)));
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

// --- Deals ("Oferty dnia") ---
// Nie mylić z `promotions` (płatne wyróżnienie) — deals to cykliczne rabaty
// na dania po dniach tygodnia, zgłaszane przez właścicieli, admina lub userów.

export type DealRow = {
  id: string;
  place_id: string;
  owner_id: string | null;
  dish_name: string;
  price: number;
  original_price: number | null;
  days_of_week: string[];
  valid_until: string | null;
  status: 'pending' | 'approved' | 'rejected';
  source: 'owner' | 'admin' | 'user' | 'scraper';
  admin_note: string | null;
  created_at: string;
  place_name: string;
};

export async function getDeals(filter: 'all' | 'pending' = 'pending'): Promise<DealRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('deals')
    .select('id, place_id, owner_id, dish_name, price, original_price, days_of_week, valid_until, status, source, admin_note, created_at, places(name)')
    .order('created_at', { ascending: false });

  if (filter === 'pending') query = query.eq('status', 'pending');

  const { data, error } = await query;
  if (error) { console.error('getDeals:', error.message); return []; }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    place_id: row.place_id,
    owner_id: row.owner_id,
    dish_name: row.dish_name,
    price: row.price,
    original_price: row.original_price ?? null,
    days_of_week: row.days_of_week ?? [],
    valid_until: row.valid_until ?? null,
    status: row.status,
    source: row.source,
    admin_note: row.admin_note ?? null,
    created_at: row.created_at,
    place_name: row.places?.name ?? '—',
  }));
}

// --- Dish Category Suggestions ---

export type DishCategorySuggestionRow = {
  id: string;
  dish_name: string;
  suggested_name: string;
  occurrence_count: number;
  ai_verdict: { reasoning: string; confidence: 'high' | 'medium' | 'low' } | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  pr_url: string | null;
  resolved_category_id: string | null;
  created_at: string;
  place_name: string;
};

export async function getDishCategorySuggestions(filter: 'all' | 'pending' = 'pending'): Promise<DishCategorySuggestionRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('dish_category_suggestions')
    .select('id, dish_name, suggested_name, occurrence_count, ai_verdict, status, admin_note, pr_url, resolved_category_id, created_at, places(name)')
    .order('occurrence_count', { ascending: false })
    .order('created_at', { ascending: false });

  if (filter === 'pending') query = query.eq('status', 'pending');

  const { data, error } = await query;
  if (error) { console.error('getDishCategorySuggestions:', error.message); return []; }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    dish_name: row.dish_name,
    suggested_name: row.suggested_name,
    occurrence_count: row.occurrence_count,
    ai_verdict: row.ai_verdict ?? null,
    status: row.status,
    admin_note: row.admin_note ?? null,
    pr_url: row.pr_url ?? null,
    resolved_category_id: row.resolved_category_id ?? null,
    created_at: row.created_at,
    place_name: row.places?.name ?? '—',
  }));
}

export async function getGuideWithBlocks(id: string): Promise<{
  guide: import('./types').SpootGuide | null;
  blocks: import('./types').GuideBlock[];
}> {
  const supabase = createClient();
  const [guideRes, blocksRes] = await Promise.all([
    supabase.from('spoot_guides').select('*').eq('id', id).single(),
    supabase
      .from('guide_blocks')
      .select('*')
      .eq('guide_id', id)
      .order('position'),
  ]);

  const blocks: import('./types').GuideBlock[] = blocksRes.data ?? [];

  // Enrich place blocks with place data
  const placeIds = blocks
    .filter(b => b.type === 'place' && b.content?.place_id)
    .map(b => b.content.place_id);

  if (placeIds.length > 0) {
    const { data: places } = await supabase
      .from('places')
      .select('id, name, category, city')
      .in('id', placeIds);
    const placeMap = Object.fromEntries((places ?? []).map((p: any) => [p.id, p]));
    blocks.forEach(b => {
      if (b.type === 'place' && b.content?.place_id) {
        b.place = placeMap[b.content.place_id] ?? null;
      }
    });
  }

  return { guide: guideRes.data, blocks };
}

export async function getGuideStats(guideId: string): Promise<import('./types').GuideStats> {
  const supabase = createClient();
  const { data } = await supabase
    .from('guide_views')
    .select('user_id')
    .eq('guide_id', guideId);
  const rows = data ?? [];
  const uniqueReaders = new Set(rows.map((r: any) => r.user_id).filter(Boolean)).size;
  return { totalViews: rows.length, uniqueReaders };
}

