'use client';
import { useState } from 'react';
import type { GuideBlock, BlockInstruction } from '@/lib/types';

type Props = {
  block: GuideBlock;
  guideContext: { title: string; theme: string | null; isSponsored: boolean; sponsorName: string | null };
  onAccept: (newText: string) => void;
  onClose: () => void;
};

const INSTRUCTIONS: Array<{ key: string; label: string; sub?: Array<{ key: string; label: string }> }> = [
  { key: 'popraw', label: 'Popraw' },
  { key: 'rozwin', label: 'Rozwiń' },
  { key: 'skróć', label: 'Skróć' },
  {
    key: 'ton', label: 'Zmień ton', sub: [
      { key: 'formalny', label: 'Formalny' },
      { key: 'luźny', label: 'Luźny' },
      { key: 'magazynowy', label: 'Magazynowy' },
    ]
  },
];

export default function AIPopover({ block, guideContext, onAccept, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<{ old: string; new: string } | null>(null);

  const currentText = block.type === 'text' ? (block.content.body ?? '') : (block.content.text ?? '');

  async function runImprovement(instruction: string) {
    setLoading(true);
    setDiff(null);
    try {
      const res = await fetch('/api/ai/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockType: block.type,
          currentContent: currentText,
          instruction,
          guideContext,
        }),
      });
      const { text } = await res.json();
      setDiff({ old: currentText, new: text });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute right-0 top-6 z-50 bg-white border rounded-xl shadow-lg p-3 w-72">
      {!diff && !loading && (
        <div className="space-y-1">
          {INSTRUCTIONS.map(item => (
            item.sub ? (
              <div key={item.key}>
                <p className="text-xs text-gray-400 px-2 pt-1">{item.label}</p>
                {item.sub.map(s => (
                  <button
                    key={s.key}
                    onClick={() => runImprovement(s.key)}
                    className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-gray-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                key={item.key}
                onClick={() => runImprovement(item.key)}
                className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-gray-50"
              >
                {item.label}
              </button>
            )
          ))}
          <button onClick={onClose} className="w-full text-xs text-gray-400 pt-1 hover:text-gray-600">Anuluj</button>
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-400 text-center py-2">Generowanie...</p>
      )}

      {diff && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Podgląd zmiany:</p>
          <div className="text-xs bg-red-50 rounded p-2 line-through text-red-600 max-h-20 overflow-y-auto">
            {diff.old}
          </div>
          <div className="text-xs bg-green-50 rounded p-2 text-green-700 max-h-20 overflow-y-auto">
            {diff.new}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAccept(diff.new)}
              className="flex-1 text-sm bg-black text-white rounded-lg py-1.5"
            >
              Zaakceptuj
            </button>
            <button
              onClick={() => setDiff(null)}
              className="flex-1 text-sm border rounded-lg py-1.5"
            >
              Odrzuć
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
