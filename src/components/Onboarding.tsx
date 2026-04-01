import { useState } from 'react';
import * as api from '../lib/api';

const RELATIONSHIPS = [
  { value: 'partner', label: 'Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'friend', label: 'Friend' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

const LOVE_LANGUAGES = [
  { value: 'words_of_affirmation', label: 'Words of Affirmation' },
  { value: 'acts_of_service', label: 'Acts of Service' },
  { value: 'gifts', label: 'Receiving Gifts' },
  { value: 'quality_time', label: 'Quality Time' },
  { value: 'physical_touch', label: 'Physical Touch' },
];

const SCHEDULE_TEMPLATES = [
  { id: 'good-morning', label: 'Good morning texts', desc: 'Daily at 8:00 AM', type: 'daily', time: '08:00', category: 'good-morning' },
  { id: 'weekly-check-in', label: 'Weekly check-in', desc: 'Every Monday at 10:00 AM', type: 'weekly', time: '10:00', category: 'check-in', days: [1] },
  { id: 'custom', label: 'Custom', desc: 'Set your own schedule later', type: '', time: '', category: '' },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 2: Contact form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  // Step 3: Quick profile
  const [birthday, setBirthday] = useState('');
  const [loveLanguage, setLoveLanguage] = useState('');
  const [fav1, setFav1] = useState('');
  const [fav2, setFav2] = useState('');
  const [fav3, setFav3] = useState('');

  // Step 4: Schedule
  const [selectedTemplate, setSelectedTemplate] = useState('good-morning');

  // Contact ID after creation
  const [contactId, setContactId] = useState('');

  async function handleCreateContact() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const id = name.toLowerCase().replace(/\s+/g, '-');
      await api.createContact({
        id,
        name: name.trim(),
        phone: phone.trim(),
        relationship,
      });
      setContactId(id);
      setStep(2);
    } catch {
      // Contact might already exist, still move forward
      setContactId(name.toLowerCase().replace(/\s+/g, '-'));
      setStep(2);
    }
    setSaving(false);
  }

  async function handleSaveProfile() {
    if (!contactId) { setStep(3); return; }
    setSaving(true);
    try {
      const fields: { category: string; key: string; value: string }[] = [];
      if (birthday) fields.push({ category: 'basics', key: 'birthday', value: birthday });
      if (loveLanguage) {
        await api.updateContact(contactId, { love_language: loveLanguage });
      }
      if (fav1.trim()) fields.push({ category: 'favorites', key: 'favorite_1', value: fav1.trim() });
      if (fav2.trim()) fields.push({ category: 'favorites', key: 'favorite_2', value: fav2.trim() });
      if (fav3.trim()) fields.push({ category: 'favorites', key: 'favorite_3', value: fav3.trim() });

      for (const f of fields) {
        await api.addProfileField(contactId, f);
      }
    } catch {
      // Non-critical, move on
    }
    setSaving(false);
    setStep(3);
  }

  async function handleCreateSchedule() {
    const tmpl = SCHEDULE_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!tmpl || !tmpl.type || !contactId) {
      finishOnboarding();
      return;
    }
    setSaving(true);
    try {
      const scheduleData: any = {
        contact_id: contactId,
        name: tmpl.label,
        type: tmpl.type,
        time: tmpl.time,
        category: tmpl.category,
        active: 1,
      };
      if (tmpl.id === 'weekly-check-in') {
        scheduleData.days_of_week = JSON.stringify([1]);
      }
      await api.createSchedule(scheduleData);
    } catch {
      // Non-critical
    }
    setSaving(false);
    finishOnboarding();
  }

  function finishOnboarding() {
    localStorage.setItem('onboarding_complete', '1');
    setStep(4);
  }

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', background: 'var(--bg)',
    }}>
      {/* Progress dots */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8,
        padding: '20px 0 0',
      }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            width: step === i ? 24 : 8, height: 8, borderRadius: 4,
            background: step >= i ? 'var(--accent)' : 'var(--surface-3)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 56 }}>♡</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              Welcome to Clawtner
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 300 }}>
              Your relationship CRM. Never forget to reach out to the people who matter most.
            </p>
            <button
              className="btn-primary"
              onClick={() => setStep(1)}
              style={{ marginTop: 24, padding: '14px 48px', fontSize: 16 }}
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step 1: Add first contact */}
        {step === 1 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Add your first contact
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32 }}>
              Who do you want to stay connected with?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Their name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  fontSize: 16, color: 'var(--text)', outline: 'none',
                }}
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  fontSize: 16, color: 'var(--text)', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {RELATIONSHIPS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRelationship(r.value)}
                    style={{
                      padding: '8px 18px', borderRadius: 20,
                      border: '1px solid',
                      borderColor: relationship === r.value ? 'var(--accent)' : 'var(--border)',
                      background: relationship === r.value ? 'var(--accent-soft)' : 'var(--surface)',
                      color: relationship === r.value ? 'var(--accent)' : 'var(--text-2)',
                      fontSize: 14, fontWeight: relationship === r.value ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingBottom: 40 }}>
              <button
                className="btn-primary"
                onClick={handleCreateContact}
                disabled={!name.trim() || saving}
                style={{ width: '100%', padding: '14px', fontSize: 16 }}
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Quick profile */}
        {step === 2 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Quick profile for {name}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32 }}>
              Help us personalize messages. Skip anything you're not sure about.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>
                  Birthday
                </label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--radius-sm)', width: '100%',
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    fontSize: 15, color: 'var(--text)', outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, display: 'block' }}>
                  Love Language
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {LOVE_LANGUAGES.map((ll) => (
                    <button
                      key={ll.value}
                      onClick={() => setLoveLanguage(ll.value)}
                      style={{
                        padding: '6px 14px', borderRadius: 20,
                        border: '1px solid',
                        borderColor: loveLanguage === ll.value ? 'var(--accent)' : 'var(--border)',
                        background: loveLanguage === ll.value ? 'var(--accent-soft)' : 'var(--surface)',
                        color: loveLanguage === ll.value ? 'var(--accent)' : 'var(--text-2)',
                        fontSize: 13, fontWeight: loveLanguage === ll.value ? 600 : 400,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {ll.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>
                  3 favorite things
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    placeholder="e.g. Sushi"
                    value={fav1}
                    onChange={(e) => setFav1(e.target.value)}
                    style={{
                      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)', background: 'var(--surface)',
                      fontSize: 15, color: 'var(--text)', outline: 'none',
                    }}
                  />
                  <input
                    placeholder="e.g. Hiking"
                    value={fav2}
                    onChange={(e) => setFav2(e.target.value)}
                    style={{
                      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)', background: 'var(--surface)',
                      fontSize: 15, color: 'var(--text)', outline: 'none',
                    }}
                  />
                  <input
                    placeholder="e.g. True crime podcasts"
                    value={fav3}
                    onChange={(e) => setFav3(e.target.value)}
                    style={{
                      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)', background: 'var(--surface)',
                      fontSize: 15, color: 'var(--text)', outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingBottom: 40, display: 'flex', gap: 12 }}>
              <button
                className="btn-secondary"
                onClick={() => { setStep(3); }}
                style={{ flex: 1, padding: '14px', fontSize: 15 }}
              >
                Skip
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveProfile}
                disabled={saving}
                style={{ flex: 2, padding: '14px', fontSize: 15 }}
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Set first schedule */}
        {step === 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 48 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Set your first schedule
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32 }}>
              Pick a template to get started. You can customize later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SCHEDULE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  style={{
                    padding: '16px 18px', borderRadius: 'var(--radius)',
                    border: '1px solid',
                    borderColor: selectedTemplate === tmpl.id ? 'var(--accent)' : 'var(--border)',
                    background: selectedTemplate === tmpl.id ? 'var(--accent-soft)' : 'var(--surface)',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    fontSize: 15, fontWeight: 600,
                    color: selectedTemplate === tmpl.id ? 'var(--accent)' : 'var(--text)',
                  }}>
                    {tmpl.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                    {tmpl.desc}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'auto', paddingBottom: 40 }}>
              <button
                className="btn-primary"
                onClick={handleCreateSchedule}
                disabled={saving}
                style={{ width: '100%', padding: '14px', fontSize: 16 }}
              >
                {saving ? 'Setting up...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 56 }}>🎉</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
              You're all set!
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 300 }}>
              Your first draft will appear in the queue. Review it, edit if needed, and send.
            </p>
            <button
              className="btn-primary"
              onClick={onComplete}
              style={{ marginTop: 24, padding: '14px 48px', fontSize: 16 }}
            >
              Let's Go
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
