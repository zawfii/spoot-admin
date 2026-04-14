'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AdminPlace } from '@/lib/types';

type PlaceResult = Pick<AdminPlace, 'id' | 'name' | 'city' | 'category'>;

interface Props {
  onSelect: (place: PlaceResult) => void;
  excludeIds?: string[];
  placeholder?: string;
}

export default function PlaceSearch({ onSelect, excludeIds = [], placeholder = 'Dodaj miejsce...' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('places')
        .select('id, name, city, category')
        .ilike('name', `%${query}%`)
        .limit(8);
      setResults((data ?? []).filter((p: PlaceResult) => !excludeIds.includes(p.id)));
    }, 200);
    return () => clearTimeout(timer);
  }, [query, excludeIds]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
          {results.map(place => (
            <button
              key={place.id}
              type="button"
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex justify-between items-center"
              onClick={() => { onSelect(place); setQuery(''); setOpen(false); }}
            >
              <span className="font-medium">{place.name}</span>
              <span className="text-gray-400 text-xs">{place.city} · {place.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
