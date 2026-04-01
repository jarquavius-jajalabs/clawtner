import { useState, useEffect } from 'react';
import { Contact } from '../lib/types';
import * as api from '../lib/api';
import CycleTracker from './CycleTracker';
import CycleImport from './CycleImport';

export default function CyclePage() {
  const [partner, setPartner] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.getContacts()
      .then((res) => {
        const contacts: Contact[] = res.contacts || [];
        const p = contacts.find((c) => c.relationship === 'partner');
        if (p) setPartner(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  if (!partner) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🌙</div>
        <p>No partner contact found.</p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>
          Add a contact with relationship "partner" to enable cycle tracking.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 4 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, color: 'var(--text-2)',
        }}>
          {partner.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{partner.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Cycle Tracker</div>
        </div>
        <button
          onClick={() => setShowImport(true)}
          style={{
            padding: '6px 14px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text-2)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Import
        </button>
      </div>
      <CycleTracker key={refreshKey} contact={partner} />
      {showImport && (
        <CycleImport
          contactId={partner.id}
          onImported={() => { setShowImport(false); setRefreshKey((k) => k + 1); }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
