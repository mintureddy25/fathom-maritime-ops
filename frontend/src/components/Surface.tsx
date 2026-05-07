import clsx from 'clsx';

export function Surface({
  children, className, title, subtitle, action, padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={clsx(
      'rounded-xl bg-slate-900 ring-1 ring-slate-800 shadow-lg shadow-black/30',
      className,
    )}>
      {(title || action) && (
        <header className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-100 tracking-wide">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? 'px-5 pb-5 pt-1' : ''}>{children}</div>
    </section>
  );
}
