'use client';

import { useState } from 'react';
import { SingleLocationForm } from './SingleLocationForm';
import { BulkImportForm } from './BulkImportForm';

export function AddLocationPanel(props: {
  states: { id: string; label: string }[];
}) {
  const [tab, setTab] = useState<'single' | 'bulk'>('single');

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
        <button
          type="button"
          onClick={() => setTab('single')}
          className={
            'flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ' +
            (tab === 'single'
              ? 'bg-white/[0.08] text-white'
              : 'text-white/50 hover:bg-white/[0.04] hover:text-white')
          }
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => setTab('bulk')}
          className={
            'flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ' +
            (tab === 'bulk'
              ? 'bg-white/[0.08] text-white'
              : 'text-white/50 hover:bg-white/[0.04] hover:text-white')
          }
        >
          Bulk import
        </button>
      </div>

      {tab === 'single' ? (
        <SingleLocationForm states={props.states} />
      ) : (
        <BulkImportForm />
      )}
    </div>
  );
}
