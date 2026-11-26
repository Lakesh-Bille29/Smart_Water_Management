import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { X, Check } from 'lucide-react';

interface Props {
  sourceLabel: string;
  targetLabel: string;
  onConfirm: (weight: number) => string | null;
  onCancel: () => void;
}

export default function InlinePipeModal({
  sourceLabel,
  targetLabel,
  onConfirm,
  onCancel,
}: Props) {
  const [weight, setWeight] = useState('3');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [sourceLabel, targetLabel]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const w = parseInt(weight, 10);
    if (!Number.isFinite(w) || w <= 0) {
      setError('Enter a positive integer weight.');
      return;
    }
    const err = onConfirm(w);
    if (err) {
      setError(err);
    }
  }

  return (
    <div
      className="absolute top-3.5 left-1/2 -translate-x-1/2"
      style={{
        zIndex: 25,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
        padding: '10px 12px',
        minWidth: '280px',
      }}
    >
      <form onSubmit={submit} className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#0F172A' }}>
            <span>Connect Pipe:</span>
            <span className="chip chip-blue">{sourceLabel}</span>
            <span style={{ color: '#64748B' }}>—</span>
            <span className="chip chip-blue">{targetLabel}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost p-1 rounded cursor-pointer"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="inline-pipe-weight"
            className="text-xs shrink-0"
            style={{ color: '#64748B' }}
          >
            Cost / Weight
          </label>
          <input
            id="inline-pipe-weight"
            ref={inputRef}
            type="number"
            min={1}
            step={1}
            value={weight}
            onChange={e => {
              setWeight(e.target.value);
              setError(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') onCancel();
            }}
            className="input mono"
            style={{ width: '80px' }}
          />
          <button type="submit" className="btn btn-primary ml-auto">
            <Check size={13} />
            <span>Create</span>
          </button>
        </div>

        {error && (
          <div style={{ fontSize: '11px', color: '#DC2626' }}>{error}</div>
        )}
      </form>
    </div>
  );
}
