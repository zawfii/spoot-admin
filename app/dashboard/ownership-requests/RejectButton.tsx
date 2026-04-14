'use client';

import { useState } from 'react';
import RejectModal from './RejectModal';

export default function RejectButton({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs hover:bg-red-200"
      >
        Odrzuć
      </button>
      {open && <RejectModal requestId={requestId} onClose={() => setOpen(false)} />}
    </>
  );
}
