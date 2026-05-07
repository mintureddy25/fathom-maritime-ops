import { Spinner } from './Spinner';

export function PageHeader({
  eyebrow, title, subtitle, action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-400">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-slate-50 mt-0.5">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function PrimaryButton({ children, className, loading, disabled, ...props }: BtnProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30 transition disabled:opacity-70 disabled:cursor-not-allowed ${className || ''}`}
    >
      {loading && <Spinner className="text-slate-900" />}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, loading, disabled, ...props }: BtnProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 px-4 py-2.5 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed ${className || ''}`}
    >
      {loading && <Spinner className="text-slate-300" />}
      {children}
    </button>
  );
}
