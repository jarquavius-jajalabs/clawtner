import { useState, useEffect, useCallback } from 'react';
import { Draft, Gift, Contact } from '../lib/types';
import * as api from '../lib/api';
import { useSwipe } from '../hooks/useSwipe';

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colors = {
    success: { bg: 'var(--green-soft)', color: 'var(--green)' },
    error: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    info: { bg: 'var(--surface)', color: 'var(--text-2)' },
  };
  const c = colors[type];

  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.color}33`,
      borderRadius: 'var(--radius)',
      padding: '12px 16px',
      marginBottom: 8,
      fontSize: 13,
      color: c.color,
      fontWeight: 500,
      animation: 'fadeIn 0.3s ease',
    }}>
      {message}
    </div>
  );
}

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
        <span>&larr; skip</span>
        <span>send &rarr;</span>
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
  const [error, setError] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState<Draft | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
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
    } catch (e: any) {
      if (e.name === 'OfflineError') {
        setError("You're offline. Pull to refresh.");
      } else {
        setError('Failed to load queue. Try again.');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(draft: Draft) {
    // Check if contact has a phone number
    const contact = contacts[draft.contact_id];
    if (contact && !contact.phone) {
      setToast({ message: 'Add a phone number first', type: 'error' });
      return;
    }

    const wasEdited = editing === draft.id;
    const msg = wasEdited ? editText : undefined;
    try {
      await api.approveDraft(draft.id, msg);
      setToast({ message: 'Message queued for send', type: 'success' });

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
    } catch {
      setToast({ message: 'Failed to approve message', type: 'error' });
    }
  }

  async function handleReject(id: string, draft: Draft) {
    try {
      await api.rejectDraft(id);
      await api.createFeedback({
        draft_id: id,
        contact_id: draft.contact_id,
        reaction: 'thumbs_down',
        original_message: draft.message,
      });
      load();
    } catch {
      setToast({ message: 'Failed to skip message', type: 'error' });
    }
  }

  async function handleGiftApprove(gift: Gift) {
    try {
      await api.approveGift(gift.id, 'tok_mock_' + Date.now());
      setToast({ message: 'Gift approved', type: 'success' });
      load();
    } catch {
      setToast({ message: 'Failed to approve gift', type: 'error' });
    }
  }

  async function handleGiftReject(id: string) {
    try {
      await api.rejectGift(id);
      load();
    } catch {
      setToast({ message: 'Failed to reject gift', type: 'error' });
    }
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

  if (error) return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="var(--accent)" strokeWidth="2"/>
          <path d="M24 16v10" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="24" cy="32" r="1.5" fill="var(--accent)"/>
        </svg>
      </div>
      <p>{error}</p>
      <button className="btn-primary" onClick={load} style={{ marginTop: 12 }}>Retry</button>
    </div>
  );

  const items = [
    ...drafts.map((d) => ({ type: 'draft' as const, item: d, key: d.id })),
    ...gifts.map((g) => ({ type: 'gift' as const, item: g, key: g.id })),
  ].sort((a, b) => b.item.created_at - a.item.created_at);

  if (items.length === 0 && !feedbackDraft && !toast) {
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
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

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
              <p className="card-message">&ldquo;{(item as Gift).message_card}&rdquo;</p>
            )}
          </SwipeCard>
        )
      )}
    </div>
  );
}
