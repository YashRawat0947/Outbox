import { useCallback, useEffect, useRef, useState } from 'react';
import { Filter, RefreshCw, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import EmailRow from '../components/EmailRow';
import { useToast } from '../components/Toast';
import { useStars } from '../hooks';
import { fetchCounts, fetchEmails } from '../api';

export default function Inbox({ folder, onFolder, onOpen, onCompose }) {
  const toast = useToast();
  const [stars, toggleStar] = useStars();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ scheduled: null, sent: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [starOnly, setStarOnly] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (silent = false) => {
      const id = ++reqId.current; // drop stale responses
      if (!silent) setLoading(true);
      try {
        const [data, c] = await Promise.all([fetchEmails(folder, q), fetchCounts()]);
        if (id !== reqId.current) return;
        setItems(data);
        setCounts(c);
      } catch (e) {
        if (!silent && id === reqId.current) {
          setItems([]);
          toast.error(e.message);
        }
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [folder, q, toast],
  );

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 10000);
    return () => clearInterval(t);
  }, [load]);

  const visible = starOnly ? items.filter((e) => stars.has(e.id)) : items;

  return (
    <div className="flex min-h-screen">
      <Sidebar folder={folder} onFolder={onFolder} counts={counts} onCompose={onCompose} />

      <main className="min-w-0 flex-1 py-4 pr-5">
        <div className="mb-3 flex items-center gap-3">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-surface px-4">
            <Search size={16} className="text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              aria-label="Search emails"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </label>
          <button
            onClick={() => setStarOnly((s) => !s)}
            aria-pressed={starOnly}
            title="Show starred only"
            className={`icon-btn ${starOnly ? '!bg-brand-tint !text-brand' : ''}`}
          >
            <Filter size={17} />
          </button>
          <button onClick={() => load()} title="Refresh" aria-label="Refresh" className="icon-btn">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && items.length === 0 ? (
          <div aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-line px-5 py-4">
                <div className="h-4 w-40 animate-pulse rounded bg-surface" />
                <div className="h-4 flex-1 animate-pulse rounded bg-surface" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <p className="font-medium">
              {q ? 'No emails match your search' : starOnly ? 'No starred emails' : folder === 'sent' ? 'No emails sent yet' : 'Nothing scheduled'}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              {q
                ? 'Try a different name, subject or word.'
                : folder === 'sent'
                  ? 'Sent and failed emails show up here as soon as the first one goes out.'
                  : 'Compose an email and upload your list to schedule it.'}
            </p>
            {folder === 'scheduled' && !q && !starOnly && (
              <button onClick={onCompose} className="btn-outline mt-5">Compose</button>
            )}
          </div>
        ) : (
          visible.map((e) => (
            <EmailRow key={e.id} email={e} starred={stars.has(e.id)} onStar={toggleStar} onOpen={onOpen} />
          ))
        )}
      </main>
    </div>
  );
}
