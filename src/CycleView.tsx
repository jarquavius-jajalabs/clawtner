import { useState } from 'react'
import { Contact } from './types'
import { getCycleDay, getCurrentPhase, getPhaseDetails, getHormonelevels, formatCycleDay, daysUntilNextPeriod, daysUntilOvulation, PhaseDetail } from './cycle'

interface Props { contact: Contact; onLog: () => void }

// Shared glass card style
const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.035)',
  borderRadius: 24,
  border: '0.5px solid rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  ...extra,
})

function Ring({ day, total, phase, phases }: { day: number; total: number; phase: PhaseDetail; phases: PhaseDetail[] }) {
  const size = 200
  const stroke = 6
  const r = (size - stroke * 2) / 2
  const c = size / 2

  const arcs = phases.map(p => {
    const s1 = ((p.day_range[0] - 1) / total) * 360 - 90
    const s2 = (p.day_range[1] / total) * 360 - 90
    const r1 = (s1 * Math.PI) / 180
    const r2 = (s2 * Math.PI) / 180
    return {
      ...p,
      d: `M ${c + r * Math.cos(r1)} ${c + r * Math.sin(r1)} A ${r} ${r} 0 ${s2 - s1 > 180 ? 1 : 0} 1 ${c + r * Math.cos(r2)} ${c + r * Math.sin(r2)}`,
    }
  })

  const angle = ((day - 0.5) / total) * 360 - 90
  const rad = (angle * Math.PI) / 180
  const mx = c + r * Math.cos(rad)
  const my = c + r * Math.sin(rad)

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={stroke} />
      {arcs.map(p => (
        <path key={p.name} d={p.d} fill="none" stroke={p.color} strokeWidth={stroke} strokeLinecap="round"
          opacity={p.name === phase.name ? 0.9 : 0.08} style={{ transition: 'opacity 0.6s' }} />
      ))}
      <circle cx={mx} cy={my} r={5} fill={phase.color} filter="url(#glow)" />
      <text x={c} y={c - 10} textAnchor="middle" fill={phase.color} fontSize="46" fontWeight="800" fontFamily="Inter" style={{ letterSpacing: '-3px' }}>{day}</text>
      <text x={c} y={c + 14} textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="11" fontWeight="500" fontFamily="Inter" style={{ letterSpacing: '2px' }}>OF {total}</text>
    </svg>
  )
}

export default function CycleView({ contact, onLog }: Props) {
  const [open, setOpen] = useState<string | null>(null)

  if (!contact.last_period_start) return null

  const rawDay = getCycleDay(contact.last_period_start)
  const cl = contact.cycle_length || 28
  const day = formatCycleDay(rawDay, cl)
  const phase = getCurrentPhase(rawDay, cl)
  const phases = getPhaseDetails(cl)
  const h = getHormonelevels(rawDay, cl)
  const np = daysUntilNextPeriod(rawDay, cl)
  const no = daysUntilOvulation(rawDay, cl)

  const px = 16

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Ring hero */}
      <div style={{ ...glass({ padding: '28px 20px 24px', margin: `0 ${px}px 12px`, position: 'relative', overflow: 'hidden' }) }}>
        {/* Mesh gradient bg */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          background: `radial-gradient(circle, ${phase.color}12, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40, width: 160, height: 160,
          background: `radial-gradient(circle, ${phase.color}08, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
            {contact.name}
          </div>
          <Ring day={day} total={cl} phase={phase} phases={phases} />
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.02em' }}>{phase.name}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginLeft: 8 }}>{phase.tagline}</span>
          </div>
        </div>
      </div>

      {/* Bento grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: `0 ${px}px`, marginBottom: 12 }}>
        {/* Period countdown */}
        <div style={glass({ padding: '20px', position: 'relative', overflow: 'hidden' })}>
          <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, background: 'radial-gradient(circle, rgba(248,113,113,0.08), transparent)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Period</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: np <= 3 ? '#f87171' : 'rgba(255,255,255,0.8)' }}>{np}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>days away</div>
        </div>

        {/* Ovulation */}
        <div style={glass({ padding: '20px', position: 'relative', overflow: 'hidden' })}>
          <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, background: 'radial-gradient(circle, rgba(50,213,131,0.08), transparent)', pointerEvents: 'none' }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Ovulation</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', color: no === 0 ? '#32d583' : 'rgba(255,255,255,0.8)' }}>
            {no === 0 ? 'Now' : no}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{no === 0 ? 'fertile window' : 'days away'}</div>
        </div>

        {/* Energy + Libido */}
        <div style={glass({ padding: '20px' })}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Energy</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= phase.energy_level ? phase.color : 'rgba(255,255,255,0.05)', opacity: i <= phase.energy_level ? 0.7 : 1, transition: 'background 0.4s' }} />
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 18, marginBottom: 14 }}>Libido</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= phase.libido_level ? '#f87171' : 'rgba(255,255,255,0.05)', opacity: i <= phase.libido_level ? 0.7 : 1 }} />
            ))}
          </div>
        </div>

        {/* Mood */}
        <div style={glass({ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' })}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Mood</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.8)' }}>
              {phase.mood_stability >= 4 ? 'Stable' : phase.mood_stability >= 3 ? 'Mixed' : phase.mood_stability >= 2 ? 'Shaky' : 'Storm'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= phase.mood_stability ? '#b093f5' : 'rgba(255,255,255,0.05)', opacity: i <= phase.mood_stability ? 0.7 : 1 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Vibe check - full width */}
      <div style={{ ...glass({ padding: '20px 22px', margin: `0 ${px}px 12px` }) }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Vibe Check</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{phase.partner_tips[0]}</div>
      </div>

      {/* Hormone bars - full width */}
      <div style={{ ...glass({ padding: '22px', margin: `0 ${px}px 8px`, cursor: 'pointer' }), ...(open === 'hormones' ? {} : {}) }}
        onClick={() => setOpen(open === 'hormones' ? null : 'hormones')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open === 'hormones' ? 18 : 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.7)' }}>Hormones</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', transform: open === 'hormones' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▾</span>
        </div>

        {/* Always show mini bars */}
        {open !== 'hormones' && (
          <div style={{ display: 'flex', gap: 6, height: 3 }}>
            {[
              { val: h.estrogen, color: '#6cb4ee' },
              { val: h.progesterone, color: '#b093f5' },
              { val: h.lh, color: '#32d583' },
              { val: h.fsh, color: '#fb923c' },
              { val: h.testosterone, color: '#f87171' },
            ].map((bar, i) => (
              <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${bar.val}%`, background: bar.color, borderRadius: 2, opacity: 0.6 }} />
              </div>
            ))}
          </div>
        )}

        {open === 'hormones' && (
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, marginBottom: 20 }}>{phase.hormones}</p>
            {[
              { name: 'Estrogen', val: h.estrogen, color: '#6cb4ee' },
              { name: 'Progesterone', val: h.progesterone, color: '#b093f5' },
              { name: 'LH', val: h.lh, color: '#32d583' },
              { name: 'FSH', val: h.fsh, color: '#fb923c' },
              { name: 'Testosterone', val: h.testosterone, color: '#f87171' },
            ].map(bar => (
              <div key={bar.name} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{bar.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>
                    {bar.val < 20 ? 'Very Low' : bar.val < 35 ? 'Low' : bar.val < 55 ? 'Moderate' : bar.val < 75 ? 'High' : 'Peak'}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${bar.val}%`, background: `linear-gradient(90deg, ${bar.color}50, ${bar.color})`, borderRadius: 2, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: 18, background: 'rgba(255,255,255,0.025)', borderRadius: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.15)', marginBottom: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Details</div>
              {phase.hormoneDetail.map((d, i) => (
                <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, marginBottom: 10, paddingLeft: 16, borderLeft: `1.5px solid ${phase.color}12` }}>{d}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable sections */}
      {[
        { id: 'body', title: 'Her Body', items: phase.body },
        { id: 'mood', title: 'Emotional State', desc: phase.description, items: phase.mood },
      ].map(sec => (
        <div key={sec.id} style={{ ...glass({ margin: `0 ${px}px 8px`, cursor: 'pointer' }) }}
          onClick={() => setOpen(open === sec.id ? null : sec.id)}>
          <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.7)' }}>{sec.title}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', transform: open === sec.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▾</span>
          </div>
          {open === sec.id && (
            <div style={{ padding: '0 22px 22px' }}>
              {sec.desc && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, marginBottom: 16 }}>{sec.desc}</p>}
              {sec.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: `${phase.color}35`, marginTop: 8, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Partner Guide */}
      <div style={{ ...glass({ margin: `0 ${px}px 8px`, cursor: 'pointer' }) }}
        onClick={() => setOpen(open === 'tips' ? null : 'tips')}>
        <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.7)' }}>Partner Guide</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', transform: open === 'tips' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▾</span>
        </div>
        {open === 'tips' && (
          <div style={{ padding: '0 22px 22px' }}>
            {[
              { label: 'Do', color: '#32d583', items: phase.do_this },
              { label: "Don't", color: '#f87171', items: phase.avoid_this },
              { label: 'Pro Tips', color: '#b093f5', items: phase.partner_tips },
            ].map(block => (
              <div key={block.label} style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: `${block.color}80`, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{block.label}</div>
                {block.items.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, marginBottom: 10, paddingLeft: 16, borderLeft: `1.5px solid ${block.color}15` }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Phases */}
      <div style={{ ...glass({ margin: `0 ${px}px 8px`, cursor: 'pointer' }) }}
        onClick={() => setOpen(open === 'guide' ? null : 'guide')}>
        <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.7)' }}>All Phases</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', transform: open === 'guide' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>▾</span>
        </div>
        {open === 'guide' && (
          <div style={{ padding: '0 22px 22px' }} onClick={e => e.stopPropagation()}>
            {phases.map(p => {
              const now = p.name === phase.name
              return (
                <div key={p.name} style={{
                  padding: '18px 20px', borderRadius: 20, marginBottom: 6,
                  background: now ? `${p.color}08` : 'rgba(255,255,255,0.02)',
                  border: `0.5px solid ${now ? p.color + '12' : 'rgba(255,255,255,0.03)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, opacity: 0.4 }}>{p.icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: now ? p.color : 'rgba(255,255,255,0.6)' }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)', marginLeft: 8 }}>Day {p.day_range[0]}–{p.day_range[1]}</span>
                    </div>
                    {now && <span style={{ fontSize: 8, background: `${p.color}10`, color: p.color, padding: '3px 8px', borderRadius: 100, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Now</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, marginTop: 8 }}>{p.description}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Log */}
      <div style={{ padding: `12px ${px}px 0` }}>
        <button onClick={onLog} style={{
          width: '100%', padding: '16px', background: `${phase.color}08`,
          border: `0.5px solid ${phase.color}15`, borderRadius: 20,
          color: phase.color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          letterSpacing: '0.01em',
        }}>
          Log Period Start
        </button>
      </div>
    </div>
  )
}
