import { ArrowLeft, Star } from 'lucide-react';
import { Avatar } from '../components/Sidebar';
import { StatusPill } from '../components/EmailRow';
import { useAuth } from '../context/AuthContext';
import { useStars } from '../hooks';
import { formatFull } from '../utils/format';

export default function EmailDetail({ email, onBack }) {
  const { user } = useAuth();
  const [stars, toggleStar] = useStars();
  const starred = stars.has(email.id);
  const from = email.from ?? 'sender pending';

  const doc = `<base target="_blank"><style>body{font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#15191e;margin:0}blockquote{border-left:4px solid #eceeed;margin:8px 0;padding-left:12px;color:#8a9099}img{max-width:100%}</style>${email.body}`;

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-3 px-5 py-4">
        <button onClick={onBack} aria-label="Back" className="icon-btn text-ink"><ArrowLeft size={20} /></button>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-medium">{email.subject}</h1>
        <button onClick={() => toggleStar(email.id)} aria-label="Star email" aria-pressed={starred} className="icon-btn">
          <Star size={18} className={starred ? 'fill-amber-400 text-amber-400' : ''} />
        </button>
        <span className="h-6 w-px bg-line" />
        <Avatar user={user} />
      </header>

      <article className="mx-auto max-w-3xl px-5 pb-16 pt-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white">R</span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate"><span className="font-semibold">ReachInbox</span> <span className="text-muted">&lt;{from}&gt;</span></p>
            <p className="truncate text-muted">to {email.to}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-muted">
            <span>{formatFull(email.sentAt ?? email.scheduledAt)}</span>
            <StatusPill email={email} />
          </div>
        </div>

        {email.status === 'failed' && email.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Could not send: {email.error}</p>
        )}

        <iframe
          title="Email content"
          sandbox="allow-same-origin"
          srcDoc={doc}
          onLoad={(e) => {
            const d = e.target.contentDocument;
            if (d) e.target.style.height = `${d.documentElement.scrollHeight + 8}px`;
          }}
          className="mt-6 w-full border-0"
        />

        {email.previewUrl && (
          <a href={email.previewUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm text-brand underline">
            Open Ethereal preview
          </a>
        )}
      </article>
    </div>
  );
}
