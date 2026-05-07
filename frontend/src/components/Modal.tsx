import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Spinner } from './Spinner';

export function Modal({
  title, onClose, children, size = 'md',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto py-8">
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'relative w-full bg-slate-900 ring-1 ring-slate-800 rounded-2xl shadow-2xl shadow-black/50',
        size === 'sm' && 'max-w-sm',
        size === 'md' && 'max-w-lg',
        size === 'lg' && 'max-w-2xl',
      )}>
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md text-slate-500 hover:text-slate-100 hover:bg-slate-800">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-medium text-slate-500 uppercase tracking-[0.18em]">{children}</span>;
}

export function FormButtons({ onCancel, busy, label = 'Save' }: { onCancel: () => void; busy?: boolean; label?: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} disabled={busy} className="px-4 py-2.5 text-sm rounded-md font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50">
        Cancel
      </button>
      <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 min-w-[140px] px-4 py-2.5 text-sm rounded-md bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold shadow-md shadow-emerald-900/30 disabled:opacity-70 disabled:cursor-not-allowed">
        {busy && <Spinner className="text-slate-900" />}
        {busy ? 'Saving…' : label}
      </button>
    </div>
  );
}
