import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getGuides } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppCardPreview } from '@/components/AppCardPreview';
import { METROS } from '@/lib/metros';
import { GUIDE_THEMES } from '@/lib/guides';
import { plural } from '@/lib/plural';
import { toSlug } from '@/lib/slug';

async function createGuide(formData: FormData) {
  'use server';
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;
  const city = String(formData.get('city') ?? '') || null;
  const theme = String(formData.get('theme') ?? '') || null;
  // Sufiks, bo slug jest unikalny; w szkicu edytor i tak przelicza go z tytułu.
  const slug = `${toSlug(title) || 'przewodnik'}-${Date.now().toString(36)}`;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from('spoot_guides')
    .insert({ title, slug, city, theme, author_id: user?.id ?? null })
    .select('id')
    .single();
  if (data?.id) redirect(`/dashboard/guides/${data.id}`);
}

const fieldClass = 'h-11 px-3.5 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm text-onSurface focus:outline-none focus:ring-2 focus:ring-secondary';
const labelClass = 'font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] uppercase text-onSurfaceVariant';

export default async function GuidesPage() {
  const guides = await getGuides();
  const published = guides.filter((g: any) => g.is_published).length;

  return (
    <div className="max-w-[1160px] mx-auto">
      <PageHeader
        title="Przewodniki Spoot"
        subtitle={`${guides.length} ${plural(guides.length, 'przewodnik', 'przewodniki', 'przewodników')} · ${published} w aplikacji`}
      />

      <form action={createGuide} className="bg-cardMuted rounded-xl p-4 lg:p-5 mb-8 flex flex-wrap items-end gap-3">
        <label className="flex-[2_1_260px] flex flex-col gap-1.5">
          <span className={labelClass}>Nowy przewodnik</span>
          <input name="title" required placeholder="np. Ukryte perły Mokotowa" className={fieldClass} />
        </label>
        <label className="flex-[1_1_160px] flex flex-col gap-1.5">
          <span className={labelClass}>Miasto</span>
          <select name="city" defaultValue="" className={fieldClass}>
            <option value="">Cała Polska</option>
            {METROS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="flex-[1_1_160px] flex flex-col gap-1.5">
          <span className={labelClass}>Tematyka</span>
          <select name="theme" defaultValue="" className={fieldClass}>
            <option value="">—</option>
            {GUIDE_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <Button type="submit" className="flex-[1_1_auto] sm:flex-none">Utwórz i pisz</Button>
      </form>

      {guides.length === 0 ? (
        <div className="bg-cardMuted rounded-xl px-6 py-10 text-center">
          <p className="font-heading font-semibold">Nie ma jeszcze przewodników</p>
          <p className="text-sm text-onSurfaceVariant mt-1">Wpisz tytuł powyżej — od razu przejdziesz do edytora.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-4">
          {guides.map((guide: any) => {
            const places = (guide.guide_blocks ?? []).filter((b: any) => b.type === 'place').length;
            return (
              <Link key={guide.id} href={`/dashboard/guides/${guide.id}`} className="group flex flex-col gap-2">
                <div className="transition-opacity group-hover:opacity-90">
                  <AppCardPreview title={guide.title} coverUrl={guide.cover_url} subtitle={`${places} ${plural(places, 'miejsce', 'miejsca', 'miejsc')}`} />
                </div>
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <span className="text-xs text-onSurfaceVariant truncate">
                    {[guide.city ?? 'Cała Polska', guide.theme].filter(Boolean).join(' · ')}
                  </span>
                  {guide.is_published ? <Badge tone="success">W aplikacji</Badge> : <Badge tone="neutral">Szkic</Badge>}
                </div>
                {guide.is_sponsored && <Badge tone="brand" className="self-start">Sponsorowany</Badge>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
