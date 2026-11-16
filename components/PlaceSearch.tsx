'use client';
import { useEffect, useState, KeyboardEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { METROS } from '@/lib/metros';
import { Icon } from '@/components/Icon';

export type PlaceResult = { id: string; name: string; city: string | null; category: string; address: string | null };

interface Props {
  onSelect: (place: PlaceResult) => void;
  excludeIds?: string[];
  placeholder?: string;
  /** Zawęża wyniki do miasta aplikacji (places.metro); użytkownik może zmienić. */
  defaultMetro?: string | null;
  autoFocus?: boolean;
}

const fieldClass = 'h-11 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm text-onSurface focus:outline-none focus:ring-2 focus:ring-secondary';

export default function PlaceSearch({ onSelect, excludeIds = [], placeholder = 'Szukaj miejsca po nazwie…', defaultMetro = null, autoFocus }: Props) {
  const [query, setQuery] = useState('');
  const [metro, setMetro] = useState(defaultMetro ?? '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMetro(defaultMetro ?? ''), [defaultMetro]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      let req = createClient().from('places').select('id, name, city, category, address').ilike('name', `%${q}%`).order('name').limit(12);
      if (metro) req = req.eq('metro', metro);
      const { data } = await req;
      if (cancelled) return;
      setResults(data ?? []);
      setActive(0);
      setLoading(false);
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, metro]);

  const visible = results.filter(p => !excludeIds.includes(p.id));

  function select(place: PlaceResult) {
    onSelect(place);
    setQuery('');
    setResults([]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, visible.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (visible[active]) select(visible[active]); }
    else if (e.key === 'Escape') { setQuery(''); }
  }

  const searching = query.trim().length >= 2;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-[1_1_220px] text-onSurfaceVariant">
          <Icon name="search" size={18} className="absolute left-3.5 top-[13px]" />
          <input
            type="search"
            aria-label="Szukaj miejsca"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`w-full pl-10 pr-3.5 ${fieldClass}`}
          />
        </div>
        <select aria-label="Miasto wyszukiwania" value={metro} onChange={e => setMetro(e.target.value)} className={`px-3 ${fieldClass}`}>
          <option value="">Cała Polska</option>
          {METROS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      {searching && (
        <ul role="listbox" aria-label="Wyniki" className="rounded-lg bg-surfaceLowest border border-outlineVariant max-h-80 overflow-y-auto">
          {visible.length === 0 ? (
            <li className="px-4 py-3 text-sm text-onSurfaceVariant">
              {loading ? 'Szukam…' : `Nic nie znaleziono${metro ? ` (${metro})` : ''}. Spróbuj innej nazwy albo „Cała Polska”.`}
            </li>
          ) : visible.map((place, i) => (
            <li key={place.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => select(place)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 ${i === active ? 'bg-cardMuted' : ''}`}
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-heading font-semibold text-sm truncate">{place.name}</span>
                  <span className="block text-xs text-onSurfaceVariant truncate">
                    {[place.category, place.address ?? place.city].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-primary">
                  <Icon name="plus" size={14} />Dodaj
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
