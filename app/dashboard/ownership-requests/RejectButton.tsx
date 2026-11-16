'use client';

import { useState } from 'react';
import RejectModal from './RejectModal';
import { Button } from '@/components/ui/Button';

export default function RejectButton({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} className="flex-1">
        Odrzuć
      </Button>
      {open && <RejectModal requestId={requestId} onClose={() => setOpen(false)} />}
    </>
  );
}
