import { useState } from 'react';
import { Tab } from './lib/types';
import * as api from './lib/api';
import Queue from './components/Queue';
import Contacts from './components/Contacts';
import Flowers from './components/Flowers';
import History from './components/History';
import Settings from './components/Settings';

function LoginScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(pin);
      if (res.token) {
        api.setToken(res.token);
        window.location.reload();
      } else {
        setError('Invalid PIN');
      }
    } catch {
      setError('Connection failed');
    }
    setLoading(false);
  }

  async function handleDemo() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (data.token) {
        api.setToken(data.token);
        // Seed demo data
        await fetch('/api/seed', {
          method: 'POST',
          headers: { Authorization: 'Bearer demo' },
        });
        window.location.reload();
      } else {
        setError('Demo mode not available');
      }
    } catch {
      setError('Connection failed');
    }
    setLoading(false);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>Clawtner</h1>
        <p>Enter your PIN</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            placeholder="••••••"
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>Unlock</button>
        </form>
        <button className="btn-demo" onClick={handleDemo} disabled={loading}>
          {loading ? 'Loading...' : 'Try Demo'}
        </button>
      </div>
    </div>
  );
}

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'queue', icon: '📬', label: 'Queue' },
  { id: 'flowers', icon: '🌸', label: 'Flowers' },
  { id: 'contacts', icon: '👥', label: 'People' },
  { id: 'history', icon: '📜', label: 'History' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('queue');

  if (!api.isAuthed()) {
    return <LoginScreen />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Clawtner</h1>
      </header>

      <main className="app-main">
        {tab === 'queue' && <Queue />}
        {tab === 'flowers' && <Flowers />}
        {tab === 'contacts' && <Contacts />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
