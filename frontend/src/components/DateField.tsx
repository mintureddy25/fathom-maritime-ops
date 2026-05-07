interface Props {
  value?: Date;
  onChange: (d: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

const toISODate = (d?: Date) => {
  if (!d) return '';
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export function DateField({ value, onChange, minDate, maxDate }: Props) {
  return (
    <input
      type="date"
      value={toISODate(value)}
      min={toISODate(minDate)}
      max={toISODate(maxDate)}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v ? new Date(`${v}T00:00:00`) : undefined);
      }}
      className="w-full rounded-md px-3 py-2 text-sm"
    />
  );
}

const TIMES = (() => {
  const list: string[] = [];
  for (let h = 6; h < 22; h++) {
    for (const m of ['00', '30']) {
      list.push(`${String(h).padStart(2, '0')}:${m}`);
    }
  }
  return list;
})();

export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
      {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
