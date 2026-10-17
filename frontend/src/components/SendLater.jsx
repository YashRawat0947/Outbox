import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { toLocalInputValue } from '../utils/format';

const tomorrowAt = (h) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, 0, 0, 0);
  return toLocalInputValue(d);
};
const OPTIONS = [
  ['Tomorrow', tomorrowAt(9)],
  ['Tomorrow, 10:00 AM', tomorrowAt(10)],
  ['Tomorrow, 11:00 AM', tomorrowAt(11)],
  ['Tomorrow, 3:00 PM', tomorrowAt(15)],
];

export default function SendLater({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setPick(value);
          setOpen((o) => !o);
        }}
        aria-label="Send later"
        aria-expanded={open}
        className={`icon-btn ${value ? '!text-brand' : ''}`}
      >
        <Clock size={19} />
      </button>

      {open && (
        <div role="dialog" aria-label="Send later" className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-line bg-white p-4 shadow-xl">
          <p className="text-sm font-medium">Send Later</p>
          <label className="mt-3 flex items-center gap-2 border-b border-line pb-1.5">
            <input
              type="datetime-local"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              aria-label="Pick date and time"
              className="w-full bg-transparent text-xs outline-none"
            />
            <Calendar size={14} className="text-muted" />
          </label>
          <ul className="mt-3 space-y-0.5">
            {OPTIONS.map(([label, v]) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => setPick(v)}
                  className={`w-full rounded-md px-1 py-1.5 text-left text-xs hover:bg-surface ${pick === v ? 'font-medium text-brand' : ''}`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-center justify-end gap-4">
            <button
              type="button"
              className="text-xs"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-outline py-1 text-xs"
              onClick={() => {
                onChange(pick);
                setOpen(false);
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
