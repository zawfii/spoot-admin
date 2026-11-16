'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BlockEditor from '@/components/guides/BlockEditor';
import StatsModal from '@/components/guides/StatsModal';
import { AppCardPreview } from '@/components/AppCardPreview';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/Icon';
import { METROS } from '@/lib/metros';
import { GUIDE_THEMES } from '@/lib/guides';
import { plural } from '@/lib/plural';
import { toSlug } from '@/lib/slug';
import type { SpootGuide, GuideBlock } from '@/lib/types';

const fieldClass = 'w-full h-11 px-3.5 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm text-onSurface focus:outline-none focus:ring-2 focus:ring-secondary';
const labelClass = 'font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] uppercase text-onSurfaceVariant';

const fieldsOf = (g: SpootGuide) => ({
  title: g.title, slug: g.slug, city: g.city, theme: g.theme, cover_url: g.cover_url,
  is_sponsored: g.is_sponsored, sponsor_name: g.sponsor_name, sponsor_logo: g.sponsor_logo,
});
const snapshotOf = (g: SpootGuide, blocks: GuideBlock[]) =>
  JSON.stringify({ g: fieldsOf(g), b: blocks.map(b => [b.id, b.type, b.content]) });

export default function GuideEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [guide, setGuide] = useState<SpootGuide | null>(null);
  const [blocks, setBlocks] = useState<GuideBlock[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prevBlocks, setPrevBlocks] = useState<GuideBlock[] | null>(null);

  const flash = (tone: 'ok' | 'error', text: string) => {
    setMessage({ tone, text });
    if (tone === 'ok') setTimeout(() => setMessage(null), 2500);
  };

  const load = useCallback(async () => {
    const [guideRes, blocksRes] = await Promise.all([
      supabase.from('spoot_guides').select('*').eq('id', id).single(),
      supabase.from('guide_blocks').select('*').eq('guide_id', id).order('position'),
    ]);
    const raw: GuideBlock[] = blocksRes.data ?? [];
    const placeIds = raw.filter(b => b.type === 'place' && b.content?.place_id).map(b => b.content.place_id);
    if (placeIds.length) {
      const { data: places } = await supabase.from('places').select('id, name, category, city, address').in('id', placeIds);
      const byId = Object.fromEntries((places ?? []).map((p: any) => [p.id, p]));
      raw.forEach(b => { if (b.type === 'place') b.place = byId[b.content.place_id] ?? null; });
    }
    if (guideRes.data) {
      setGuide(guideRes.data);
      setSavedSnapshot(snapshotOf(guideRes.data, raw));
    }
    setBlocks(raw);
  }, [id, supabase]);

  useEffect(() => { load(); }, [load]);

  const dirty = !!guide && snapshotOf(guide, blocks) !== savedSnapshot;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!guide) return <p className="text-onSurfaceVariant">Ładowanie…</p>;

  const set = (patch: Partial<SpootGuide>) => setGuide(g => (g ? { ...g, ...patch } : g));
  const placeBlocks = blocks.filter(b => b.type === 'place' && b.place);
  const canGenerate = guide.title.trim().length > 0 && placeBlocks.length >= 2;
  const guideContext = { title: guide.title, theme: guide.theme, isSponsored: guide.is_sponsored, sponsorName: guide.sponsor_name };

  async function save(extra: Partial<SpootGuide> = {}) {
    if (!guide) return;
    if (!guide.title.trim()) { flash('error', 'Przewodnik musi mieć tytuł.'); return; }
    if (!guide.slug.trim()) { flash('error', 'Slug nie może być pusty.'); return; }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const fields = { ...fieldsOf(guide), title: guide.title.trim(), ...extra, ...(guide.author_id === null && user ? { author_id: user.id } : {}) };
    const { error: guideError } = await supabase.from('spoot_guides').update(fields).eq('id', guide.id);
    if (guideError) {
      setBusy(false);
      flash('error', guideError.code === '23505' ? 'Ten slug jest już zajęty — zmień go w „Adres w aplikacji”.' : `Nie zapisano: ${guideError.message}`);
      return;
    }

    // Najpierw upsert bloków, potem usunięcie tych, których już nie ma —
    // przy błędzie stara treść zostaje (wcześniej było kasowanie wszystkiego i wstawianie od nowa).
    const rows = blocks
      .filter(b => b.type !== 'place' || !!b.content?.place_id)
      .map((b, position) => ({ id: b.id, guide_id: id, position, type: b.type, content: b.content }));
    const { error: upsertError } = rows.length ? await supabase.from('guide_blocks').upsert(rows) : { error: null };
    if (upsertError) { setBusy(false); flash('error', `Nie zapisano treści: ${upsertError.message}`); return; }
    let cleanup = supabase.from('guide_blocks').delete().eq('guide_id', id);
    if (rows.length) cleanup = cleanup.not('id', 'in', `(${rows.map(r => r.id).join(',')})`);
    const { error: cleanupError } = await cleanup;
    setBusy(false);
    if (cleanupError) { flash('error', `Treść zapisana, ale nie usunięto starych bloków: ${cleanupError.message}`); return; }

    const merged = { ...guide, ...fields };
    const keptBlocks = blocks.filter(b => b.type !== 'place' || !!b.content?.place_id);
    setGuide(merged);
    setBlocks(keptBlocks);
    setSavedSnapshot(snapshotOf(merged, keptBlocks));
    flash('ok', extra.is_published === true ? 'Opublikowano — przewodnik jest w aplikacji.' : extra.is_published === false ? 'Wycofano z aplikacji.' : 'Zapisano.');
  }

  async function handleGenerateAI() {
    if (!guide || !canGenerate) return;
    setPrevBlocks(blocks);
    setIsGenerating(true);
    try {
      const placeMap = Object.fromEntries(placeBlocks.map(b => [b.place!.name, b.content.place_id]));
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: guide.title,
          theme: guide.theme,
          city: guide.city,
          isSponsored: guide.is_sponsored,
          sponsorName: guide.sponsor_name,
          places: placeBlocks.map(b => ({ name: b.place!.name, category: b.place!.category, district: null })),
          placeMap,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { blocks: generated } = await res.json();
      setBlocks(generated.map((b: any, i: number) => ({
        id: crypto.randomUUID(),
        guide_id: id,
        position: i,
        type: b.type,
        content: b.content,
        place: b.type === 'place' ? placeBlocks.find(pb => pb.content.place_id === b.content.place_id)?.place ?? null : undefined,
      })));
    } catch (e) {
      setPrevBlocks(null);
      flash('error', `AI nie napisało artykułu (${e instanceof Error ? e.message : 'błąd'}). Spróbuj jeszcze raz.`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function deleteGuide() {
    if (!guide || !confirm(`Usunąć przewodnik „${guide.title}” razem z treścią? Tego nie da się cofnąć.`)) return;
    const { error } = await supabase.from('spoot_guides').delete().eq('id', guide.id);
    if (error) { flash('error', `Nie usunięto: ${error.message}`); return; }
    router.push('/dashboard/guides');
    router.refresh();
  }

  return (
    <div className="max-w-[1160px] mx-auto">
      {showStats && <StatsModal guideId={id} onClose={() => setShowStats(false)} />}

      <Link href="/dashboard/guides" className="inline-flex items-center gap-1 min-h-9 text-sm font-heading font-semibold text-onSurfaceVariant hover:text-onSurface mb-2">
        <Icon name="chevron" size={16} className="rotate-180" />Przewodniki
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-heading font-bold text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 truncate">{guide.title.trim() || 'Bez tytułu'}</h1>
          {guide.is_published ? <Badge tone="success">W aplikacji</Badge> : <Badge tone="neutral">Szkic</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={dirty ? 'primary' : 'ghost'} onClick={() => save()} disabled={!dirty || busy}>
            {busy ? 'Zapisuję…' : dirty ? 'Zapisz' : 'Zapisane'}
          </Button>
          {guide.is_published ? (
            <Button variant="ghost" onClick={() => save({ is_published: false })} disabled={busy}>Wycofaj z aplikacji</Button>
          ) : (
            <Button variant="secondary" onClick={() => save({ is_published: true })} disabled={busy || blocks.length === 0}>Opublikuj</Button>
          )}
        </div>
      </div>

      {message && (
        <p role="status" className={`mb-4 rounded-md px-4 py-3 text-sm font-medium ${message.tone === 'error' ? 'bg-red-100' : 'bg-ratedSurface'}`}>{message.text}</p>
      )}
      {prevBlocks && (
        <div className="mb-4 rounded-md px-4 py-3 text-sm bg-secondaryFixed flex flex-wrap items-center justify-between gap-2">
          <span>AI podmieniło treść. Przejrzyj ją i zapisz — albo wróć do poprzedniej wersji.</span>
          <button type="button" onClick={() => { setBlocks(prevBlocks); setPrevBlocks(null); }} className="min-h-9 px-3 rounded-md font-heading font-semibold text-primary hover:bg-white/50">
            Cofnij zmiany AI
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <section aria-labelledby="content-h" className="bg-cardMuted rounded-xl p-4 lg:p-5 flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="content-h" className="font-heading font-bold text-lg">Treść</h2>
            <span className="text-sm text-onSurfaceVariant">
              {placeBlocks.length} {plural(placeBlocks.length, 'miejsce', 'miejsca', 'miejsc')} · {blocks.length} {plural(blocks.length, 'blok', 'bloki', 'bloków')}
            </span>
          </div>
          <BlockEditor
            blocks={blocks}
            guideId={id}
            metro={guide.city}
            guideContext={guideContext}
            onChange={setBlocks}
            onGenerateAI={handleGenerateAI}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
          />
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section aria-labelledby="settings-h" className="bg-cardMuted rounded-xl p-4 lg:p-5 flex flex-col gap-3.5">
            <h2 id="settings-h" className="font-heading font-bold text-lg">Ustawienia</h2>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Tytuł</span>
              <input
                value={guide.title}
                // W szkicu adres podąża za tytułem; po publikacji zostaje, żeby nie psuć linków.
                onChange={e => set(guide.is_published ? { title: e.target.value } : { title: e.target.value, slug: toSlug(e.target.value) })}
                className={fieldClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Miasto</span>
                <select value={guide.city ?? ''} onChange={e => set({ city: e.target.value || null })} className={fieldClass}>
                  <option value="">Cała Polska</option>
                  {METROS.map(m => <option key={m} value={m}>{m}</option>)}
                  {guide.city && !METROS.includes(guide.city) && <option value={guide.city}>{guide.city}</option>}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Tematyka</span>
                <select value={guide.theme ?? ''} onChange={e => set({ theme: e.target.value || null })} className={fieldClass}>
                  <option value="">—</option>
                  {GUIDE_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Okładka — adres zdjęcia</span>
              <input value={guide.cover_url ?? ''} onChange={e => set({ cover_url: e.target.value.trim() || null })} placeholder="https://…" className={fieldClass} />
            </label>
            <div className="w-[160px]">
              <AppCardPreview title={guide.title} coverUrl={guide.cover_url} subtitle={`${placeBlocks.length} ${plural(placeBlocks.length, 'miejsce', 'miejsca', 'miejsc')}`} />
            </div>

            <label className="flex items-center gap-3 min-h-11 cursor-pointer">
              <input type="checkbox" checked={guide.is_sponsored} onChange={e => set({ is_sponsored: e.target.checked })} className="w-5 h-5 accent-primary" />
              <span className="text-sm font-medium">Sponsorowany (w aplikacji z oznaczeniem)</span>
            </label>
            {guide.is_sponsored && (
              <div className="flex flex-col gap-2">
                <input aria-label="Nazwa sponsora" value={guide.sponsor_name ?? ''} onChange={e => set({ sponsor_name: e.target.value || null })} placeholder="Nazwa sponsora" className={fieldClass} />
                <input aria-label="Logo sponsora" value={guide.sponsor_logo ?? ''} onChange={e => set({ sponsor_logo: e.target.value.trim() || null })} placeholder="Adres logo sponsora (https://…)" className={fieldClass} />
              </div>
            )}

            <details className="group">
              <summary className="cursor-pointer min-h-9 flex items-center text-sm font-heading font-semibold text-primary">Adres w aplikacji (slug)</summary>
              <input aria-label="Slug" value={guide.slug} onChange={e => set({ slug: toSlug(e.target.value) })} className={`${fieldClass} font-mono mt-1`} />
              {guide.is_published && <p className="text-xs text-onSurfaceVariant mt-1">Przewodnik jest opublikowany — zmiana adresu zepsuje udostępnione linki.</p>}
            </details>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => setShowStats(true)}><Icon name="chart" size={16} />Statystyki</Button>
            <Button variant="danger" onClick={deleteGuide}><Icon name="trash" size={16} />Usuń</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
