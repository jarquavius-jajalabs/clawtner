import { useState, useEffect } from 'react';
import { Contact } from '../lib/types';
import * as api from '../lib/api';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', relationship: '', tone: '',
    address_line1: '', address_line2: '', city: '', state: '', zip: '', country: 'US',
    gift_preferences: '',
  });

  async function load() {
    const res = await api.getContacts();
    setContacts(res.contacts || []);
  }
  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ name: '', phone: '', email: '', relationship: '', tone: '',
      address_line1: '', address_line2: '', city: '', state: '', zip: '', country: 'US',
      gift_preferences: '' });
    setEditing(null);
    setShowForm(false);
  }

  function editContact(c: Contact) {
    setForm({
      name: c.name, phone: c.phone || '', email: c.email || '',
      relationship: c.relationship || '', tone: c.tone || '',
      address_line1: c.address_line1 || '', address_line2: c.address_line2 || '',
      city: c.city || '', state: c.state || '', zip: c.zip || '',
      country: c.country || 'US', gift_preferences: c.gift_preferences || '',
    });
    setEditing(c);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await api.updateContact(editing.id, form);
    } else {
      await api.createContact({ ...form, id: form.name.toLowerCase().replace(/\s+/g, '-') });
    }
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    if (confirm('Delete this contact?')) {
      await api.deleteContact(id);
      load();
    }
  }

  return (
    <div className="contacts">
      <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
        + Add Contact
      </button>

      {showForm && (
        <form className="contact-form" onSubmit={handleSubmit}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'}</button>
            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      <div className="contact-list">
        {contacts.map((c) => (
          <div className="contact-card" key={c.id}>
            <div className="contact-info">
              <strong>{c.name}</strong>
              {c.relationship && <span className="badge">{c.relationship}</span>}
              {c.phone && <div className="contact-detail">{c.phone}</div>}
              {c.city && <div className="contact-detail">{c.city}, {c.state} {c.zip}</div>}
            </div>
            <div className="contact-actions">
              <button onClick={() => editContact(c)}>Edit</button>
              <button className="btn-danger" onClick={() => handleDelete(c.id)}>×</button>
            </div>
          </div>
        ))}
        {contacts.length === 0 && <div className="empty-state"><p>No contacts yet. Add someone you care about.</p></div>}
      </div>
    </div>
  );
}
