'use client';
import { useEffect, useState } from 'react';
import type { GuideStats } from '@/lib/types';

type Props = {
  guideId: string;
  onClose: () => void;
};

export default function StatsModal({ guideId, onClose }: Props) {
  const [stats, setStats] = useState<GuideStats | null>(null);

  useEffect(() => {
    fetch(`/api/guides/${guideId}/stats`)
      .then(r => r.json())
      .then(setStats);
  }, [guideId]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-72 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-lg">Statystyki przewodnika</h2>
        {stats ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{stats.totalViews}</p>
              <p className="text-xs text-gray-400 mt-1">Wyświetlenia</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{stats.uniqueReaders}</p>
              <p className="text-xs text-gray-400 mt-1">Unikalni czytelnicy</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Ładowanie...</p>
        )}
        <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-800">Zamknij</button>
      </div>
    </div>
  );
}
