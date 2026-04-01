import { useState, useEffect } from 'react';
import { Contact } from '../lib/types';
import * as api from '../lib/api';

interface CycleData {
  id?: string;
  cycleStart: string;
  cycleLength: number;
  periodLength: number;
}

interface PhaseData {
  key: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  label: string;
  days: string;
  color: string;
  colorSoft: string;
  icon: string;
  exercise: string;
  nutrition: string;
  mindset: string;
  mood: string;
  energy: string;
  partnerTip: string;
  biochem: {
    summary: string;
    hormones: { name: string; level: string; role: string }[];
    whatsHappening: string;
    neurotransmitters: string;
    keyMetabolism: string;
  };
}

const PHASES: PhaseData[] = [
  {
    key: 'menstrual', label: 'Menstrual', days: 'Days 1-5',
    color: '#C07088', colorSoft: 'rgba(192, 112, 136, 0.12)',
    icon: '🌙',
    exercise: 'Low-intensity: walking, hiking, Pilates, yoga, stretching',
    nutrition: 'Iron-rich foods, vitamins C & K, omega-3 fatty acids. Leafy greens, lean red meats, lentils, citrus, flaxseeds.',
    mindset: 'Breathing exercises, journaling, meditation. Rest and introspection.',
    mood: 'May feel tired or emotional',
    energy: 'Low — rest is important',
    partnerTip: 'Be extra gentle and thoughtful. Comfort food, cozy vibes. Warm drinks, blankets, patience.',
    biochem: {
      summary: 'The corpus luteum has degenerated. Progesterone and estrogen are at their lowest, triggering the endometrial lining to shed. Prostaglandins drive uterine contractions.',
      hormones: [
        { name: 'Estradiol (E2)', level: '30-50 pg/mL (nadir)', role: 'At its lowest point. The drop from luteal phase levels is what triggers menstruation. Receptors in the uterus lose their growth signal.' },
        { name: 'Progesterone', level: '<1 ng/mL (baseline)', role: 'Withdrawal of progesterone destabilizes the endometrial lining. Spiral arteries constrict, cutting off blood supply to the functional layer.' },
        { name: 'FSH', level: '3-10 mIU/mL (rising)', role: 'Anterior pituitary begins releasing FSH as inhibin B drops. This starts recruiting a cohort of 6-12 antral follicles in the ovaries.' },
        { name: 'LH', level: '2-8 mIU/mL (low)', role: 'Baseline pulsatile release from the pituitary. GnRH pulse frequency is slow (~every 90 min), favoring FSH over LH.' },
        { name: 'Prostaglandins (PGF2α)', level: 'Elevated', role: 'Released from degenerating endometrium. Causes myometrial contractions (cramps). Also triggers local inflammation to facilitate tissue breakdown.' },
      ],
      whatsHappening: 'The functional layer of the endometrium (2-5mm thick) is shedding. Matrix metalloproteinases (MMPs) break down the extracellular matrix. Simultaneously, the basal layer begins regeneration via stem cells. Average blood loss is 30-40 mL over 3-5 days.',
      neurotransmitters: 'Serotonin is at its lowest due to estrogen withdrawal (estrogen upregulates tryptophan hydroxylase). GABA sensitivity drops as progesterone metabolite allopregnanolone clears. This combination explains mood dips and increased pain sensitivity.',
      keyMetabolism: 'Iron loss averages 12-15 mg per cycle. Ferritin may drop if not replenished. Inflammatory cytokines (IL-1, IL-6, TNF-α) are elevated locally. Basal metabolic rate decreases slightly.',
    },
  },
  {
    key: 'follicular', label: 'Follicular', days: 'Days 6-14',
    color: '#5BA899', colorSoft: 'rgba(91, 168, 153, 0.12)',
    icon: '🌱',
    exercise: 'Challenge yourself: HIIT, strength training, running, cycling',
    nutrition: 'Protein for muscle repair: lean meats, eggs, quinoa, legumes. Fresh fruit, fiber, leafy greens, healthy fats, fermented foods, seeds.',
    mindset: 'Start new projects, brainstorm, socialize, meal plan, try new things. Creativity peaks.',
    mood: 'Energy rising, feeling optimistic',
    energy: 'Building — great for new plans',
    partnerTip: 'She\'s feeling social and creative. Plan a date or adventure together.',
    biochem: {
      summary: 'FSH drives follicle competition. One dominant follicle emerges by day 7-8 and begins producing large amounts of estradiol. Rising estrogen rebuilds the uterine lining and improves mood, cognition, and energy.',
      hormones: [
        { name: 'Estradiol (E2)', level: '50-200 pg/mL → peaks ~300+ pg/mL', role: 'Produced by granulosa cells of the dominant follicle via aromatase conversion of androgens. Drives endometrial proliferation (lining thickens 1-3mm to 8-12mm). Also increases cervical mucus production and upregulates LH receptors on the follicle.' },
        { name: 'FSH', level: '3-10 mIU/mL (declining)', role: 'Initially drives follicle recruitment, but falls as the dominant follicle produces inhibin B, which suppresses FSH at the pituitary. This "selection" mechanism ensures usually one follicle matures.' },
        { name: 'LH', level: '5-15 mIU/mL (slowly rising)', role: 'GnRH pulse frequency increases to ~every 60 min, shifting pituitary output toward LH. Theca cells respond by producing androgens (androstenedione) which granulosa cells convert to estradiol.' },
        { name: 'Inhibin B', level: 'Rising', role: 'Secreted by the dominant follicle. Selectively suppresses FSH (not LH) at the pituitary, causing smaller follicles to undergo atresia. A key part of the single-ovulation mechanism.' },
        { name: 'Testosterone', level: 'Gradually rising', role: 'Theca cells ramp up androgen production under LH. Mid-follicular T levels contribute to increased libido, confidence, and energy. Peaks just before ovulation.' },
      ],
      whatsHappening: 'The dominant follicle grows from ~10mm to ~20mm. Inside, the oocyte completes meiosis I. The endometrium enters the proliferative phase: straight tubular glands, spiral arteries elongate, and the functional layer rebuilds. Cervical mucus transitions from thick/scanty to thin/elastic/clear (Spinnbarkeit).',
      neurotransmitters: 'Rising estrogen boosts serotonin synthesis, dopamine receptor density, and BDNF (brain-derived neurotrophic factor). This is why cognitive performance, verbal fluency, and mood tend to improve. Endorphin sensitivity also increases, making exercise feel more rewarding.',
      keyMetabolism: 'Insulin sensitivity is higher in this phase (best time for carb-heavy meals if any). Estrogen promotes fat oxidation and glycogen storage in muscles, supporting athletic performance. Collagen synthesis increases.',
    },
  },
  {
    key: 'ovulation', label: 'Ovulation', days: 'Days 15-17',
    color: '#D4A03D', colorSoft: 'rgba(212, 160, 61, 0.12)',
    icon: '☀️',
    exercise: 'Endurance workouts: circuit training, HIIT, dance workouts, boot camp',
    nutrition: 'Lean proteins, antioxidants, magnesium-rich foods, fiber. Berries, dark chocolate, almonds, cruciferous vegetables.',
    mindset: 'Peak energy. Go on dates, socialize, public speaking, work on goals, creative projects.',
    mood: 'Confident, social, high energy',
    energy: 'Peak energy and libido',
    partnerTip: 'Best time for date nights. Compliments land extra well. Plan something special.',
    biochem: {
      summary: 'Estradiol exceeds ~200 pg/mL for 50+ hours, triggering a positive feedback switch at the hypothalamus. This causes the LH surge — a massive 10-20x spike that triggers ovulation within 24-36 hours.',
      hormones: [
        { name: 'LH', level: '25-100 mIU/mL (THE SURGE)', role: 'The surge lasts 24-48 hours. It triggers resumption of meiosis II in the oocyte, luteinization of granulosa cells, synthesis of prostaglandins and proteases that weaken the follicle wall, and ultimately follicle rupture. The single most important hormonal event of the cycle.' },
        { name: 'FSH', level: '10-25 mIU/mL (mid-cycle surge)', role: 'A smaller parallel surge occurs. Helps ensure complete oocyte maturation and expansion of the cumulus oophorus (the cell cloud around the egg that aids in fallopian tube capture).' },
        { name: 'Estradiol (E2)', level: '300-500 pg/mL → sharp drop', role: 'Peaks just before the LH surge, then drops rapidly as the follicle shifts from estrogen to progesterone production. This is the "positive feedback" trigger — sustained high E2 flips the hypothalamic response from suppressive to stimulatory.' },
        { name: 'Progesterone', level: '1-3 ng/mL (beginning to rise)', role: 'The periovulatory progesterone rise is critical — it amplifies the LH surge, raises basal body temperature by 0.3-0.5°C, and starts preparing the endometrium for its secretory transformation.' },
        { name: 'Testosterone', level: 'Peak (~50-70 ng/dL)', role: 'Highest point in the cycle. Drives peak libido, assertiveness, and energy. Rapidly drops after ovulation as theca cells luteinize and shift to progesterone production.' },
      ],
      whatsHappening: 'The follicle wall thins via collagenase and plasmin. Ovulation is essentially a controlled inflammatory event — the follicle ruptures and releases the oocyte with its cumulus cells into the peritoneal cavity. Fimbriae of the fallopian tube sweep the oocyte into the ampulla. The collapsed follicle begins transforming into the corpus luteum within hours. Basal body temp rises ~0.3-0.5°C and stays elevated through the luteal phase.',
      neurotransmitters: 'Peak dopamine and norepinephrine drive the "glow" effect — increased sociability, risk tolerance, and attraction signaling. Oxytocin sensitivity is elevated. Some women experience mittelschmerz (ovulation pain) from peritoneal irritation by follicular fluid.',
      keyMetabolism: 'Brief inflammatory spike (C-reactive protein may rise). Cervical mucus is at peak fertility — raw egg white consistency, >10cm Spinnbarkeit. Some women notice mild bloating from the fluid shift. Metabolic rate begins to climb.',
    },
  },
  {
    key: 'luteal', label: 'Luteal', days: 'Days 18-28',
    color: '#8B7BBF', colorSoft: 'rgba(139, 123, 191, 0.12)',
    icon: '🍂',
    exercise: 'Scale back gradually: weight training, swimming, yoga, Pilates, walking',
    nutrition: 'Complex carbs, healthy fats, protein. Magnesium, calcium, B vitamins, vitamin D to ease PMS.',
    mindset: 'Complete tasks and projects, positive affirmations, breathing exercises. Heightened attention to detail.',
    mood: 'Winding down, may feel sensitive',
    energy: 'Declining — cravings may kick in',
    partnerTip: 'Extra patience. Surprise her with her favorite snack or flowers. Cozy night in.',
    biochem: {
      summary: 'The corpus luteum is a temporary endocrine organ formed from the ruptured follicle. It produces high levels of progesterone and moderate estradiol to maintain the endometrium. Without hCG from an embryo, it degrades after ~12 days.',
      hormones: [
        { name: 'Progesterone', level: '5-20 ng/mL (peak at day 21-23)', role: 'Dominant hormone of this phase. Converts the endometrium from proliferative to secretory: glands become coiled and filled with glycogen, spiral arteries fully develop, and the lining becomes receptive for implantation (the "window of implantation" is days 20-24). Also suppresses GnRH/LH pulsatility to prevent new follicle development.' },
        { name: 'Estradiol (E2)', level: '100-200 pg/mL (secondary rise)', role: 'The corpus luteum produces a secondary estrogen peak. Works synergistically with progesterone to maintain endometrial stability. Falls sharply in the final 2-3 days when the corpus luteum involutes.' },
        { name: 'LH', level: '2-8 mIU/mL (suppressed)', role: 'Progesterone slows GnRH pulse frequency back to ~every 3-4 hours. This slow frequency favors FSH over LH, setting the stage for the next cycle. Low LH also means the corpus luteum gradually loses trophic support.' },
        { name: 'Inhibin A', level: 'Elevated', role: 'Produced by the corpus luteum (replacing inhibin B from the follicular phase). Suppresses FSH to prevent premature follicle recruitment. Falls when the corpus luteum degrades, allowing FSH to rise and start the next cycle.' },
        { name: 'Allopregnanolone', level: 'Rises with progesterone', role: 'A neuroactive progesterone metabolite that acts as a positive allosteric modulator of GABA-A receptors. Produces anxiolytic and sedative effects early in the luteal phase. Rapid withdrawal in late luteal contributes to PMS/PMDD anxiety and irritability.' },
      ],
      whatsHappening: 'The corpus luteum is one of the most vascularized structures in the body — it receives the highest blood flow per gram of any organ. If no implantation occurs, luteolysis begins around day 24-25: blood vessels constrict, immune cells infiltrate, and progesterone output crashes. The endometrium destabilizes as spiral arteries rhythmically constrict and relax, causing focal ischemia. Prostaglandin synthesis ramps up in preparation for menstruation.',
      neurotransmitters: 'Progesterone and allopregnanolone initially boost GABA activity (calming). But as the corpus luteum fails and levels drop rapidly in late luteal phase, the brain experiences a withdrawal-like state. Serotonin drops (progesterone downregulates 5-HT1A receptors), contributing to irritability, anxiety, and carb cravings. MAO-A activity increases, accelerating serotonin and dopamine breakdown.',
      keyMetabolism: 'Basal metabolic rate increases 100-300 kcal/day (the body is literally burning more energy preparing for potential pregnancy). This drives increased appetite and carb cravings — not lack of willpower, it is a real metabolic demand. Insulin sensitivity decreases. Water retention increases due to aldosterone effects of progesterone. Core body temp stays elevated 0.3-0.5°C above follicular baseline.',
    },
  },
];

function getCycleDay(cycleStart: string, cycleLength: number): number {
  if (!cycleStart) return 1;
  const start = new Date(cycleStart + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return 1;
  return ((diff % cycleLength) + cycleLength) % cycleLength + 1;
}

function getPhaseIndex(day: number, periodLength: number, cycleLength: number): number {
  if (day <= periodLength) return 0; // menstrual
  if (day <= Math.round(cycleLength * 0.5)) return 1; // follicular
  if (day <= Math.round(cycleLength * 0.6)) return 2; // ovulation
  return 3; // luteal
}

// SVG arc path helper
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function CycleWheel({
  day,
  cycleLength,
  periodLength,
  activePhase,
  onPhaseClick,
}: {
  day: number;
  cycleLength: number;
  periodLength: number;
  activePhase: number;
  onPhaseClick: (i: number) => void;
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 115;
  const innerR = 70;
  const midR = (outerR + innerR) / 2;
  const strokeW = outerR - innerR;

  // Phase boundaries as fractions of cycle
  const menstrualEnd = periodLength / cycleLength;
  const follicularEnd = 0.5;
  const ovulationEnd = 0.6;
  const phaseBounds = [0, menstrualEnd, follicularEnd, ovulationEnd, 1];

  // Day marker position
  const dayFraction = (day - 0.5) / cycleLength;
  const dayAngle = dayFraction * 360;
  const markerPos = polarToCartesian(cx, cy, midR, dayAngle);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Phase arcs */}
      {PHASES.map((phase, i) => {
        const startAngle = phaseBounds[i] * 360;
        const endAngle = phaseBounds[i + 1] * 360;
        const arcPath = describeArc(cx, cy, midR, startAngle, endAngle - 0.5);
        const isActive = i === activePhase;
        const labelAngle = (startAngle + endAngle) / 2;
        const labelPos = polarToCartesian(cx, cy, midR, labelAngle);

        return (
          <g key={phase.key} onClick={() => onPhaseClick(i)} style={{ cursor: 'pointer' }}>
            <path
              d={arcPath}
              fill="none"
              stroke={phase.color}
              strokeWidth={strokeW}
              strokeLinecap="butt"
              opacity={isActive ? 1 : 0.35}
              style={{ transition: 'opacity 0.3s' }}
            />
            {/* Phase label on arc */}
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isActive ? 'var(--text)' : 'var(--text-3)'}
              fontSize="10"
              fontWeight="600"
              letterSpacing="0.5"
              style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
            >
              {phase.label}
            </text>
          </g>
        );
      })}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={innerR - 6} fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="var(--text)" fontSize="36" fontWeight="800" letterSpacing="-2">
        {day}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="var(--text-3)" fontSize="11" fontWeight="500" letterSpacing="0.5">
        of {cycleLength}
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" fill={PHASES[activePhase].color} fontSize="10" fontWeight="600">
        {PHASES[activePhase].icon} {PHASES[activePhase].label}
      </text>

      {/* Day marker */}
      <circle
        cx={markerPos.x}
        cy={markerPos.y}
        r={8}
        fill="var(--surface)"
        stroke="var(--bg)"
        strokeWidth="3"
      />
      <circle
        cx={markerPos.x}
        cy={markerPos.y}
        r={4}
        fill={PHASES[getPhaseIndex(day, periodLength, cycleLength)].color}
      />

      {/* Small day tick marks */}
      {Array.from({ length: cycleLength }, (_, i) => {
        const angle = ((i + 0.5) / cycleLength) * 360;
        const outerTick = polarToCartesian(cx, cy, outerR + 2, angle);
        const innerTick = polarToCartesian(cx, cy, outerR - 2, angle);
        const isCurrent = i + 1 === day;
        return (
          <line
            key={i}
            x1={outerTick.x} y1={outerTick.y}
            x2={innerTick.x} y2={innerTick.y}
            stroke={isCurrent ? 'var(--accent)' : 'var(--border)'}
            strokeWidth={isCurrent ? 2 : 0.5}
          />
        );
      })}
    </svg>
  );
}

// Hormone data points (normalized 0-1) across 28 days based on actual physiology
// Sources: standard reproductive endocrinology curves
const HORMONE_CURVES = {
  estrogen: {
    color: '#E8A0BF',
    label: 'Estrogen',
    // Low during menstruation, rises through follicular, peaks just before ovulation, 
    // secondary smaller rise in mid-luteal, drops at end
    points: [
      0.10, 0.08, 0.07, 0.08, 0.10, // days 1-5 (menstrual)
      0.15, 0.22, 0.30, 0.40, 0.52, // days 6-10 (follicular rising)
      0.65, 0.78, 0.88, 0.95,        // days 11-14 (follicular peak)
      0.70, 0.45, 0.35,              // days 15-17 (ovulation drop)
      0.40, 0.48, 0.55, 0.58, 0.55, // days 18-22 (luteal secondary rise)
      0.48, 0.40, 0.30, 0.22, 0.15, 0.10, // days 23-28 (luteal decline)
    ],
  },
  progesterone: {
    color: '#B0A0D4',
    label: 'Progesterone',
    // Near zero until after ovulation, then rises sharply, peaks mid-luteal, drops
    points: [
      0.03, 0.03, 0.02, 0.02, 0.02, // days 1-5
      0.03, 0.03, 0.03, 0.04, 0.04, // days 6-10
      0.04, 0.05, 0.05, 0.05,        // days 11-14
      0.08, 0.15, 0.25,              // days 15-17 (post-ovulation rise)
      0.45, 0.62, 0.78, 0.90, 0.95, // days 18-22 (corpus luteum peak)
      0.88, 0.72, 0.50, 0.30, 0.15, 0.05, // days 23-28 (decline)
    ],
  },
  lh: {
    color: '#F2C57C',
    label: 'LH',
    // Low baseline with dramatic spike at ovulation
    points: [
      0.08, 0.08, 0.07, 0.07, 0.08, // days 1-5
      0.08, 0.09, 0.09, 0.10, 0.10, // days 6-10
      0.11, 0.12, 0.18, 0.45,        // days 11-14 (building)
      1.00, 0.40, 0.12,              // days 15-17 (THE SURGE then crash)
      0.10, 0.09, 0.08, 0.08, 0.07, // days 18-22
      0.07, 0.07, 0.06, 0.06, 0.07, 0.07, // days 23-28
    ],
  },
  fsh: {
    color: '#7EC8B8',
    label: 'FSH',
    // Elevated early follicular, drops as dominant follicle selected, small secondary rise at ovulation
    points: [
      0.45, 0.50, 0.55, 0.52, 0.48, // days 1-5 (elevated to recruit follicles)
      0.42, 0.35, 0.28, 0.22, 0.18, // days 6-10 (drops as inhibin rises)
      0.15, 0.14, 0.16, 0.25,        // days 11-14
      0.50, 0.22, 0.12,              // days 15-17 (small surge with LH)
      0.10, 0.09, 0.08, 0.08, 0.08, // days 18-22
      0.09, 0.10, 0.12, 0.18, 0.25, 0.35, // days 23-28 (rising for next cycle)
    ],
  },
  testosterone: {
    color: '#FF8C66',
    label: 'Testosterone',
    // Gradual rise through follicular, peaks at ovulation, drops in luteal
    points: [
      0.20, 0.18, 0.18, 0.20, 0.22, // days 1-5
      0.25, 0.30, 0.35, 0.40, 0.45, // days 6-10
      0.52, 0.60, 0.70, 0.82,        // days 11-14 (rising)
      0.95, 0.75, 0.50,              // days 15-17 (peak then drop)
      0.38, 0.32, 0.28, 0.25, 0.22, // days 18-22
      0.20, 0.18, 0.18, 0.18, 0.20, 0.20, // days 23-28
    ],
  },
};

type HormoneKey = keyof typeof HORMONE_CURVES;

function HormoneChart({
  currentDay,
  cycleLength,
  periodLength,
}: {
  currentDay: number;
  cycleLength: number;
  periodLength: number;
}) {
  const [activeHormones, setActiveHormones] = useState<Set<HormoneKey>>(
    new Set(['estrogen', 'progesterone', 'testosterone'])
  );
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const width = 380;
  const height = 180;
  const padL = 6;
  const padR = 6;
  const padT = 12;
  const padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  function toggleHormone(key: HormoneKey) {
    setActiveHormones(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Interpolate 28-point data to match actual cycle length
  function getInterpolatedPoints(points: number[]): number[] {
    const result: number[] = [];
    for (let d = 0; d < cycleLength; d++) {
      const ratio = d / (cycleLength - 1);
      const srcIdx = ratio * (points.length - 1);
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, points.length - 1);
      const t = srcIdx - lo;
      result.push(points[lo] * (1 - t) + points[hi] * t);
    }
    return result;
  }

  function pointsToPath(points: number[]): string {
    const interpolated = getInterpolatedPoints(points);
    // Smooth curve using cubic bezier
    let path = '';
    for (let i = 0; i < interpolated.length; i++) {
      const x = padL + (i / (interpolated.length - 1)) * chartW;
      const y = padT + (1 - interpolated[i]) * chartH;
      if (i === 0) {
        path = `M ${x} ${y}`;
      } else {
        const prevX = padL + ((i - 1) / (interpolated.length - 1)) * chartW;
        const prevY = padT + (1 - interpolated[i - 1]) * chartH;
        const cpx = (prevX + x) / 2;
        path += ` C ${cpx} ${prevY}, ${cpx} ${y}, ${x} ${y}`;
      }
    }
    return path;
  }

  function pointsToArea(points: number[]): string {
    const linePath = pointsToPath(points);
    const lastX = padL + chartW;
    const baseY = padT + chartH;
    return `${linePath} L ${lastX} ${baseY} L ${padL} ${baseY} Z`;
  }

  // Phase background regions
  const menstrualEndX = padL + (periodLength / cycleLength) * chartW;
  const follicularEndX = padL + 0.5 * chartW;
  const ovulationEndX = padL + 0.6 * chartW;

  // Current day marker
  const dayX = padL + ((currentDay - 0.5) / cycleLength) * chartW;

  // displayDay can be used for hover tooltip display
  const _displayDay = hoveredDay ?? currentDay;
  void _displayDay;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 10px 10px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-3)', marginBottom: 10, paddingLeft: 4 }}>
        Hormone Levels
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block' }}
        onMouseLeave={() => setHoveredDay(null)}
      >
        {/* Phase background bands */}
        <rect x={padL} y={padT} width={menstrualEndX - padL} height={chartH} fill="#E8A0BF" opacity={0.06} />
        <rect x={menstrualEndX} y={padT} width={follicularEndX - menstrualEndX} height={chartH} fill="#7EC8B8" opacity={0.06} />
        <rect x={follicularEndX} y={padT} width={ovulationEndX - follicularEndX} height={chartH} fill="#F2C57C" opacity={0.06} />
        <rect x={ovulationEndX} y={padT} width={padL + chartW - ovulationEndX} height={chartH} fill="#B0A0D4" opacity={0.06} />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(frac => (
          <line
            key={frac}
            x1={padL} y1={padT + (1 - frac) * chartH}
            x2={padL + chartW} y2={padT + (1 - frac) * chartH}
            stroke="var(--border)" strokeWidth={0.5} strokeDasharray="4,4"
          />
        ))}

        {/* Baseline */}
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="var(--border)" strokeWidth={0.5} />

        {/* Hormone curves */}
        {(Object.entries(HORMONE_CURVES) as [HormoneKey, typeof HORMONE_CURVES.estrogen][]).map(([key, data]) => {
          if (!activeHormones.has(key)) return null;
          return (
            <g key={key}>
              <path d={pointsToArea(data.points)} fill={data.color} opacity={0.08} />
              <path d={pointsToPath(data.points)} fill="none" stroke={data.color} strokeWidth={2} opacity={0.9} />
            </g>
          );
        })}

        {/* Current day vertical line */}
        <line
          x1={dayX} y1={padT}
          x2={dayX} y2={padT + chartH}
          stroke="var(--accent)" strokeWidth={1.5} opacity={0.6}
          strokeDasharray="3,3"
        />
        <circle cx={dayX} cy={padT - 4} r={3} fill="var(--accent)" />

        {/* Hover detection zones */}
        {Array.from({ length: cycleLength }, (_, i) => {
          const x = padL + ((i + 0.5) / cycleLength) * chartW;
          const w = chartW / cycleLength;
          return (
            <rect
              key={i}
              x={x - w / 2} y={padT} width={w} height={chartH}
              fill="transparent"
              onMouseEnter={() => setHoveredDay(i + 1)}
              style={{ cursor: 'crosshair' }}
            />
          );
        })}

        {/* Hover line */}
        {hoveredDay && (() => {
          const hx = padL + ((hoveredDay - 0.5) / cycleLength) * chartW;
          return (
            <>
              <line x1={hx} y1={padT} x2={hx} y2={padT + chartH} stroke="var(--text-3)" strokeWidth={1} opacity={0.4} />
              <text x={hx} y={padT + chartH + 14} textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">
                Day {hoveredDay}
              </text>
            </>
          );
        })()}

        {/* Day labels */}
        {[1, 7, 14, 21, 28].filter(d => d <= cycleLength).map(d => {
          const x = padL + ((d - 0.5) / cycleLength) * chartW;
          return (
            <text key={d} x={x} y={padT + chartH + 14} textAnchor="middle" fill="var(--text-3)" fontSize="8">
              {d}
            </text>
          );
        })}
      </svg>

      {/* Legend / toggles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingLeft: 4 }}>
        {(Object.entries(HORMONE_CURVES) as [HormoneKey, typeof HORMONE_CURVES.estrogen][]).map(([key, data]) => {
          const active = activeHormones.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleHormone(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 14,
                border: `1px solid ${active ? data.color + '66' : 'var(--border)'}`,
                background: active ? data.color + '18' : 'transparent',
                color: active ? data.color : 'var(--text-3)',
                fontSize: 11, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: active ? data.color : 'var(--text-3)',
                opacity: active ? 1 : 0.3,
              }} />
              {data.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhaseCard({ phase, isActive }: { phase: PhaseData; isActive: boolean }) {
  const [showBiochem, setShowBiochem] = useState(false);

  return (
    <div style={{
      background: isActive ? phase.colorSoft : 'var(--surface)',
      border: `1px solid ${isActive ? phase.color + '44' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '16px',
      transition: 'all 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{phase.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: isActive ? phase.color : 'var(--text)' }}>
            {phase.label} Phase
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{phase.days}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: phase.color, marginBottom: 3 }}>
            Exercise & Rest
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>{phase.exercise}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: phase.color, marginBottom: 3 }}>
            Nutrition
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>{phase.nutrition}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: phase.color, marginBottom: 3 }}>
            Mindset
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)' }}>{phase.mindset}</div>
        </div>
      </div>

      {/* Biochemistry Toggle */}
      <button
        onClick={() => setShowBiochem(!showBiochem)}
        style={{
          marginTop: 12, padding: '8px 14px', width: '100%',
          background: showBiochem ? phase.color + '18' : 'var(--surface-2)',
          border: `1px solid ${showBiochem ? phase.color + '33' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', color: showBiochem ? phase.color : 'var(--text-2)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase',
          letterSpacing: '0.5px', transition: 'all 0.2s',
        }}
      >
        {showBiochem ? 'Hide' : 'Show'} Biochemistry
      </button>

      {showBiochem && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Summary */}
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
            padding: '12px 14px', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: phase.color, marginBottom: 4 }}>
              What's Happening
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)' }}>
              {phase.biochem.summary}
            </div>
          </div>

          {/* Hormone Levels */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: phase.color, marginBottom: 6 }}>
              Hormone Levels
            </div>
            {phase.biochem.hormones.map((h, i) => (
              <div key={i} style={{
                background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
                padding: '10px 12px', border: '1px solid var(--border)',
                marginBottom: 4,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{h.name}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 12,
                    background: phase.color + '15', color: phase.color,
                    fontWeight: 600, fontFamily: "'SF Mono', monospace", whiteSpace: 'nowrap',
                  }}>
                    {h.level}
                  </span>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-3)' }}>{h.role}</div>
              </div>
            ))}
          </div>

          {/* Biological Detail */}
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
            padding: '12px 14px', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: phase.color, marginBottom: 4 }}>
              Biological Process
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-2)' }}>
              {phase.biochem.whatsHappening}
            </div>
          </div>

          {/* Neurotransmitters */}
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
            padding: '12px 14px', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: phase.color, marginBottom: 4 }}>
              Brain Chemistry
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-2)' }}>
              {phase.biochem.neurotransmitters}
            </div>
          </div>

          {/* Metabolism */}
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
            padding: '12px 14px', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: phase.color, marginBottom: 4 }}>
              Metabolism & Notes
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-2)' }}>
              {phase.biochem.keyMetabolism}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PartnerInsight({ phase }: { phase: PhaseData }) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--amber)', marginBottom: 4 }}>
        Partner Tip
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
        {phase.partnerTip}
      </div>
    </div>
  );
}

export default function CycleTracker({ contact }: { contact: Contact }) {
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ cycleStart: '', cycleLength: '28', periodLength: '5' });
  const [selectedPhase, setSelectedPhase] = useState<number | null>(null);
  const [showAllPhases, setShowAllPhases] = useState(false);

  useEffect(() => {
    api.getCycles(contact.id).then((res: any) => {
      const cycles = res.cycles || [];
      if (cycles.length > 0) {
        const latest = cycles[0];
        setCycle({
          id: latest.id,
          cycleStart: latest.cycle_start,
          cycleLength: latest.cycle_length || 28,
          periodLength: latest.period_length || 5,
        });
      } else {
        // Fallback to localStorage for migration
        const saved = localStorage.getItem(`cycle_${contact.id}`);
        if (saved) {
          const data = JSON.parse(saved);
          setCycle(data);
          // Migrate to API
          api.createCycle({
            contact_id: contact.id,
            cycle_start: data.cycleStart,
            cycle_length: data.cycleLength,
            period_length: data.periodLength,
          }).then((res: any) => {
            setCycle(prev => prev ? { ...prev, id: res.id } : prev);
            localStorage.removeItem(`cycle_${contact.id}`);
          }).catch(() => {});
        }
      }
    }).catch(() => {
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem(`cycle_${contact.id}`);
      if (saved) setCycle(JSON.parse(saved));
    });
  }, [contact.id]);

  async function saveCycle() {
    const data: CycleData = {
      cycleStart: form.cycleStart,
      cycleLength: parseInt(form.cycleLength),
      periodLength: parseInt(form.periodLength),
    };
    
    if (cycle?.id) {
      await api.updateCycle(cycle.id, {
        cycle_start: data.cycleStart,
        cycle_length: data.cycleLength,
        period_length: data.periodLength,
      });
      data.id = cycle.id;
    } else {
      const res = await api.createCycle({
        contact_id: contact.id,
        cycle_start: data.cycleStart,
        cycle_length: data.cycleLength,
        period_length: data.periodLength,
      });
      data.id = res.id;
    }
    
    setCycle(data);
    setEditing(false);
  }

  if (!cycle && !editing) {
    return (
      <div className="cycle-empty">
        <p style={{ marginBottom: 8 }}>No cycle data tracked yet</p>
        <button className="btn-small" onClick={() => setEditing(true)}>Set Up Tracker</button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="cycle-form">
        <label>Last period start date</label>
        <input type="date" value={form.cycleStart} onChange={(e) => setForm({ ...form, cycleStart: e.target.value })} />
        <label>Average cycle length (days)</label>
        <input type="number" value={form.cycleLength} onChange={(e) => setForm({ ...form, cycleLength: e.target.value })} />
        <label>Average period length (days)</label>
        <input type="number" value={form.periodLength} onChange={(e) => setForm({ ...form, periodLength: e.target.value })} />
        <div className="form-actions">
          <button className="btn-primary" onClick={saveCycle}>Save</button>
          <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  const day = getCycleDay(cycle!.cycleStart, cycle!.cycleLength);
  const currentPhaseIdx = getPhaseIndex(day, cycle!.periodLength, cycle!.cycleLength);
  const viewPhaseIdx = selectedPhase !== null ? selectedPhase : currentPhaseIdx;
  const phase = PHASES[viewPhaseIdx];
  const nextPeriod = cycle!.cycleLength - day;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 20,
          background: PHASES[currentPhaseIdx].colorSoft,
          border: `1px solid ${PHASES[currentPhaseIdx].color}44`,
          color: PHASES[currentPhaseIdx].color,
          fontSize: 13, fontWeight: 600,
        }}>
          <span>{PHASES[currentPhaseIdx].icon}</span>
          <span>{PHASES[currentPhaseIdx].label} Phase</span>
        </div>
        <button className="btn-edit-small" onClick={() => {
          setForm({ cycleStart: cycle!.cycleStart, cycleLength: String(cycle!.cycleLength), periodLength: String(cycle!.periodLength) });
          setEditing(true);
        }}>Edit</button>
      </div>

      {/* Cycle Wheel */}
      <CycleWheel
        day={day}
        cycleLength={cycle!.cycleLength}
        periodLength={cycle!.periodLength}
        activePhase={viewPhaseIdx}
        onPhaseClick={(i) => setSelectedPhase(i === selectedPhase ? null : i)}
      />

      {/* Hormone Curves */}
      <HormoneChart
        currentDay={day}
        cycleLength={cycle!.cycleLength}
        periodLength={cycle!.periodLength}
      />

      {/* Mood & Energy bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '12px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 500 }}>Mood</div>
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>{phase.mood}</div>
        </div>
        <div style={{
          flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '12px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 500 }}>Energy</div>
          <div style={{ fontSize: 13, lineHeight: 1.4 }}>{phase.energy}</div>
        </div>
      </div>

      {/* Phase detail card */}
      <PhaseCard phase={phase} isActive={viewPhaseIdx === currentPhaseIdx} />

      {/* Partner tip */}
      <PartnerInsight phase={phase} />

      {/* Period alert */}
      {nextPeriod <= 5 && nextPeriod > 0 && (
        <div className="cycle-alert">
          Next period in ~{nextPeriod} day{nextPeriod !== 1 ? 's' : ''}. Stock up on comfort items.
        </div>
      )}

      {/* View all phases toggle */}
      <button
        onClick={() => setShowAllPhases(!showAllPhases)}
        style={{
          padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', color: 'var(--text-2)', fontSize: 13,
          cursor: 'pointer', textAlign: 'center',
        }}
      >
        {showAllPhases ? 'Hide all phases' : 'View all phases'}
      </button>

      {showAllPhases && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PHASES.map((p, i) => (
            <PhaseCard key={p.key} phase={p} isActive={i === currentPhaseIdx} />
          ))}
        </div>
      )}
    </div>
  );
}
