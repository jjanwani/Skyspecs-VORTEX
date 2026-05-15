'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option { value: string; label: string }

interface InlineEditProps {
  value: string | number;
  onSave: (val: string) => void;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'toggle';
  options?: Option[];
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  emptyLabel?: string;
  disabled?: boolean;
}

export default function InlineEdit({
  value, onSave, type = 'text', options, placeholder, className,
  displayClassName, emptyLabel = '—', disabled = false,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(String(value)); setEditing(false); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') commit();
    if (e.key === 'Escape') cancel();
  };

  if (disabled) {
    return (
      <span className={cn(displayClassName)}>
        {value !== '' && value !== null && value !== undefined ? String(value) : emptyLabel}
      </span>
    );
  }

  if (editing) {
    const inputCls = 'bg-gray-700 border border-blue-500 rounded px-2 py-0.5 text-white text-xs focus:outline-none';
    return (
      <div className={cn('flex items-center gap-1', className)} onClick={e => e.stopPropagation()}>
        {type === 'select' ? (
          <select ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKey} className={cn(inputCls, 'pr-6')}>
            {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKey} rows={2} placeholder={placeholder}
            className={cn(inputCls, 'resize-none w-full min-w-[160px]')} />
        ) : (
          <input ref={inputRef} type={type} value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKey} placeholder={placeholder}
            className={cn(inputCls, type === 'number' ? 'w-20' : 'w-36')} />
        )}
        <button onClick={commit} className="text-green-400 hover:text-green-300 flex-shrink-0"><Check className="w-3 h-3" /></button>
        <button onClick={cancel} className="text-gray-500 hover:text-gray-300 flex-shrink-0"><X className="w-3 h-3" /></button>
      </div>
    );
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); setDraft(String(value)); setEditing(true); }}
      className={cn('group flex items-center gap-1 text-left transition-colors hover:text-white', className)}
    >
      <span className={cn(displayClassName)}>{value !== '' && value !== null && value !== undefined ? String(value) : emptyLabel}</span>
      <Pencil className="w-2.5 h-2.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}

export function InlineToggle({ value, onToggle, trueLabel, falseLabel, trueClass, falseClass, disabled }: {
  value: boolean; onToggle: () => void;
  trueLabel: string; falseLabel: string;
  trueClass?: string; falseClass?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className={cn('px-2 py-0.5 rounded border text-xs font-medium',
        value ? (trueClass ?? 'bg-green-500/20 text-green-400 border-green-500/30') : (falseClass ?? 'bg-gray-700 text-gray-500 border-gray-600')
      )}>
        {value ? trueLabel : falseLabel}
      </span>
    );
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      className={cn(
        'px-2 py-0.5 rounded border text-xs font-medium transition-colors',
        value ? (trueClass ?? 'bg-green-500/20 text-green-400 border-green-500/30') : (falseClass ?? 'bg-gray-700 text-gray-500 border-gray-600')
      )}
    >
      {value ? trueLabel : falseLabel}
    </button>
  );
}
