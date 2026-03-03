import { useState, useEffect } from 'react';
import * as api from '../lib/api';

export default function Settings() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [chForm, setChForm] = useState({ name: '', url: '', contact_ids: '' });
  const [showChForm, setShowChForm] = useState(false);

  async function load() {
    const [k, c] = await Promise.all([api.getApiKeys(), api.getChannels()]);
    setKeys(k.keys || []);
    setChannels(c.channels || []);
  }
  useEffect(() => { load(); }, []);

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName) return;
    const res = await api.createApiKey(newKeyName);
    setCreatedKey(res.key);
    setNewKeyName('');
    load();
  }

  async function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault();
    await api.createChannel({
      name: chForm.name,
      url: chForm.url,
      contact_ids: chForm.contact_ids.split(',').map((s: string) => s.trim()).filter(Boolean),
    });
    setChForm({ name: '', url: '', contact_ids: '' });
    setShowChForm(false);
    load();
  }

  function handleLogout() {
    api.clearToken();
    window.location.reload();
  }

  return (
    <div className="settings">
      <section>
        <h3>API Keys</h3>
        <p className="settings-desc">Create keys for your AI agents to push drafts.</p>
        <form className="inline-form" onSubmit={handleCreateKey}>
          <input placeholder="Key name (e.g. openclaw)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
          <button type="submit" className="btn-primary">Create</button>
        </form>
        {createdKey && (
          <div className="key-reveal">
            <strong>Save this key now — you won't see it again:</strong>
            <code>{createdKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(createdKey); }}>Copy</button>
          </div>
        )}
        <div className="key-list">
          {keys.map((k) => (
            <div className="key-item" key={k.id}>
              <span>{k.name}</span>
              <span className="key-meta">{k.active ? 'Active' : 'Disabled'}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Delivery Channels</h3>
        <p className="settings-desc">Webhooks that fire when you approve a message.</p>
        <button className="btn-primary" onClick={() => setShowChForm(!showChForm)}>+ Add Channel</button>
        {showChForm && (
          <form className="contact-form" onSubmit={handleCreateChannel}>
            <input placeholder="Name (e.g. imessage-mac)" value={chForm.name} onChange={(e) => setChForm({ ...chForm, name: e.target.value })} required />
            <input placeholder="Webhook URL" value={chForm.url} onChange={(e) => setChForm({ ...chForm, url: e.target.value })} required />
            <input placeholder="Contact IDs (comma separated)" value={chForm.contact_ids} onChange={(e) => setChForm({ ...chForm, contact_ids: e.target.value })} />
            <button type="submit" className="btn-primary">Add</button>
          </form>
        )}
        <div className="channel-list">
          {channels.map((c) => (
            <div className="key-item" key={c.id}>
              <span>{c.name}</span>
              <span className="key-meta">{c.url}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <button className="btn-danger" onClick={handleLogout}>Logout</button>
      </section>
    </div>
  );
}
