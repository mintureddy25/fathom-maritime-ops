import clsx from 'clsx';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  /** brand = emerald (positive), default = slate */
  tone?: 'default' | 'brand';
  icon?: React.ReactNode;
}

export function StatCard({ label, value, hint, tone = 'default', icon }: Props) {
  return (
    <div className="rounded-xl bg-slate-900 ring-1 ring-slate-800 p-4 transition hover:ring-slate-700">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
        {icon && <div className={tone === 'brand' ? 'text-emerald-400/80' : 'text-slate-500'}>{icon}</div>}
      </div>
      <div className={clsx(
        'mt-3 text-3xl font-semibold tabular-nums tracking-tight',
        tone === 'brand' ? 'text-emerald-300' : 'text-slate-100',
      )}>
        {value}
      </div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
