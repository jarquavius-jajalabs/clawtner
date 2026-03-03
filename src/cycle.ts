import { CyclePhase } from './types'

export interface HormoneLevel {
  estrogen: number    // 0-100 relative
  progesterone: number
  lh: number          // luteinizing hormone
  fsh: number         // follicle-stimulating hormone
  testosterone: number
}

export interface PhaseDetail {
  name: string
  day_range: [number, number]
  color: string
  gradient: string
  emoji: string
  icon: string
  tagline: string
  description: string
  hormones: string
  hormoneDetail: string[]
  body: string[]
  mood: string[]
  energy_level: number  // 1-5
  libido_level: number  // 1-5
  mood_stability: number // 1-5
  partner_tips: string[]
  do_this: string[]
  avoid_this: string[]
}

export function getPhaseDetails(cycleLength: number = 28): PhaseDetail[] {
  const ovDay = Math.round(cycleLength * 0.5)
  return [
    {
      name: 'Menstrual',
      day_range: [1, 5],
      color: '#f87171',
      gradient: 'linear-gradient(135deg, #f87171, #dc2626)',
      emoji: '🔴',
      icon: '🌑',
      tagline: 'Rest & Reset',
      description: 'The uterine lining sheds. Hormone levels are at their lowest point. The body is essentially hitting a biological reset button.',
      hormones: 'All hormones at baseline. Estrogen and progesterone bottomed out, which triggered the period. FSH is just starting to rise to recruit the next egg.',
      hormoneDetail: [
        'Estrogen: Very low — dropped sharply to trigger bleeding',
        'Progesterone: Bottomed out — the corpus luteum from last cycle has dissolved',
        'FSH: Starting to rise — brain is signaling ovaries to start developing new follicles',
        'LH: Low baseline',
        'Testosterone: Low — contributes to lower energy and libido',
      ],
      body: [
        'Uterine lining is shedding (the actual period)',
        'Prostaglandins cause uterine contractions (cramps)',
        'Iron levels can drop from blood loss',
        'Inflammation markers are elevated',
        'Body temperature drops to baseline',
      ],
      mood: [
        'Relief (if PMS was rough)',
        'Introspective and quieter',
        'May feel drained or emotional',
        'Desire for comfort and familiarity',
        'Lower tolerance for stress',
      ],
      energy_level: 2,
      libido_level: 1,
      mood_stability: 2,
      partner_tips: [
        'Bring her comfort without being asked — heating pad, tea, her favorite snack',
        'Don\'t take it personally if she wants space',
        'Lower expectations for plans and activity',
        'Physical affection (non-sexual) goes a long way — back rubs, gentle touch',
        'Handle more of the household stuff without making a big deal about it',
      ],
      do_this: [
        'Comfort food — warm, iron-rich meals',
        'Low-key quality time (movie night, cozy evening)',
        'Sweet messages acknowledging she might not feel great',
        'Take initiative on chores and logistics',
      ],
      avoid_this: [
        'Planning high-energy dates or events',
        'Commenting on her mood or energy',
        'Pressuring for sex',
        'Starting difficult conversations',
      ],
    },
    {
      name: 'Follicular',
      day_range: [6, ovDay - 2],
      color: '#60a5fa',
      gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
      emoji: '🌱',
      icon: '🌒',
      tagline: 'Rising Energy',
      description: 'Estrogen is climbing steadily. The brain is preparing for ovulation by developing follicles in the ovaries. Energy, mood, and creativity are all on the upswing.',
      hormones: 'Estrogen is the star here — rising steadily day over day. This is what drives the improved mood, glowing skin, and increased social energy. FSH is doing its job selecting the dominant follicle.',
      hormoneDetail: [
        'Estrogen: Climbing rapidly — peaks just before ovulation. This is the "feel-good" hormone',
        'Progesterone: Still low — hasn\'t kicked in yet',
        'FSH: Elevated — actively maturing egg follicles in the ovaries',
        'LH: Gradually rising — building toward the ovulation surge',
        'Testosterone: Starting to rise — boosts confidence, energy, and libido',
      ],
      body: [
        'Follicles developing in the ovaries (one will become dominant)',
        'Uterine lining rebuilding',
        'Cervical mucus increasing and thinning',
        'Skin tends to clear up and glow (estrogen effect)',
        'Metabolism is slightly lower (less hungry)',
        'Better insulin sensitivity (body handles carbs well)',
      ],
      mood: [
        'Optimistic and forward-looking',
        'More social and outgoing',
        'Creative and open to new ideas',
        'Confidence building',
        'Better verbal fluency and memory',
      ],
      energy_level: 4,
      libido_level: 3,
      mood_stability: 4,
      partner_tips: [
        'Match her energy — she\'s up for plans, activities, trying new things',
        'Great time to have important conversations (she\'s most receptive)',
        'Compliment her — she\'s feeling herself and it\'ll land',
        'Plan dates and adventures',
        'She\'s more social right now — group hangouts work well',
      ],
      do_this: [
        'Plan a date night or new experience',
        'Bring up ideas and future plans',
        'Be more flirty and playful',
        'Encourage her projects and goals',
      ],
      avoid_this: [
        'Being boring or low-energy (she\'ll feel held back)',
        'Skipping quality time — she actually wants to hang right now',
        'Being overly serious or heavy',
      ],
    },
    {
      name: 'Ovulation',
      day_range: [ovDay - 1, ovDay + 2],
      color: '#34d399',
      gradient: 'linear-gradient(135deg, #34d399, #10b981)',
      emoji: '✨',
      icon: '🌕',
      tagline: 'Peak Everything',
      description: 'The LH surge triggers the release of the mature egg. Estrogen peaks, testosterone spikes. This is biologically the "main event" of the cycle. She looks, feels, and performs at her peak.',
      hormones: 'Hormonal fireworks. Estrogen hits its absolute peak, triggering a massive LH surge that causes the egg to release. Testosterone also spikes briefly, driving confidence and libido to their highest.',
      hormoneDetail: [
        'Estrogen: At its absolute peak — this is the highest it gets all cycle',
        'LH: Massive surge (10-12x baseline) — this is what triggers egg release',
        'FSH: Brief spike alongside LH',
        'Testosterone: Peaks — highest libido, confidence, and assertiveness of the cycle',
        'Progesterone: Just starting to rise as the follicle transforms into corpus luteum',
      ],
      body: [
        'Egg released from dominant follicle (ovulation)',
        'Body temperature rises ~0.5°F (and stays elevated)',
        'Cervical mucus is clear, stretchy, egg-white consistency (peak fertility)',
        'Face appears slightly more symmetrical (estrogen effect)',
        'Voice pitch subtly higher',
        'Skin is at its best — plump, hydrated, glowing',
        'Pain threshold is higher',
        'Immune system temporarily suppressed (to not attack potential embryo)',
      ],
      mood: [
        'Maximum confidence and charisma',
        'Highly social — wants to be seen and out',
        'Flirtatious and magnetic',
        'Quick thinking, sharp memory',
        'Risk-taking slightly elevated',
        'Most attracted to partner (or most likely to notice others)',
      ],
      energy_level: 5,
      libido_level: 5,
      mood_stability: 4,
      partner_tips: [
        'This is your window — she\'s at her most attracted to you',
        'Be present, attentive, and confident',
        'Physical affection and intimacy are most welcome now',
        'She looks amazing and she knows it — notice and say something specific',
        'Match her social energy — don\'t be a hermit while she wants to go out',
      ],
      do_this: [
        'Plan something special — dinner out, a surprise, quality time',
        'Be physically affectionate and initiate',
        'Give specific compliments (not generic)',
        'Be your most confident self — she\'s biologically wired to respond to it right now',
      ],
      avoid_this: [
        'Being distant or distracted',
        'Missing the window — this is 3-4 days, max',
        'Being insecure or needy (confidence matters most right now)',
      ],
    },
    {
      name: 'Early Luteal',
      day_range: [ovDay + 3, ovDay + 9],
      color: '#a78bfa',
      gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
      emoji: '🌤️',
      icon: '🌖',
      tagline: 'Settling In',
      description: 'Progesterone takes over as the dominant hormone. The body is in "potential pregnancy" mode — building up the uterine lining, slowing things down. Mood is still decent but starting to wind down.',
      hormones: 'Progesterone is now the main character. It\'s a calming, sedating hormone — think of it as nature\'s Xanax. Estrogen has a secondary rise (smaller than the first). This combo creates a warm, nesting feeling.',
      hormoneDetail: [
        'Progesterone: Rising rapidly — produced by the corpus luteum (what\'s left of the follicle)',
        'Estrogen: Secondary, smaller peak — then starts declining',
        'LH/FSH: Back to baseline',
        'Testosterone: Declining from ovulation peak',
        'Serotonin: Starting to be affected by progesterone — can start dipping',
      ],
      body: [
        'Uterine lining thickening and becoming secretory',
        'Body temperature elevated (~0.5°F above baseline)',
        'Metabolism speeds up — actually burns more calories',
        'Appetite increases (especially carbs and comfort food)',
        'Breast tenderness may begin',
        'Digestion can slow (progesterone relaxes smooth muscle)',
        'Water retention starting',
      ],
      mood: [
        'Calmer, more introspective',
        'Nesting instinct — wants home to feel good',
        'Slightly less social than ovulation',
        'Can feel emotionally warm and loving',
        'Good focus for detail-oriented tasks',
      ],
      energy_level: 3,
      libido_level: 3,
      mood_stability: 3,
      partner_tips: [
        'Cozy quality time works better than going out',
        'She might want to nest — help around the house',
        'Food matters more now — cook something good or order her favorites',
        'Emotional conversations can go well here (she\'s reflective)',
        'Be warm and steady',
      ],
      do_this: [
        'Home-cooked meals or comfort food',
        'Chill evenings together',
        'Help her feel secure and appreciated',
        'Small gestures of care',
      ],
      avoid_this: [
        'Over-scheduling the week',
        'Ignoring her increased appetite (don\'t comment on eating more)',
        'Being emotionally unavailable',
      ],
    },
    {
      name: 'Late Luteal (PMS)',
      day_range: [ovDay + 10, cycleLength],
      color: '#fb923c',
      gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
      emoji: '🍂',
      icon: '🌘',
      tagline: 'Navigating PMS',
      description: 'Both estrogen and progesterone are crashing. The corpus luteum is dying. If no pregnancy occurred, the body is preparing to shed and start over. This hormonal withdrawal is what causes PMS symptoms.',
      hormones: 'The crash. Both estrogen and progesterone are plummeting. This withdrawal directly impacts serotonin (mood), dopamine (motivation), and GABA (calm). It\'s not "in her head" — it\'s a literal neurochemical shift.',
      hormoneDetail: [
        'Progesterone: Crashing — corpus luteum is breaking down',
        'Estrogen: Also dropping sharply',
        'Serotonin: Significantly reduced — directly causes mood dips, irritability, anxiety',
        'GABA: Decreased — less ability to self-soothe and stay calm',
        'Prostaglandins: Building up — will trigger uterine contractions (cramps) when period starts',
        'Cortisol: May be elevated — lower stress tolerance',
      ],
      body: [
        'Bloating and water retention at worst',
        'Breast tenderness peaks',
        'Cramps may begin before period starts',
        'Acne breakouts (progesterone withdrawal + testosterone ratio shift)',
        'Headaches or migraines possible',
        'Sleep disruption common',
        'Cravings for sugar, salt, chocolate, carbs (serotonin-seeking behavior)',
        'GI issues — constipation shifting to loose stools as period approaches',
      ],
      mood: [
        'Irritability and shorter fuse',
        'Anxiety or feeling overwhelmed',
        'Sadness or crying more easily',
        'Hypersensitive to criticism or conflict',
        'Feeling unattractive or insecure',
        'Less patience for BS (but also less filter)',
        'Can feel lonely even when not alone',
      ],
      energy_level: 2,
      libido_level: 2,
      mood_stability: 1,
      partner_tips: [
        'This is when she needs you most and might push you away hardest',
        'Don\'t try to "fix" her mood — just be present',
        'Extra patience is not optional, it\'s required',
        'Small acts of service hit different right now',
        'Don\'t bring up sensitive topics unless absolutely necessary',
        'If she snaps, take a breath — it\'s the hormones talking, not her opinion of you',
      ],
      do_this: [
        'Chocolate, heating pad, her favorite show — without her asking',
        'Extra gentle physical affection',
        'Take things off her plate proactively',
        'Validate her feelings even if they seem disproportionate',
        'Send sweet texts — she\'s probably feeling insecure',
      ],
      avoid_this: [
        'Saying "are you on your period?" (ever)',
        'Starting arguments or heavy conversations',
        'Being dismissive of her feelings',
        'Pointing out mood changes',
        'Expecting high performance or social energy',
      ],
    },
  ]
}

export function getCycleDay(lastPeriodStart: string): number {
  const start = new Date(lastPeriodStart + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff + 1
}

export function getCurrentPhase(cycleDay: number, cycleLength: number = 28): PhaseDetail {
  const phases = getPhaseDetails(cycleLength)
  const day = ((cycleDay - 1) % cycleLength) + 1
  for (const phase of phases) {
    if (day >= phase.day_range[0] && day <= phase.day_range[1]) {
      return phase
    }
  }
  return phases[4]
}

export function getHormonelevels(cycleDay: number, cycleLength: number = 28): HormoneLevel {
  const day = ((cycleDay - 1) % cycleLength) + 1
  const ov = Math.round(cycleLength * 0.5)

  // Simplified hormone curves (relative 0-100)
  let estrogen = 0, progesterone = 0, lh = 0, fsh = 0, testosterone = 0

  if (day <= 5) {
    // Menstrual
    estrogen = 10 + (day / 5) * 10
    progesterone = 5
    fsh = 20 + (day / 5) * 15
    lh = 10
    testosterone = 15
  } else if (day <= ov - 2) {
    // Follicular
    const progress = (day - 5) / (ov - 7)
    estrogen = 20 + progress * 60
    progesterone = 5 + progress * 5
    fsh = 35 - progress * 10
    lh = 10 + progress * 15
    testosterone = 15 + progress * 25
  } else if (day <= ov + 2) {
    // Ovulation
    const progress = (day - (ov - 2)) / 4
    estrogen = 80 + Math.sin(progress * Math.PI) * 20
    lh = 25 + Math.sin(progress * Math.PI) * 75
    fsh = 25 + Math.sin(progress * Math.PI) * 30
    progesterone = 10 + progress * 20
    testosterone = 40 + Math.sin(progress * Math.PI) * 20
  } else if (day <= ov + 9) {
    // Early Luteal
    const progress = (day - ov - 2) / 7
    estrogen = 40 + Math.sin(progress * Math.PI) * 25
    progesterone = 30 + progress * 55
    lh = 15 - progress * 5
    fsh = 15 - progress * 5
    testosterone = 30 - progress * 10
  } else {
    // Late Luteal
    const progress = (day - ov - 9) / (cycleLength - ov - 9)
    estrogen = 45 - progress * 35
    progesterone = 85 - progress * 75
    lh = 10
    fsh = 10 + progress * 10
    testosterone = 20 - progress * 5
  }

  return {
    estrogen: Math.max(0, Math.min(100, Math.round(estrogen))),
    progesterone: Math.max(0, Math.min(100, Math.round(progesterone))),
    lh: Math.max(0, Math.min(100, Math.round(lh))),
    fsh: Math.max(0, Math.min(100, Math.round(fsh))),
    testosterone: Math.max(0, Math.min(100, Math.round(testosterone))),
  }
}

export function formatCycleDay(cycleDay: number, cycleLength: number = 28): number {
  return ((cycleDay - 1) % cycleLength) + 1
}

export function daysUntilNextPeriod(cycleDay: number, cycleLength: number = 28): number {
  const day = ((cycleDay - 1) % cycleLength) + 1
  return cycleLength - day + 1
}

export function daysUntilOvulation(cycleDay: number, cycleLength: number = 28): number {
  const day = ((cycleDay - 1) % cycleLength) + 1
  const ov = Math.round(cycleLength * 0.5)
  if (day > ov + 2) return ov + cycleLength - day
  if (day >= ov - 1) return 0 // currently ovulating
  return ov - day
}
