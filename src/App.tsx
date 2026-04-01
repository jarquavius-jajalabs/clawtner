import { useState } from 'react';
import { Tab } from './lib/types';
import * as api from './lib/api';
import Queue from './components/Queue';
import CyclePage from './components/CyclePage';
import Contacts from './components/Contacts';
import Flowers from './components/Flowers';
import History from './components/History';
import Settings from './components/Settings';
import Schedules from './components/Schedules';
import Compose from './components/Compose';
import Onboarding from './components/Onboarding';

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
    } catch (err: any) {
      setError(err?.message || 'Connection failed');
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
        <div className="login-logo">♡</div>
        <h1>Clawtner</h1>
        <p>Relationship CRM</p>
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

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'cycle', label: 'Cycle', icon: <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" /><path d="M10 2.5a7.5 7.5 0 0 1 0 15V2.5z" fill="currentColor" /></svg> },
  { id: 'compose', label: 'New', icon: <svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12" strokeLinecap="round" /></svg> },
  { id: 'queue', label: 'Queue', icon: <svg viewBox="0 0 20 20"><rect x="3" y="4" width="14" height="12" rx="2" /><path d="M3 8h14" /><path d="M8 8v8" /></svg> },
  { id: 'schedule', label: 'Schedule', icon: <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5" /><path d="M10 5.5v5l3.5 2" /></svg> },
  { id: 'contacts', label: 'People', icon: <svg viewBox="0 0 20 20"><circle cx="10" cy="7" r="3.5" /><path d="M3.5 17.5c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" /></svg> },
  { id: 'flowers', label: 'Gifts', icon: <svg viewBox="0 0 20 20"><path d="M10 6C10 4 8 2 6 2s-4 2-4 4 2 4 4 4" /><path d="M10 6c0-2 2-4 4-4s4 2 4 4-2 4-4 4" /><rect x="4" y="10" width="12" height="3" rx="1" /><rect x="6" y="13" width="8" height="5" rx="1" /><line x1="10" y1="6" x2="10" y2="18" /></svg> },
  { id: 'history', label: 'Sent', icon: <svg viewBox="0 0 20 20"><path d="M3 10l6-7v4h8v6h-8v4z" /></svg> },
  { id: 'settings', label: 'Config', icon: <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" /><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4" /></svg> },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('cycle');
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarding_complete') === '1');

  if (!api.isAuthed()) {
    return <LoginScreen />;
  }

  if (!onboarded) {
    return <Onboarding onComplete={() => setOnboarded(true)} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Clawtner</h1>
          <span className="header-subtitle">Relationship CRM</span>
        </div>
        <div className="header-dot" title="Online" />
      </header>

      <main className="app-main">
        {tab === 'compose' && <Compose />}
        {tab === 'queue' && <Queue />}
        {tab === 'cycle' && <CyclePage />}
        {tab === 'schedule' && <Schedules />}
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
