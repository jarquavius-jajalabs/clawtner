import { useState, useEffect } from 'react';
import { Contact } from '../lib/types';
import * as api from '../lib/api';
import ContactDetail from './ContactDetail';

function isValidPhone(phone: string): boolean {
  if (!phone) return true;
  const digits = phone.replace(/[^\d]/g, '');
  return phone.startsWith('+') && digits.length >= 10;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', relationship: '', tone: '',
    address_line1: '', address_line2: '', city: '', state: '', zip: '', country: 'US',
    gift_preferences: '',
  });

  async function load() {
    setLoadError('');
    try {
      const res = await api.getContacts();
      setContacts(res.contacts || []);
    } catch (e: any) {
      if (e.name === 'OfflineError') {
        setLoadError("You're offline. Pull to refresh.");
      } else {
        setLoadError('Failed to load contacts.');
      }
    }
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ name: '', phone: '', email: '', relationship: '', tone: '',
      address_line1: '', address_line2: '', city: '', state: '', zip: '', country: 'US',
      gift_preferences: '' });
    setEditing(null);
    setShowForm(false);
    setError('');
    setPhoneError('');
  }

  function editContact(e: React.MouseEvent, c: Contact) {
    e.stopPropagation();
    setForm({
      name: c.name, phone: c.phone || '', email: c.email || '',
      relationship: c.relationship || '', tone: c.tone || '',
      address_line1: c.address_line1 || '', address_line2: c.address_line2 || '',
      city: c.city || '', state: c.state || '', zip: c.zip || '',
      country: c.country || 'US', gift_preferences: c.gift_preferences || '',
    });
    setEditing(c);
    setShowForm(true);
    setError('');
    setPhoneError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPhoneError('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    if (form.phone && !isValidPhone(form.phone)) {
      setPhoneError('Phone must start with + and have 10+ digits (e.g. +15551234567)');
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await api.updateContact(editing.id, form);
        resetForm();
        load();
      } else {
        const id = form.name.toLowerCase().replace(/\s+/g, '-');
        await api.createContact({ ...form, id });
        resetForm();
        // Auto-navigate to the new contact's detail page
        const res = await api.getContacts();
        const newContacts: Contact[] = res.contacts || [];
        setContacts(newContacts);
        const newContact = newContacts.find((c) => c.id === id);
        if (newContact) {
          setSelected(newContact);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to save contact');
    }
    setSubmitting(false);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirm('Delete this contact?')) {
      try {
        await api.deleteContact(id);
        load();
      } catch {
        setError('Failed to delete contact');
      }
    }
  }

  if (selected) {
    return <ContactDetail contact={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  if (loadError) {
    return (
      <div className="empty-state">
        <p>{loadError}</p>
        <button className="btn-primary" onClick={load} style={{ marginTop: 12 }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="contacts">
      <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
        + Add Contact
      </button>

      {showForm && (
        <form className="contact-form" onSubmit={handleSubmit}>
          <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          {error && <div className="error" style={{ color: 'var(--accent)', fontSize: 13, marginBottom: 4 }}>{error}</div>}
          <input
            type="tel"
            placeholder="Phone (+1XXXXXXXXXX)"
            value={form.phone}
            onChange={(e) => { setForm({ ...form, phone: e.target.value }); setPhoneError(''); }}
            style={phoneError ? { borderColor: 'var(--accent)' } : undefined}
          />
          {phoneError && <div style={{ color: 'var(--accent)', fontSize: 12, marginTop: -4, marginBottom: 4 }}>{phoneError}</div>}
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
            <option value="">Relationship...</option>
            <option value="partner">Partner</option>
            <option value="parent">Parent</option>
            <option value="friend">Friend</option>
            <option value="sibling">Sibling</option>
            <option value="other">Other</option>
          </select>
          <input placeholder="Tone (warm, casual, formal...)" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} />

          <div className="form-section">
            <label>Delivery Address (for flowers)</label>
            <input placeholder="Street address" value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
            <input placeholder="Apt, suite, etc." value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
            <div className="form-row">
              <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} style={{ width: '80px' }} />
              <input placeholder="ZIP" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} style={{ width: '100px' }} />
            </div>
          </div>

          <textarea placeholder="Gift preferences (favorite flowers, allergies, notes...)" value={form.gift_preferences} onChange={(e) => setForm({ ...form, gift_preferences: e.target.value })} />

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Update' : 'Add'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="contact-list">
        {contacts.map((c) => (
          <div className="contact-card clickable" key={c.id} onClick={() => setSelected(c)}>
            <div className={`contact-avatar ${c.relationship || ''}`}>{c.name.charAt(0).toUpperCase()}</div>
            <div className="contact-info">
              <strong>{c.name}</strong>
              {c.relationship && <span className="badge">{c.relationship}</span>}
              {c.phone && <div className="contact-detail-text">{c.phone}</div>}
              {c.city && <div className="contact-detail-text">{c.city}, {c.state}</div>}
            </div>
            <div className="contact-actions">
              <button onClick={(e) => editContact(e, c)}>Edit</button>
              <button className="btn-danger" onClick={(e) => handleDelete(e, c.id)}>x</button>
            </div>
          </div>
        ))}
        {contacts.length === 0 && <div className="empty-state"><p>No contacts yet. Add someone you care about.</p></div>}
      </div>
    </div>
  );
}
