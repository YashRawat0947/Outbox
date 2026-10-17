import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from './Toast';

export default function SlackButton() {
  const toast = useToast();
  const [status, setStatus] = useState({ connected: false, team: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/slack/status').then(setStatus).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const result = params.get('slack'); 
    if (result === 'connected') toast.success('Slack connected. You will get an alert when a sender hits its hourly limit.');
    if (result === 'error') toast.error('Could not connect Slack. Try again.');
    if (result) window.history.replaceState({}, '', window.location.pathname);
  }, [toast]);

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await api('/api/slack/url');
      window.location.href = url;
    } catch (e) {
      toast.error(e.message);
      setBusy(false);
    }
  };

  const disconnect = async () => {
    try {
      await api('/api/slack', { method: 'DELETE' });
      setStatus({ connected: false, team: null });
      toast.info('Slack disconnected.');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return status.connected ? (
    <button onClick={disconnect} title="Click to disconnect" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface">
      <span className="h-2 w-2 rounded-full bg-brand" />
      <span className="truncate">Slack connected{status.team ? `: ${status.team}` : ''}</span>
    </button>
  ) : (
    <button onClick={connect} disabled={busy} className="btn-outline w-full">
      {busy ? 'Redirecting...' : 'Connect Slack'}
    </button>
  );
}
