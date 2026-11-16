'use client';

import { useState } from 'react';
import RejectModal from './RejectModal';

export default function RejectButton({ suggestionId }: { suggestionId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="min-h-9 px-3.5 rounded-lg border border-primary/25 text-primary text-sm font-heading font-semibold hover:bg-surfaceLow"
      >
        Odrzuć
      </button>
      {open && <RejectModal suggestionId={suggestionId} onClose={() => setOpen(false)} />}
    </>
  );
}
