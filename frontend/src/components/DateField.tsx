import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';
import './DateField.css';

interface Props {
  value?: Date;
  onChange: (d: Date | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DateField({ value, onChange, placeholder = 'Pick a date', minDate, maxDate }: Props) {
  const [pickingYear, setPickingYear] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(value || new Date());

  useEffect(() => { if (value) setViewDate(value); }, [value]);

  return (
    <DatePicker
      selected={value || null}
      onChange={(d: Date | null) => {
        if (!d) { onChange(undefined); return; }
        if (pickingYear) {
          const next = new Date(viewDate);
          next.setFullYear(d.getFullYear());
          setViewDate(next);
          setPickingYear(false);
        } else {
          onChange(d);
        }
      }}
      openToDate={viewDate}
      placeholderText={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat="d MMM yyyy"
      showPopperArrow={false}
      fixedHeight
      showYearPicker={pickingYear}
      shouldCloseOnSelect={!pickingYear}
      yearItemNumber={12}
      portalId="datepicker-portal"
      popperPlacement="bottom-start"
      autoComplete="off"
      onCalendarClose={() => setPickingYear(false)}
      renderCustomHeader={pickingYear ? undefined : ({
        date, decreaseMonth, increaseMonth,
        prevMonthButtonDisabled, nextMonthButtonDisabled,
      }) => (
        <div className="rdp-header">
          <button
            type="button"
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            aria-label="Previous month"
            className="rdp-nav"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPickingYear(true)}
            className="rdp-title"
          >
            {MONTHS[date.getMonth()]} {date.getFullYear()}
          </button>
          <button
            type="button"
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            aria-label="Next month"
            className="rdp-nav"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      className="w-full rounded-md px-3 py-2 text-sm"
      wrapperClassName="w-full block"
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
