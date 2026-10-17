import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Inbox from './pages/Inbox';
import EmailDetail from './pages/EmailDetail';
import Compose from './pages/Compose';

export default function App() {
  const { user, loading } = useAuth();
  const [folder, setFolder] = useState('scheduled');
  const [view, setView] = useState({ name: 'inbox' }); // inbox | detail | compose

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>;
  if (!user) return <Login />;

  if (view.name === 'compose')
    return (
      <Compose
        onBack={() => setView({ name: 'inbox' })}
        onScheduled={() => {
          setFolder('scheduled');
          setView({ name: 'inbox' });
        }}
      />
    );
  if (view.name === 'detail') return <EmailDetail email={view.email} onBack={() => setView({ name: 'inbox' })} />;

  return (
    <Inbox
      folder={folder}
      onFolder={setFolder}
      onOpen={(email) => setView({ name: 'detail', email })}
      onCompose={() => setView({ name: 'compose' })}
    />
  );
}
