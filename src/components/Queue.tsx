import { useState, useEffect, useCallback } from 'react';
import { Draft, Gift, Contact } from '../lib/types';
import * as api from '../lib/api';
import { useSwipe } from '../hooks/useSwipe';

function SwipeCard({
  children,
  onApprove,
  onReject,
}: {
  children: React.ReactNode;
  onApprove: () => void;
  onReject: () => void;
}) {
  const swipe = useSwipe(onReject, onApprove);
  const bg =
    swipe.direction === 'right'
      ? 'rgba(72, 199, 142, 0.15)'
      : swipe.direction === 'left'
      ? 'rgba(255, 107, 107, 0.15)'
      : 'var(--card-bg)';

  return (
    <div
      className="swipe-card"
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
      style={{
        transform: `translateX(${swipe.offsetX}px) rotate(${swipe.offsetX * 0.05}deg)`,
        background: bg,
        transition: swipe.swiping ? 'none' : 'all 0.3s ease',
      }}
    >
      {swipe.direction === 'right' && <div className="swipe-indicator approve">SEND</div>}
      {swipe.direction === 'left' && <div className="swipe-indicator reject">SKIP</div>}
      {children}
      <div className="swipe-hint">
        <span>← skip</span>
        <span>send →</span>
      </div>
    </div>
  );
}

export default function Queue() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [d, g, c] = await Promise.all([
      api.getDrafts('pending'),
      api.getGifts('pending'),
      api.getContacts(),
    ]);
    setDrafts(d.drafts || []);
    setGifts(g.gifts || []);
    const map: Record<string, Contact> = {};
    (c.contacts || []).forEach((ct: Contact) => (map[ct.id] = ct));
    setContacts(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(draft: Draft) {
    const msg = editing === draft.id ? editText : undefined;
    await api.approveDraft(draft.id, msg);
    setEditing(null);
    load();
  }

  async function handleReject(id: string) {
    await api.rejectDraft(id);
    load();
  }

  async function handleGiftApprove(gift: Gift) {
    // TODO: Integrate Stripe Elements for real payment token
    await api.approveGift(gift.id, 'tok_mock_' + Date.now());
    load();
  }

  async function handleGiftReject(id: string) {
    await api.rejectGift(id);
    load();
  }

  if (loading) return <div className="loading">Loading...</div>;

  const items = [
    ...drafts.map((d) => ({ type: 'draft' as const, item: d, key: d.id })),
    ...gifts.map((g) => ({ type: 'gift' as const, item: g, key: g.id })),
  ].sort((a, b) => b.item.created_at - a.item.created_at);

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">✓</div>
        <p>All caught up. Nothing pending.</p>
      </div>
    );
  }

  return (
    <div className="queue">
      <div className="queue-count">{items.length} pending</div>
      {items.map(({ type, item, key }) =>
        type === 'draft' ? (
          <SwipeCard
            key={key}
            onApprove={() => handleApprove(item as Draft)}
            onReject={() => handleReject(key)}
          >
            <div className="card-header">
              <span className="contact-name">
                {contacts[(item as Draft).contact_id]?.name || (item as Draft).contact_id}
              </span>
              <span className="card-category">{(item as Draft).category}</span>
            </div>
            {editing === key ? (
              <textarea
                className="edit-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
              />
            ) : (
              <p
                className="card-message"
                onClick={() => {
                  setEditing(key);
                  setEditText((item as Draft).message);
                }}
              >
                {(item as Draft).message}
              </p>
            )}
            <div className="card-meta">tap message to edit before sending</div>
          </SwipeCard>
        ) : (
          <SwipeCard
            key={key}
            onApprove={() => handleGiftApprove(item as Gift)}
            onReject={() => handleGiftReject(key)}
          >
            <div className="card-header">
              <span className="contact-name">
                {contacts[(item as Gift).contact_id]?.name || (item as Gift).contact_id}
              </span>
              <span className="card-category gift-badge">🌸 Gift</span>
            </div>
            {(item as Gift).product_image && (
              <img
                className="gift-image"
                src={(item as Gift).product_image!}
                alt={(item as Gift).product_name || 'Flowers'}
              />
            )}
            <div className="gift-details">
              <strong>{(item as Gift).product_name}</strong>
              <span className="gift-price">${(item as Gift).product_price?.toFixed(2)}</span>
            </div>
            <div className="gift-delivery">
              Delivery: {(item as Gift).delivery_date}
            </div>
            {(item as Gift).message_card && (
              <p className="card-message">"{(item as Gift).message_card}"</p>
            )}
          </SwipeCard>
        )
      )}
    </div>
  );
}
