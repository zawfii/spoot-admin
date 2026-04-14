import Link from 'next/link';
import { getSpootLists } from '@/lib/queries';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function createSpootList(formData: FormData) {
  'use server';
  const title = formData.get('title') as string;
  if (!title?.trim()) return;
  const supabase = createClient();
  const { data } = await supabase
    .from('spoot_lists')
    .insert({ title: title.trim() })
    .select('id')
    .single();
  if (data?.id) redirect(`/dashboard/spoot-lists/${data.id}`);
}

export default async function SpootListsPage() {
  const lists = await getSpootLists();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Listy Spoot</h1>
        <form action={createSpootList} className="flex gap-2">
          <input
            name="title"
            placeholder="Nazwa nowej listy..."
            required
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm">
            + Nowa lista
          </button>
        </form>
      </div>

      <div className="grid gap-3">
        {lists.map((list: any) => (
          <Link
            key={list.id}
            href={`/dashboard/spoot-lists/${list.id}`}
            className="bg-white border rounded-2xl px-5 py-4 flex items-center justify-between hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{list.emoji ?? '📋'}</span>
              <div>
                <div className="font-medium">{list.title}</div>
                <div className="text-sm text-gray-400">{list.city ?? 'Wszystkie miasta'}</div>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${list.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {list.is_published ? 'Live' : 'Draft'}
            </span>
          </Link>
        ))}
        {lists.length === 0 && (
          <div className="text-center text-gray-400 py-12">Brak list. Utwórz pierwszą.</div>
        )}
      </div>
    </div>
  );
}
