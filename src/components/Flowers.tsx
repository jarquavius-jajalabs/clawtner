import { useState, useEffect } from 'react';
import { FlowerProduct, Contact } from '../lib/types';
import * as api from '../lib/api';

export default function Flowers() {
  const [products, setProducts] = useState<FlowerProduct[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dates, setDates] = useState<{ date: string; label: string; available: boolean }[]>([]);
  const [selected, setSelected] = useState<FlowerProduct | null>(null);
  const [contactId, setContactId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([api.getProducts(), api.getContacts(), api.getDeliveryDates()]).then(
      ([p, c, d]) => {
        setProducts(p.products || []);
        setContacts(c.contacts || []);
        setDates(d.dates || []);
      }
    );
  }, []);

  async function handleSend() {
    if (!selected || !contactId || !deliveryDate) return;
    setSending(true);
    await api.createGift({
      contact_id: contactId,
      product_id: selected.id,
      product_name: selected.name,
      product_image: selected.image,
      product_price: selected.price,
      delivery_date: deliveryDate,
      message_card: cardMessage,
    });
    setSending(false);
    setSuccess(true);
    setSelected(null);
    setCardMessage('');
    setTimeout(() => setSuccess(false), 3000);
  }

  if (selected) {
    return (
      <div className="flower-order">
        <button className="btn-back" onClick={() => setSelected(null)}>← Back</button>
        <div className="flower-hero">
          <img src={selected.image} alt={selected.name} />
          <h2>{selected.name}</h2>
          <p className="flower-price">${selected.price.toFixed(2)}</p>
          <p className="flower-desc">{selected.description}</p>
        </div>

        <div className="order-form">
          <label>Send to</label>
          <select value={contactId} onChange={(e) => setContactId(e.target.value)}>
            <option value="">Choose someone...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.city ? `(${c.city})` : ''}
              </option>
            ))}
          </select>

          <label>Delivery date</label>
          <div className="date-grid">
            {dates.filter((d) => d.available).map((d) => (
              <button
                key={d.date}
                className={`date-btn ${deliveryDate === d.date ? 'active' : ''}`}
                onClick={() => setDeliveryDate(d.date)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <label>Card message</label>
          <textarea
            placeholder="What should the card say?"
            value={cardMessage}
            onChange={(e) => setCardMessage(e.target.value)}
          />

          <button
            className="btn-primary btn-send-flowers"
            onClick={handleSend}
            disabled={!contactId || !deliveryDate || sending}
          >
            {sending ? 'Adding to queue...' : `Add to Queue — $${selected.price.toFixed(2)}`}
          </button>
          <p className="order-note">This creates a pending gift. You'll approve and pay from the Queue tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flowers">
      {success && <div className="toast">Added to queue! Check the Queue tab to approve.</div>}
      <div className="flower-grid">
        {products.map((p) => (
          <div className="flower-card" key={p.id} onClick={() => setSelected(p)}>
            <img src={p.image} alt={p.name} />
            <div className="flower-info">
              <strong>{p.name}</strong>
              <span className="flower-price">${p.price.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
