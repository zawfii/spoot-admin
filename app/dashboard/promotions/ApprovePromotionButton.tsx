'use client';

import { useState } from 'react';
import { approvePromotion } from '@/app/actions/promotions';

export default function ApprovePromotionButton({ promotionId }: { promotionId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    if (!confirm('Zatwierdzić wyróżnienie? Lokal stanie się aktywnie sponsorowany.')) return;
    setLoading(true);
    const result = await approvePromotion(promotionId);
    setLoading(false);
    if (result.error) alert(`Błąd: ${result.error}`);
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="min-h-9 px-3.5 rounded-lg bg-primary text-onPrimary text-sm font-heading font-semibold hover:bg-primaryLight disabled:opacity-50"
    >
      {loading ? '...' : 'Zatwierdź'}
    </button>
  );
}
