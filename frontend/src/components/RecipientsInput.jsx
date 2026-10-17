import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { useToast } from './Toast';
import { extractEmails } from '../utils/format';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecipientsInput({ recipients, onChange }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);

  const merge = (emails) => onChange([...new Set([...recipients, ...emails])]);

  const commitDraft = () => {
    const v = draft.trim().replace(/[,;]$/, '');
    if (!v) return;
    if (!EMAIL.test(v)) return toast.error(`"${v}" is not a valid email address.`);
    merge([v.toLowerCase()]);
    setDraft('');
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const found = extractEmails(await f.text());
    if (!found.length) return toast.error('No email addresses found in this file.');
    merge(found);
    toast.success(`${found.length} ${found.length === 1 ? 'email' : 'emails'} found in ${f.name}.`);
  };

  const shown = expanded ? recipients : recipients.slice(0, 3);
  const hidden = recipients.length - shown.length;

  return (
    <div className="flex items-start gap-3 border-b border-line pb-2">
      <div className="flex max-h-40 min-w-0 flex-1 flex-wrap items-center gap-1.5 overflow-y-auto">
        {shown.map((r) => (
          <span key={r} className="inline-flex items-center gap-1 rounded-full border border-brand bg-brand-tint px-2.5 py-0.5 text-xs">
            {r}
            {expanded && (
              <button type="button" aria-label={`Remove ${r}`} onClick={() => onChange(recipients.filter((x) => x !== r))}>
                <X size={11} />
              </button>
            )}
          </span>
        ))}
        {hidden > 0 && (
          <button type="button" onClick={() => setExpanded(true)} className="rounded-full border border-brand bg-brand-tint px-2.5 py-0.5 text-xs">
            +{hidden}
          </button>
        )}
        {expanded && recipients.length > 3 && (
          <button type="button" onClick={() => setExpanded(false)} className="text-xs text-muted underline">Show less</button>
        )}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (['Enter', ',', ';', ' '].includes(e.key)) {
              e.preventDefault();
              commitDraft();
            } else if (e.key === 'Backspace' && !draft && recipients.length) {
              onChange(recipients.slice(0, -1));
            }
          }}
          onBlur={commitDraft}
          placeholder={recipients.length ? '' : 'recipient@example.com'}
          aria-label="Recipients"
          className="min-w-[160px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted"
        />
      </div>

      <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={onFile} />
      <button type="button" onClick={() => fileRef.current?.click()} className="flex shrink-0 items-center gap-1.5 py-1 text-sm text-brand">
        <Upload size={15} /> Upload List
      </button>
    </div>
  );
}
