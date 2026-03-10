import { useState, useEffect } from 'react';
import * as api from '../lib/api';
import { Contact } from '../lib/types';

interface Channel {
  id: string;
  name: string;
  type: string;
  url: string;
  method: string;
  headers: string | null;
  contact_ids: string | null;
  active: number;
  created_at: number;
}

export default function Settings() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showChForm, setShowChForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [chForm, setChForm] = useState({ name: '', url: '', method: 'POST', headers: '', selectedContacts: [] as string[] });
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string } | null>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  async function load() {
    const [k, c, ct] = await Promise.all([api.getApiKeys(), api.getChannels(), api.getContacts()]);
    setKeys(k.keys || []);
    setChannels(c.channels || []);
    setContacts(ct.contacts || []);
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setChForm({ name: '', url: '', method: 'POST', headers: '', selectedContacts: [] });
    setShowChForm(false);
    setEditingChannel(null);
  }

  function startEdit(ch: Channel) {
    let contactIds: string[] = [];
    try { contactIds = JSON.parse(ch.contact_ids || '[]'); } catch {}
    setChForm({
      name: ch.name,
      url: ch.url,
      method: ch.method || 'POST',
      headers: ch.headers || '',
      selectedContacts: contactIds,
    });
    setEditingChannel(ch);
    setShowChForm(true);
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName) return;
    const res = await api.createApiKey(newKeyName);
    setCreatedKey(res.key);
    setNewKeyName('');
    load();
  }

  async function handleSaveChannel(e: React.FormEvent) {
    e.preventDefault();
    const data: any = {
      name: chForm.name,
      url: chForm.url,
      method: chForm.method,
      contact_ids: chForm.selectedContacts,
    };
    if (chForm.headers.trim()) {
      try {
        data.headers = JSON.parse(chForm.headers);
      } catch {
        // ignore invalid JSON, skip headers
      }
    }

    if (editingChannel) {
      await api.updateChannel(editingChannel.id, data);
    } else {
      await api.createChannel(data);
    }
    resetForm();
    load();
  }

  async function handleDeleteChannel(id: string) {
    await api.deleteChannel(id);
    load();
  }

  async function handleToggleChannel(ch: Channel) {
    await api.updateChannel(ch.id, { active: ch.active ? 0 : 1 });
    load();
  }

  async function handleTestChannel(id: string) {
    setTesting(prev => ({ ...prev, [id]: true }));
    setTestResults(prev => ({ ...prev, [id]: null }));
    try {
      const res = await api.testChannel(id);
      setTestResults(prev => ({ ...prev, [id]: res }));
    } catch {
      setTestResults(prev => ({ ...prev, [id]: { success: false, error: 'Request failed' } }));
    }
    setTesting(prev => ({ ...prev, [id]: false }));
  }

  function toggleContact(contactId: string) {
    setChForm(prev => ({
      ...prev,
      selectedContacts: prev.selectedContacts.includes(contactId)
        ? prev.selectedContacts.filter(id => id !== contactId)
        : [...prev.selectedContacts, contactId],
    }));
  }

  function getContactName(id: string): string {
    const c = contacts.find(ct => ct.id === id);
    return c ? c.name : id.slice(0, 8);
  }

  function handleLogout() {
    api.clearToken();
    window.location.reload();
  }

  return (
    <div className="settings">
      {/* API Keys */}
      <section>
        <h3>API Keys</h3>
        <p className="settings-desc">Create keys for your AI agents to push drafts.</p>
        <form className="inline-form" onSubmit={handleCreateKey}>
          <input placeholder="Key name (e.g. openclaw)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
          <button type="submit" className="btn-primary">Create</button>
        </form>
        {createdKey && (
          <div className="key-reveal">
            <strong>Save this key now:</strong>
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

      {/* Delivery Channels */}
      <section>
        <h3>Delivery Channels</h3>
        <p className="settings-desc">Webhooks that fire when you approve a message.</p>
        <button className="btn-primary" onClick={() => { resetForm(); setShowChForm(!showChForm); }} style={{ width: 'auto', padding: '10px 20px' }}>
          {showChForm && !editingChannel ? 'Cancel' : '+ Add Channel'}
        </button>

        {showChForm && (
          <form className="contact-form" onSubmit={handleSaveChannel} style={{ marginTop: 8 }}>
            <input
              placeholder="Name (e.g. imessage-mac)"
              value={chForm.name}
              onChange={(e) => setChForm({ ...chForm, name: e.target.value })}
              required
            />
            <input
              placeholder="Webhook URL"
              value={chForm.url}
              onChange={(e) => setChForm({ ...chForm, url: e.target.value })}
              required
            />
            <select
              value={chForm.method}
              onChange={(e) => setChForm({ ...chForm, method: e.target.value })}
              style={{ padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '14px' }}
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
            <input
              placeholder='Custom headers (JSON, optional)'
              value={chForm.headers}
              onChange={(e) => setChForm({ ...chForm, headers: e.target.value })}
            />

            {/* Contact picker */}
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
                Route to contacts
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {contacts.length === 0 && (
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>No contacts yet. Add contacts first.</span>
                )}
                {contacts.map(ct => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => toggleContact(ct.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1px solid',
                      borderColor: chForm.selectedContacts.includes(ct.id) ? 'var(--green)' : 'var(--border)',
                      background: chForm.selectedContacts.includes(ct.id) ? 'var(--green-soft)' : 'var(--surface-2)',
                      color: chForm.selectedContacts.includes(ct.id) ? 'var(--green)' : 'var(--text-2)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontWeight: chForm.selectedContacts.includes(ct.id) ? 600 : 400,
                    }}
                  >
                    {ct.name}
                  </button>
                ))}
              </div>
              {chForm.selectedContacts.length === 0 && contacts.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  No contacts selected. Webhook won't fire for any contact.
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingChannel ? 'Save Changes' : 'Add Channel'}
              </button>
              {editingChannel && (
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </form>
        )}

        {/* Channel list */}
        <div className="channel-list" style={{ marginTop: 8 }}>
          {channels.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No channels configured. Add one to start delivering messages.
            </div>
          )}
          {channels.map((ch) => {
            let contactIds: string[] = [];
            try { contactIds = JSON.parse(ch.contact_ids || '[]'); } catch {}
            const result = testResults[ch.id];
            const isTesting = testing[ch.id];

            return (
              <div
                key={ch.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  marginBottom: 6,
                  opacity: ch.active ? 1 : 0.5,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{ch.name}</span>
                    {!ch.active && (
                      <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Paused
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                    background: ch.active ? 'var(--green-soft)' : 'var(--surface-2)',
                    color: ch.active ? 'var(--green)' : 'var(--text-3)',
                    fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>
                    {ch.method}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, wordBreak: 'break-all' }}>
                  {ch.url}
                </div>

                {contactIds.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {contactIds.map(cid => (
                      <span key={cid} style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 12,
                        background: 'var(--purple-soft)', color: 'var(--purple)',
                      }}>
                        {getContactName(cid)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Test result */}
                {result && (
                  <div style={{
                    fontSize: 12, padding: '6px 10px', borderRadius: 'var(--radius-sm)', marginBottom: 8,
                    background: result.success ? 'var(--green-soft)' : 'var(--accent-soft)',
                    color: result.success ? 'var(--green)' : 'var(--accent)',
                  }}>
                    {result.success ? 'Test passed' : `Failed: ${result.error}`}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleTestChannel(ch.id)}
                    disabled={isTesting}
                    style={{
                      padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-2)',
                    }}
                  >
                    {isTesting ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    onClick={() => startEdit(ch)}
                    style={{
                      padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text-2)',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleChannel(ch)}
                    style={{
                      padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: ch.active ? 'var(--amber)' : 'var(--green)',
                    }}
                  >
                    {ch.active ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => handleDeleteChannel(ch.id)}
                    style={{
                      padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                      background: 'none', border: '1px solid rgba(255, 107, 107, 0.3)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--accent)',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Logout */}
      <section>
        <button className="btn-danger" onClick={handleLogout}>Logout</button>
      </section>
    </div>
  );
}
