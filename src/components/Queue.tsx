import { useState, useEffect, useCallback } from 'react';
import { Draft, Gift, Contact } from '../lib/types';
import * as api from '../lib/api';
import { useSwipe } from '../hooks/useSwipe';

function FeedbackToast({
  draft,
  onFeedback,
  onDismiss,
}: {
  draft: Draft;
  onFeedback: (reaction: string) => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '12px 16px',
      marginBottom: 8,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      animation: 'fadeIn 0.3s ease',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>How was that?</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onFeedback('thumbs_up')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Good
        </button>
        <button
          onClick={() => onFeedback('thumbs_down')}
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-3)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Meh
        </button>
      </div>
    </div>
  );
}

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
      ? 'rgba(52, 211, 153, 0.08)'
      : swipe.direction === 'left'
      ? 'rgba(255, 107, 107, 0.08)'
      : 'var(--surface)';

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
  const [feedbackDraft, setFeedbackDraft] = useState<Draft | null>(null);

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
    const wasEdited = editing === draft.id;
    const msg = wasEdited ? editText : undefined;
    await api.approveDraft(draft.id, msg);

    // Log feedback: edited = auto thumbs_down vibe, otherwise show prompt
    if (wasEdited) {
      await api.createFeedback({
        draft_id: draft.id,
        contact_id: draft.contact_id,
        reaction: 'edited',
        original_message: draft.message,
        edited_message: editText,
      });
    } else {
      setFeedbackDraft(draft);
    }

    setEditing(null);
    load();
  }

  async function handleReject(id: string, draft: Draft) {
    await api.rejectDraft(id);
    await api.createFeedback({
      draft_id: id,
      contact_id: draft.contact_id,
      reaction: 'thumbs_down',
      original_message: draft.message,
    });
    load();
  }

  async function handleGiftApprove(gift: Gift) {
    await api.approveGift(gift.id, 'tok_mock_' + Date.now());
    load();
  }

  async function handleGiftReject(id: string) {
    await api.rejectGift(id);
    load();
  }

  function handleFeedback(reaction: string) {
    if (feedbackDraft) {
      api.createFeedback({
        draft_id: feedbackDraft.id,
        contact_id: feedbackDraft.contact_id,
        reaction,
        original_message: feedbackDraft.message,
      });
      setFeedbackDraft(null);
    }
  }

  if (loading) return (
    <div className="queue">
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-card" />
    </div>
  );

  const items = [
    ...drafts.map((d) => ({ type: 'draft' as const, item: d, key: d.id })),
    ...gifts.map((g) => ({ type: 'gift' as const, item: g, key: g.id })),
  ].sort((a, b) => b.item.created_at - a.item.created_at);

  if (items.length === 0 && !feedbackDraft) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="var(--border)" strokeWidth="2"/>
            <path d="M16 24l6 6 10-12" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p>All caught up</p>
        <span className="empty-sub">No messages waiting for approval</span>
      </div>
    );
  }

  return (
    <div className="queue">
      {feedbackDraft && (
        <FeedbackToast
          draft={feedbackDraft}
          onFeedback={handleFeedback}
          onDismiss={() => setFeedbackDraft(null)}
        />
      )}

      {items.length > 0 && (
        <div className="queue-count">{items.length} pending</div>
      )}

      {items.map(({ type, item, key }) =>
        type === 'draft' ? (
          <SwipeCard
            key={key}
            onApprove={() => handleApprove(item as Draft)}
            onReject={() => handleReject(key, item as Draft)}
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
            <div className="card-meta">tap to edit</div>
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
              <span className="card-category gift-badge">Gift</span>
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
