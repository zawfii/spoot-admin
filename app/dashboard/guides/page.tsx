import Link from 'next/link';
import { getGuides } from '@/lib/queries';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function createGuide(formData: FormData) {
  'use server';
  const title = formData.get('title') as string;
  if (!title?.trim()) return;
  const supabase = createClient();
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  const { data } = await supabase
    .from('spoot_guides')
    .insert({ title: title.trim(), slug })
    .select('id')
    .single();
  if (data?.id) redirect(`/dashboard/guides/${data.id}`);
}

const THEMES = ['ukryte perły', 'nowe miejsca', 'niedocenione', 'food tour', 'inne'];

export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Przewodniki Spoot</h1>
        <form action={createGuide} className="flex gap-2">
          <input name="title" placeholder="Tytuł przewodnika..." required
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm">
            + Nowy przewodnik
          </button>
        </form>
      </div>

      <div className="grid gap-3">
        {guides.map((guide: any) => (
          <Link key={guide.id} href={`/dashboard/guides/${guide.id}`}
            className="bg-white border rounded-2xl px-5 py-4 flex items-center justify-between hover:border-gray-400 transition-colors">
            <div>
              <div className="font-medium">{guide.title}</div>
              <div className="text-sm text-gray-400 mt-0.5">
                {guide.theme && <span className="mr-2">#{guide.theme}</span>}
                {guide.city ?? 'Wszystkie miasta'}
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${guide.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {guide.is_published ? 'Live' : 'Draft'}
            </span>
          </Link>
        ))}
        {guides.length === 0 && (
          <div className="text-center text-gray-400 py-12">Brak przewodników. Utwórz pierwszy.</div>
        )}
      </div>
    </div>
  );
}
