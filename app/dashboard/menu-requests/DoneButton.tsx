'use client';

import { useState } from 'react';
import { markMenuRequestDone } from '@/app/actions/owner-requests';

export default function DoneButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm('Oznaczyć prośbę jako zrobioną? Zrób to po dodaniu menu lokalu.')) return;
    setLoading(true);
    const result = await markMenuRequestDone(id);
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="min-h-9 px-3.5 rounded-lg bg-primary text-onPrimary text-sm font-heading font-semibold hover:bg-primaryLight disabled:opacity-50"
    >
      {loading ? '...' : 'Zrobione'}
    </button>
  );
}
