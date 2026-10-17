import { Clock, Star } from 'lucide-react';
import { formatPill, htmlToText } from '../utils/format';

const PILL = {
  sent: 'bg-surface text-ink',
  sending: 'bg-blue-50 text-blue-700',
  failed: 'bg-red-50 text-red-700',
};

export function StatusPill({ email }) {
  if (email.status === 'scheduled') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-warn-line bg-warn-bg px-2 py-0.5 text-xs font-medium text-warn-text">
        <Clock size={12} /> {formatPill(email.scheduledAt)}
      </span>
    );
  }
  const label = { sent: 'Sent', sending: 'Sending', failed: 'Failed' }[email.status];
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${PILL[email.status]}`}>{label}</span>;
}

export default function EmailRow({ email, starred, onStar, onOpen }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(email)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(email)}
      className="flex cursor-pointer items-center gap-4 border-b border-line px-5 py-3.5 text-sm hover:bg-surface/70"
    >
      <span className="w-44 shrink-0 truncate">To: {email.to}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <StatusPill email={email} />
        <p className="min-w-0 truncate">
          <span className="font-medium">{email.subject}</span>
          <span className="text-muted"> - {htmlToText(email.body)}</span>
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStar(email.id);
        }}
        aria-label={starred ? 'Remove star' : 'Star email'}
        aria-pressed={starred}
        className="text-muted hover:text-ink"
      >
        <Star size={16} className={starred ? 'fill-amber-400 text-amber-400' : ''} />
      </button>
    </div>
  );
}
