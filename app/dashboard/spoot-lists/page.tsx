import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSpootLists } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { AppCardPreview } from '@/components/AppCardPreview';
import { METROS } from '@/lib/metros';
import { plural } from '@/lib/plural';

async function createSpootList(formData: FormData) {
  'use server';
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return;
  const city = String(formData.get('city') ?? '') || null;
  const { data } = await createClient()
    .from('spoot_lists')
    .insert({ title, city })
    .select('id')
    .single();
  if (data?.id) redirect(`/dashboard/spoot-lists/${data.id}`);
}

const fieldClass = 'h-11 px-3.5 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm text-onSurface focus:outline-none focus:ring-2 focus:ring-secondary';
const labelClass = 'font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] uppercase text-onSurfaceVariant';

export default async function SpootListsPage() {
  const lists = await getSpootLists();
  const published = lists.filter((l: any) => l.is_published).length;

  return (
    <div className="max-w-[1160px] mx-auto">
      <PageHeader
        title="Listy Spoot"
        subtitle={`${lists.length} ${plural(lists.length, 'lista', 'listy', 'list')} · ${published} na Starcie`}
      />

      <form action={createSpootList} className="bg-cardMuted rounded-xl p-4 lg:p-5 mb-8 flex flex-wrap items-end gap-3">
        <label className="flex-[2_1_260px] flex flex-col gap-1.5">
          <span className={labelClass}>Nowa lista</span>
          <input name="title" required placeholder="np. Najlepszy ramen w Warszawie" className={fieldClass} />
        </label>
        <label className="flex-[1_1_180px] flex flex-col gap-1.5">
          <span className={labelClass}>Miasto</span>
          <select name="city" defaultValue="" className={fieldClass}>
            <option value="">Cała Polska</option>
            {METROS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <Button type="submit" className="flex-[1_1_auto] sm:flex-none">Utwórz i dodaj miejsca</Button>
      </form>

      {lists.length === 0 ? (
        <div className="bg-cardMuted rounded-xl px-6 py-10 text-center">
          <p className="font-heading font-semibold">Nie ma jeszcze list</p>
          <p className="text-sm text-onSurfaceVariant mt-1">Wpisz tytuł powyżej — od razu przejdziesz do dodawania miejsc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-4">
          {lists.map((list: any) => {
            const count = list.spoot_list_places?.[0]?.count ?? 0;
            return (
              <Link key={list.id} href={`/dashboard/spoot-lists/${list.id}`} className="group flex flex-col gap-2">
                <div className="transition-opacity group-hover:opacity-90">
                  <AppCardPreview title={list.title} coverUrl={list.cover_url} emoji={list.emoji} subtitle={`${count} ${plural(count, 'miejsce', 'miejsca', 'miejsc')}`} />
                </div>
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <span className="text-xs text-onSurfaceVariant truncate">{list.city ?? 'Cała Polska'}</span>
                  {list.is_published ? <Badge tone="success">Na Starcie</Badge> : <Badge tone="neutral">Szkic</Badge>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
