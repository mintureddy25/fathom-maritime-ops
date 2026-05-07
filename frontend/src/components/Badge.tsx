import clsx from 'clsx';

// Theme-restricted: emerald (positive) or slate (everything else).
// Three slate intensities give visual weight to risk states without using off-theme hues.
const POSITIVE = new Set(['completed', 'active', 'compliant', 'admin']);
const STRONG = new Set(['critical', 'missed', 'non_compliant', 'high', 'retired']);

export function Badge({ value }: { value: string }) {
  let cls = 'bg-slate-800/60 text-slate-300';
  if (POSITIVE.has(value)) cls = 'bg-emerald-500/15 text-emerald-300';
  else if (STRONG.has(value)) cls = 'bg-slate-700/80 text-slate-100';
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md uppercase tracking-wide',
      cls,
    )}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}
