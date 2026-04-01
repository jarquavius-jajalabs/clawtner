import { useState, useEffect, useRef } from 'react';
import * as api from '../lib/api';

const CATEGORIES = [
  { id: 'basics', label: 'Basics', icon: '👤', color: 'var(--accent)' },
  { id: 'favorites', label: 'Favorites', icon: '⭐', color: 'var(--amber)' },
  { id: 'dislikes', label: 'Dislikes', icon: '🚫', color: 'var(--red)' },
  { id: 'triggers', label: 'Triggers', icon: '💡', color: 'var(--green)' },
  { id: 'inside_jokes', label: 'Inside Jokes', icon: '😂', color: 'var(--purple)' },
  { id: 'routines', label: 'Routines', icon: '🕐', color: 'var(--text-2)' },
  { id: 'communication', label: 'Communication', icon: '💬', color: 'var(--pink)' },
] as const;

const SUGGESTIONS: Record<string, string[]> = {
  basics: ['birthday', 'anniversary', 'how_we_met', 'pet_names', 'zodiac'],
  favorites: ['flower', 'restaurant', 'color', 'movie', 'song', 'food', 'drink', 'season', 'holiday'],
  dislikes: ['foods', 'activities', 'topics_to_avoid'],
  triggers: ['stress_triggers', 'things_that_cheer_her_up', 'comfort_food', 'comfort_activity'],
  inside_jokes: [],
  routines: ['morning_routine', 'work_hours', 'gym_schedule', 'bedtime'],
  communication: ['preferred_text_length', 'emoji_use', 'response_speed', 'pet_peeves'],
};

interface ProfileField {
  category: string;
  key: string;
  value: string;
}

export default function SoulProfile({ contactId }: { contactId: string }) {
  const [profile, setProfile] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null); // "category:key"
  const [editValue, setEditValue] = useState('');
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormCategory, setAddFormCategory] = useState('basics');
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, [contactId]);

  useEffect(() => {
    if (editRef.current) editRef.current.focus();
  }, [editingField]);

  async function loadProfile() {
    try {
      const data = await api.getContactProfile(contactId);
      setProfile(data.profile || {});
    } catch {
      setProfile({});
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(category: string, key: string, value: string) {
    if (!key.trim() || !value.trim()) return;
    setSaving(true);
    try {
      await api.addProfileField(contactId, { category, key: key.trim(), value: value.trim() });
      setProfile((prev) => ({
        ...prev,
        [category]: { ...(prev[category] || {}), [key.trim()]: value.trim() },
      }));
      setNewKey('');
      setNewValue('');
      setAddingCategory(null);
      setShowAddForm(false);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: string, key: string) {
    setSaving(true);
    try {
      await api.deleteProfileField(contactId, category, key);
      setProfile((prev) => {
        const updated = { ...prev };
        if (updated[category]) {
          const cat = { ...updated[category] };
          delete cat[key];
          if (Object.keys(cat).length === 0) {
            delete updated[category];
          } else {
            updated[category] = cat;
          }
        }
        return updated;
      });
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(category: string, key: string) {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await api.addProfileField(contactId, { category, key, value: editValue.trim() });
      setProfile((prev) => ({
        ...prev,
        [category]: { ...(prev[category] || {}), [key]: editValue.trim() },
      }));
      setEditingField(null);
      setEditValue('');
    } catch {
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: string, key: string, currentValue: string) {
    setEditingField(`${category}:${key}`);
    setEditValue(currentValue);
  }

  function startSuggestion(category: string, key: string) {
    setAddingCategory(category);
    setNewKey(key);
    setNewValue('');
    setShowAddForm(false);
  }

  const totalFields = Object.values(profile).reduce((sum, cat) => sum + Object.keys(cat).length, 0);

  if (loading) {
    return (
      <div className="soul-profile">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  return (
    <div className="soul-profile">
      {totalFields === 0 && !showAddForm && !addingCategory && (
        <div className="soul-empty">
          <div className="soul-empty-icon">✨</div>
          <p>Build this person's profile</p>
          <span>The more you add, the better the messages.</span>
        </div>
      )}

      {CATEGORIES.map(({ id, label, icon, color }) => {
        const fields = profile[id] || {};
        const fieldEntries = Object.entries(fields);
        const suggestions = (SUGGESTIONS[id] || []).filter((s) => !fields[s]);
        const isAddingHere = addingCategory === id;

        if (fieldEntries.length === 0 && suggestions.length === 0 && !isAddingHere && totalFields === 0) return null;

        return (
          <div className="soul-category" key={id}>
            <div className="soul-category-header" style={{ borderLeftColor: color }}>
              <span className="soul-category-icon">{icon}</span>
              <span className="soul-category-label">{label}</span>
              {fieldEntries.length > 0 && (
                <span className="soul-category-count">{fieldEntries.length}</span>
              )}
            </div>

            {fieldEntries.length > 0 && (
              <div className="soul-fields">
                {fieldEntries.map(([key, value]) => {
                  const isEditing = editingField === `${id}:${key}`;
                  return (
                    <div className="soul-field" key={key}>
                      <div className="soul-field-key">{key.replace(/_/g, ' ')}</div>
                      {isEditing ? (
                        <div className="soul-field-edit">
                          <input
                            ref={editRef}
                            className="soul-edit-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave(id, key);
                              if (e.key === 'Escape') setEditingField(null);
                            }}
                            onBlur={() => {
                              if (editValue.trim() && editValue !== value) {
                                handleEditSave(id, key);
                              } else {
                                setEditingField(null);
                              }
                            }}
                            disabled={saving}
                          />
                        </div>
                      ) : (
                        <div
                          className="soul-field-value"
                          onClick={() => startEdit(id, key, value)}
                          title="Tap to edit"
                        >
                          {value}
                        </div>
                      )}
                      <button
                        className="soul-field-delete"
                        onClick={() => handleDelete(id, key)}
                        disabled={saving}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="soul-suggestions">
                {suggestions.map((s) => (
                  <button
                    className="soul-chip"
                    key={s}
                    onClick={() => startSuggestion(id, s)}
                  >
                    + {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}

            {isAddingHere && (
              <div className="soul-add-inline">
                <div className="soul-add-inline-key">{newKey.replace(/_/g, ' ')}</div>
                <input
                  className="soul-add-input"
                  placeholder={`What's their ${newKey.replace(/_/g, ' ')}?`}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(id, newKey, newValue);
                    if (e.key === 'Escape') setAddingCategory(null);
                  }}
                  autoFocus
                  disabled={saving}
                />
                <div className="soul-add-inline-actions">
                  <button
                    className="btn-small"
                    onClick={() => handleAdd(id, newKey, newValue)}
                    disabled={saving || !newValue.trim()}
                  >
                    Save
                  </button>
                  <button
                    className="btn-edit-small"
                    onClick={() => setAddingCategory(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Free-form add button */}
      {!showAddForm ? (
        <button className="soul-add-btn" onClick={() => setShowAddForm(true)}>
          + Add custom field
        </button>
      ) : (
        <div className="soul-add-form card">
          <div className="form-section">
            <label>Category</label>
            <select
              value={addFormCategory}
              onChange={(e) => setAddFormCategory(e.target.value)}
              className="soul-add-select"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-section">
            <label>Field name</label>
            <input
              className="soul-add-input"
              placeholder="e.g. favorite_band"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
          </div>
          <div className="form-section">
            <label>Value</label>
            <input
              className="soul-add-input"
              placeholder="e.g. Radiohead"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd(addFormCategory, newKey, newValue);
              }}
            />
          </div>
          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={() => handleAdd(addFormCategory, newKey, newValue)}
              disabled={saving || !newKey.trim() || !newValue.trim()}
            >
              {saving ? 'Saving...' : 'Add Field'}
            </button>
            <button className="btn-secondary" onClick={() => { setShowAddForm(false); setNewKey(''); setNewValue(''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
