'use client';

import { useState } from 'react';
import { markMenuRequestDone } from '@/app/actions/owner-requests';

type Props = {
  id: string;
  /** Domyślnie prośba o menu; lista pytań restauracji podaje własną akcję i tekst. */
  action?: (id: string) => Promise<{ error?: string }>;
  confirmText?: string;
  label?: string;
};

export default function DoneButton({
  id,
  action = markMenuRequestDone,
  confirmText = 'Oznaczyć prośbę jako zrobioną? Zrób to po dodaniu menu lokalu.',
  label = 'Zrobione',
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!confirm(confirmText)) return;
    setLoading(true);
    const result = await action(id);
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="min-h-9 px-3.5 rounded-lg bg-primary text-onPrimary text-sm font-heading font-semibold hover:bg-primaryLight disabled:opacity-50"
    >
      {loading ? '...' : label}
    </button>
  );
}
