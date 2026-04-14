'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PlaceSearch from '@/components/PlaceSearch';
import BlockEditor from '@/components/guides/BlockEditor';
import StatsModal from '@/components/guides/StatsModal';
import type { SpootGuide, GuideBlock } from '@/lib/types';

const THEMES = ['ukryte perły', 'nowe miejsca', 'niedocenione', 'food tour', 'sponsorowany artykuł', 'inne'];

function toSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function GuideEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [guide, setGuide] = useState<SpootGuide | null>(null);
  const [blocks, setBlocks] = useState<GuideBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prevBlocks, setPrevBlocks] = useState<GuideBlock[] | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [guideRes, blocksRes] = await Promise.all([
      supabase.from('spoot_guides').select('*').eq('id', id).single(),
      supabase.from('guide_blocks').select('*').eq('guide_id', id).order('position'),
    ]);
    if (guideRes.data) setGuide(guideRes.data);
    const rawBlocks: GuideBlock[] = blocksRes.data ?? [];

    // Enrich place blocks
    const placeIds = rawBlocks.filter(b => b.type === 'place' && b.content?.place_id).map(b => b.content.place_id);
    if (placeIds.length > 0) {
      const { data: places } = await supabase.from('places').select('id, name, category, city').in('id', placeIds);
      const map = Object.fromEntries((places ?? []).map((p: any) => [p.id, p]));
      rawBlocks.forEach(b => {
        if (b.type === 'place') b.place = map[b.content.place_id] ?? null;
      });
    }
    setBlocks(rawBlocks);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!guide) return <div className="p-8 text-gray-400">Ładowanie...</div>;

  const guideContext = {
    title: guide.title,
    theme: guide.theme,
    isSponsored: guide.is_sponsored,
    sponsorName: guide.sponsor_name,
  };

  const placeBlocks = blocks.filter(b => b.type === 'place' && b.place);
  const canGenerate = guide.title.trim().length > 0 && placeBlocks.length >= 2;

  async function handleSave() {
    if (!guide) return;
    setSaving(true);
    const supabase = createClient();

    // Get current user to set author_id if not already set
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('spoot_guides').update({
      title: guide.title,
      slug: guide.slug,
      city: guide.city,
      theme: guide.theme,
      cover_url: guide.cover_url,
      is_published: guide.is_published,
      is_sponsored: guide.is_sponsored,
      sponsor_name: guide.sponsor_name,
      sponsor_logo: guide.sponsor_logo,
      // Set author_id only on first save (when null)
      ...(guide.author_id === null && user ? { author_id: user.id } : {}),
    }).eq('id', guide.id);

    // Validate place blocks have real place_ids
    const validBlocks = blocks.filter(b => b.type !== 'place' || !!b.content?.place_id);

    // Delete all existing blocks, insert fresh
    await supabase.from('guide_blocks').delete().eq('guide_id', id);
    if (validBlocks.length > 0) {
      await supabase.from('guide_blocks').insert(
        validBlocks.map((b, pos) => ({
          guide_id: id,
          position: pos,
          type: b.type,
          content: b.content,
        }))
      );
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddPlace(place: { id: string; name: string; category: string; city: string | null }) {
    const newBlock: GuideBlock = {
      id: crypto.randomUUID(),
      guide_id: id,
      position: blocks.length,
      type: 'place',
      content: { place_id: place.id },
      place: { id: place.id, name: place.name, category: place.category, city: place.city },
    };
    setBlocks(prev => [...prev, newBlock]);
  }

  async function handleGenerateAI() {
    if (!canGenerate) return;
    setPrevBlocks(blocks);
    setIsGenerating(true);
    try {
      const placeMap = Object.fromEntries(
        placeBlocks.map(b => [b.place!.name, b.content.place_id])
      );
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: guide.title,
          theme: guide.theme,
          city: guide.city,
          isSponsored: guide.is_sponsored,
          sponsorName: guide.sponsor_name,
          places: placeBlocks.map(b => ({
            name: b.place!.name,
            category: b.place!.category,
            district: null,
          })),
          placeMap,
        }),
      });
      const { blocks: generated } = await res.json();
      setBlocks(
        generated.map((b: any, i: number) => ({
          id: crypto.randomUUID(),
          guide_id: id,
          position: i,
          type: b.type,
          content: b.content,
          place: b.type === 'place'
            ? placeBlocks.find(pb => pb.content.place_id === b.content.place_id)?.place ?? null
            : undefined,
        }))
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      {showStats && <StatsModal guideId={id} onClose={() => setShowStats(false)} />}

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900">←</button>
        <h1 className="text-2xl font-bold">Edytuj przewodnik</h1>
        {prevBlocks && (
          <button
            onClick={() => { setBlocks(prevBlocks); setPrevBlocks(null); }}
            className="ml-auto text-sm text-amber-600 hover:text-amber-800"
          >
            ↩ Cofnij generowanie AI
          </button>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {/* LEFT PANEL — Metadata */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tytuł</label>
              <input
                value={guide.title}
                onChange={e => setGuide(g => g ? { ...g, title: e.target.value, slug: toSlug(e.target.value) } : g)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Slug</label>
              <input
                value={guide.slug}
                onChange={e => setGuide(g => g ? { ...g, slug: e.target.value } : g)}
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Miasto</label>
                <input
                  value={guide.city ?? ''}
                  onChange={e => setGuide(g => g ? { ...g, city: e.target.value || null } : g)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tematyka</label>
                <select
                  value={guide.theme ?? ''}
                  onChange={e => setGuide(g => g ? { ...g, theme: e.target.value || null } : g)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">—</option>
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">URL okładki</label>
              <input
                value={guide.cover_url ?? ''}
                onChange={e => setGuide(g => g ? { ...g, cover_url: e.target.value || null } : g)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {guide.cover_url && (
                <img src={guide.cover_url} alt="cover" className="mt-2 w-full h-24 object-cover rounded-lg" />
              )}
            </div>

            {/* Sponsored toggle */}
            <div className="border-t pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guide.is_sponsored}
                  onChange={e => setGuide(g => g ? { ...g, is_sponsored: e.target.checked } : g)}
                />
                <span className="text-sm font-medium">Sponsorowany</span>
              </label>
              {guide.is_sponsored && (
                <div className="mt-2 space-y-2">
                  <input
                    value={guide.sponsor_name ?? ''}
                    onChange={e => setGuide(g => g ? { ...g, sponsor_name: e.target.value || null } : g)}
                    placeholder="Nazwa sponsora"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <input
                    value={guide.sponsor_logo ?? ''}
                    onChange={e => setGuide(g => g ? { ...g, sponsor_logo: e.target.value || null } : g)}
                    placeholder="URL logo sponsora"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              )}
            </div>

            {/* Published */}
            <div className="border-t pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guide.is_published}
                  onChange={e => setGuide(g => g ? { ...g, is_published: e.target.checked } : g)}
                />
                <span className="text-sm font-medium">Opublikowany</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saved ? 'Zapisano ✓' : saving ? 'Zapis...' : 'Zapisz'}
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                title="Statystyki"
              >
                📊
              </button>
            </div>
          </div>

          {/* Place search — adds place block */}
          <div className="bg-white rounded-2xl border p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Dodaj miejsce do bloku</p>
            <PlaceSearch
              onSelect={(place: any) => handleAddPlace(place)}
              excludeIds={blocks.filter(b => b.type === 'place').map(b => b.content.place_id)}
            />
          </div>
        </div>

        {/* RIGHT PANEL — Block Editor */}
        <div className="flex-1 bg-white rounded-2xl border p-6 min-h-96">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Treść przewodnika</h2>
            <span className="text-xs text-gray-400">{blocks.length} bloków</span>
          </div>
          <BlockEditor
            blocks={blocks}
            guideId={id}
            guideContext={guideContext}
            onChange={setBlocks}
            onGenerateAI={handleGenerateAI}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
          />
        </div>
      </div>
    </div>
  );
}
