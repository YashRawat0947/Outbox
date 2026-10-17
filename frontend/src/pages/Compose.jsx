import { useRef, useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import RichEditor from '../components/RichEditor';
import RecipientsInput from '../components/RecipientsInput';
import SendLater from '../components/SendLater';
import { useToast } from '../components/Toast';
import { scheduleEmails } from '../api';

function Row({ label, children }) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-[72px] shrink-0 pt-1.5 text-sm">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const smallInput = 'h-10 w-16 rounded-lg border border-line px-2 text-center text-sm placeholder:text-muted';

export default function Compose({ onBack, onScheduled }) {
  const toast = useToast();
  const editorRef = useRef(null);
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [delay, setDelay] = useState('');
  const [limit, setLimit] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = editorRef.current?.innerText.trim();
    if (!recipients.length) return toast.error('Add at least one recipient or upload a list.');
    if (!subject.trim()) return toast.error('Enter a subject.');
    if (!text) return toast.error('Write the email body.');
    if (delay !== '' && Number(delay) < 0) return toast.error('Delay must be 0 or more seconds.');
    if (limit !== '' && !(Number(limit) >= 1)) return toast.error('Hourly limit must be at least 1.');

    setSending(true);
    try {
      const res = await scheduleEmails({
        subject: subject.trim(),
        body: editorRef.current.innerHTML,
        recipients,
        startTime: sendAt ? new Date(sendAt).toISOString() : undefined,
        delaySeconds: delay === '' ? 2 : Number(delay),
        hourlyLimit: limit === '' ? undefined : Number(limit),
      });
      toast.success(`Scheduled ${res.scheduled} ${res.scheduled === 1 ? 'email' : 'emails'}.`);
      onScheduled();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="Back" className="icon-btn text-ink"><ArrowLeft size={20} /></button>
        <h1 className="flex-1 text-2xl font-medium">Compose New Email</h1>
        <SendLater value={sendAt} onChange={setSendAt} />
        <button onClick={send} disabled={sending} className="btn-outline">
          {sending ? 'Scheduling...' : sendAt ? 'Send Later' : 'Send'}
        </button>
      </header>

      <div className="mx-auto mt-6 max-w-4xl space-y-5 px-5 pb-16">
        <Row label="From">
          <span className="inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm" title="The worker rotates between your Ethereal sender accounts">
            Auto-rotate senders <ChevronDown size={14} className="text-muted" />
          </span>
        </Row>

        <Row label="To">
          <RecipientsInput recipients={recipients} onChange={setRecipients} />
          {recipients.length > 0 && (
            <p className="mt-1 text-xs text-muted">{recipients.length} {recipients.length === 1 ? 'recipient' : 'recipients'}</p>
          )}
        </Row>

        <Row label="Subject">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            aria-label="Subject"
            className="w-full border-b border-line pb-2 pt-1 text-sm outline-none placeholder:text-muted focus:border-brand"
          />
        </Row>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <label className="flex items-center gap-3 text-sm">
            Delay between 2 emails
            <input type="number" min="0" value={delay} onChange={(e) => setDelay(e.target.value)} placeholder="00" className={smallInput} />
          </label>
          <label className="flex items-center gap-3 text-sm">
            Hourly Limit
            <input type="number" min="1" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="00" className={smallInput} />
          </label>
        </div>

        <RichEditor editorRef={editorRef} />
      </div>
    </div>
  );
}
