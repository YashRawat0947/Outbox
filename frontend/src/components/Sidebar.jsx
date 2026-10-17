import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Clock, LogOut, Send } from 'lucide-react';
import Logo from './Logo';
import SlackButton from './SlackButton';
import { useAuth } from '../context/AuthContext';

export function Avatar({ user, size = 'h-9 w-9' }) {
  return user?.avatar ? (
    <img src={user.avatar} alt="" referrerPolicy="no-referrer" className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white`}>
      {user?.name?.[0] ?? '?'}
    </span>
  );
}

function NavItem({ icon: Icon, label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? 'bg-brand-tint font-medium' : 'hover:bg-surface'
      }`}
    >
      <Icon size={17} strokeWidth={1.75} />
      <span className="flex-1 text-left">{label}</span>
      <span className="pr-1 text-xs text-muted">{count ?? ''}</span>
    </button>
  );
}

export default function Sidebar({ folder, onFolder, counts, onCompose }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <aside className="flex w-[230px] shrink-0 flex-col gap-3 p-3">
      <Logo className="px-1 pb-1" />

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-left"
        >
          <Avatar user={user} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-[11px] text-muted">{user.email}</span>
          </span>
          <ChevronDown size={16} className="text-muted" />
        </button>
        {open && (
          <div role="menu" className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-line bg-white p-1 shadow-lg">
            <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface">
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>

      <button onClick={onCompose} className="btn-outline w-full py-2">Compose</button>

      <p className="mt-2 px-3 text-[11px] text-muted">CORE</p>
      <nav className="flex flex-col gap-1">
        <NavItem icon={Clock} label="Scheduled" count={counts.scheduled} active={folder === 'scheduled'} onClick={() => onFolder('scheduled')} />
        <NavItem icon={Send} label="Sent" count={counts.sent} active={folder === 'sent'} onClick={() => onFolder('sent')} />
      </nav>

      <div className="mt-auto pb-2">
        <SlackButton />
      </div>
    </aside>
  );
}
