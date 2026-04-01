import { useState, useRef } from 'react';
import * as api from '../lib/api';

interface CycleImportProps {
  contactId: string;
  onImported: () => void;
  onClose: () => void;
}

export default function CycleImport({ contactId, onImported, onClose }: CycleImportProps) {
  const [mode, setMode] = useState<'choose' | 'manual' | 'csv'>('choose');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Manual entry state
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');

  // CSV state
  const [csvData, setCsvData] = useState<{ date: string; flow: string; notes: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleManualSave() {
    if (!lastPeriod) { setError('Please select a date'); return; }
    const cl = parseInt(cycleLength);
    const pl = parseInt(periodLength);
    if (isNaN(cl) || cl < 20 || cl > 45) { setError('Cycle length should be 20-45 days'); return; }
    if (isNaN(pl) || pl < 1 || pl > 10) { setError('Period length should be 1-10 days'); return; }

    setSaving(true);
    setError('');
    try {
      await api.createCycle({
        contact_id: contactId,
        cycle_start: lastPeriod,
        cycle_length: cl,
        period_length: pl,
      });
      onImported();
    } catch {
      setError('Failed to save. Please try again.');
    }
    setSaving(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.trim().split('\n');
        if (lines.length < 2) { setError('CSV needs a header row and at least one data row'); return; }

        const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
        const dateIdx = header.findIndex((h) => h === 'date' || h === 'start_date' || h === 'period_start');
        const flowIdx = header.findIndex((h) => h === 'flow' || h === 'intensity');
        const notesIdx = header.findIndex((h) => h === 'notes' || h === 'note');

        if (dateIdx === -1) { setError('CSV must have a "date" column'); return; }

        const rows: { date: string; flow: string; notes: string }[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim());
          if (!cols[dateIdx]) continue;
          rows.push({
            date: cols[dateIdx],
            flow: flowIdx >= 0 ? cols[flowIdx] || '' : '',
            notes: notesIdx >= 0 ? cols[notesIdx] || '' : '',
          });
        }

        if (rows.length === 0) { setError('No valid rows found'); return; }
        setCsvData(rows);
      } catch {
        setError('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  }

  async function handleCsvImport() {
    if (csvData.length === 0) return;
    setSaving(true);
    setError('');

    try {
      // Sort by date, use the most recent as cycle start
      const sorted = [...csvData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const mostRecent = sorted[0].date;

      // Calculate average cycle length from dates if we have enough data
      let avgCycleLength = 28;
      let avgPeriodLength = 5;

      if (sorted.length >= 2) {
        const gaps: number[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
          const d1 = new Date(sorted[i].date).getTime();
          const d2 = new Date(sorted[i + 1].date).getTime();
          const gap = Math.round((d1 - d2) / 86400000);
          if (gap > 15 && gap < 50) gaps.push(gap);
        }
        if (gaps.length > 0) {
          avgCycleLength = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        }
      }

      // Look at flow data to estimate period length
      const flowEntries = csvData.filter((r) => {
        const f = r.flow.toLowerCase();
        return f && f !== '0' && f !== 'none' && f !== 'spotting';
      });
      if (flowEntries.length > 0 && sorted.length > 0) {
        // Count consecutive flow days from the most recent period
        let pDays = 0;
        const startDate = new Date(mostRecent);
        for (const row of csvData) {
          const d = new Date(row.date);
          const diff = Math.abs(d.getTime() - startDate.getTime()) / 86400000;
          if (diff < 10 && row.flow && row.flow.toLowerCase() !== 'none' && row.flow !== '0') {
            pDays++;
          }
        }
        if (pDays >= 2 && pDays <= 10) avgPeriodLength = pDays;
      }

      await api.createCycle({
        contact_id: contactId,
        cycle_start: mostRecent,
        cycle_length: avgCycleLength,
        period_length: avgPeriodLength,
      });
      onImported();
    } catch {
      setError('Failed to import. Please try again.');
    }
    setSaving(false);
  }

  const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    zIndex: 100, padding: '0 0 0',
  };

  const modalContent: React.CSSProperties = {
    background: 'var(--bg)', borderRadius: '20px 20px 0 0',
    width: '100%', maxWidth: 430, maxHeight: '85dvh',
    overflow: 'auto', padding: '24px 20px 32px',
  };

  return (
    <div style={modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalContent}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Import Cycle Data</h3>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: 'var(--surface-2)', color: 'var(--text-2)',
              fontSize: 18, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(224, 82, 82, 0.08)', border: '1px solid rgba(224, 82, 82, 0.2)',
            color: 'var(--red)', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Mode selector */}
        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setMode('manual')}
              style={{
                padding: '18px 16px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--surface)',
                textAlign: 'left', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Manual Entry</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                Enter last period date and averages
              </div>
            </button>
            <button
              onClick={() => setMode('csv')}
              style={{
                padding: '18px 16px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--surface)',
                textAlign: 'left', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>CSV Upload</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                Import from a CSV file (date, flow, notes)
              </div>
            </button>
          </div>
        )}

        {/* Manual entry form */}
        {mode === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>
                Last period start date
              </label>
              <input
                type="date"
                value={lastPeriod}
                onChange={(e) => setLastPeriod(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  fontSize: 15, color: 'var(--text)', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>
                Average cycle length (days)
              </label>
              <input
                type="number"
                min="20" max="45"
                value={cycleLength}
                onChange={(e) => setCycleLength(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  fontSize: 15, color: 'var(--text)', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, display: 'block' }}>
                Average period length (days)
              </label>
              <input
                type="number"
                min="1" max="10"
                value={periodLength}
                onChange={(e) => setPeriodLength(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  fontSize: 15, color: 'var(--text)', outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-secondary" onClick={() => setMode('choose')} style={{ flex: 1 }}>Back</button>
              <button className="btn-primary" onClick={handleManualSave} disabled={saving} style={{ flex: 2 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* CSV upload */}
        {mode === 'csv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                padding: '32px 16px', borderRadius: 'var(--radius)',
                border: '2px dashed var(--border)', background: 'var(--surface)',
                textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
                {csvData.length > 0 ? `${csvData.length} rows loaded` : 'Tap to select CSV file'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                Columns: date, flow, notes
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {csvData.length > 0 && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                maxHeight: 160, overflow: 'auto',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
                  Preview (first 5 rows)
                </div>
                {csvData.slice(0, 5).map((row, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-2)', padding: '3px 0', borderBottom: i < 4 ? '1px solid var(--border-soft)' : 'none' }}>
                    {row.date} {row.flow && `· ${row.flow}`} {row.notes && `· ${row.notes}`}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-secondary" onClick={() => { setMode('choose'); setCsvData([]); }} style={{ flex: 1 }}>Back</button>
              <button className="btn-primary" onClick={handleCsvImport} disabled={saving || csvData.length === 0} style={{ flex: 2 }}>
                {saving ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
