import { DatePicker } from '@tremor/react';

interface Props {
  value?: Date;
  onChange: (d: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function DateField({ value, onChange, placeholder = 'Select date', minDate, maxDate }: Props) {
  return (
    <DatePicker
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      enableYearNavigation
      minDate={minDate}
      maxDate={maxDate}
      className="w-full"
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
