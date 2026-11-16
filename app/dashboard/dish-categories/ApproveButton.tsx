'use client';

import { useState } from 'react';
import { approveDishCategorySuggestion } from '@/app/actions/dish-categories';

export default function ApproveButton({ suggestionId }: { suggestionId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    if (!confirm('Wygenerować ikonę i otworzyć PR z nową kategorią? To zajmie kilkanaście sekund.')) return;
    setLoading(true);
    const result = await approveDishCategorySuggestion(suggestionId);
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="min-h-9 px-3.5 rounded-lg bg-primary text-onPrimary text-sm font-heading font-semibold hover:bg-primaryLight disabled:opacity-50"
    >
      {loading ? 'Generuję...' : 'Zatwierdź'}
    </button>
  );
}
