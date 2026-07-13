export type PhilosophyId =
  | 'stoa'
  | 'garden'
  | 'academy'
  | 'way'
  | 'harmony'
  | 'inquiry'
  | 'craft'
  | 'compassion'
  | 'emptiness';

export interface Philosophy {
  id: PhilosophyId;
  name: string;
  mentor: string;
  charm: string;
  color: number;
  blurb: string;
  greeting: string;
  /** Axis-aligned region in world pixels (x,y,w,h) */
  bounds: { x: number; y: number; w: number; h: number };
}

/** World is 2880×2160 (3×3 of 960×720 cells) plus emptiness plateau overlay near center-north. */
export const TILE = 48;
export const WORLD_W = 2880;
export const WORLD_H = 2160;

export const PHILOSOPHIES: Philosophy[] = [
  {
    id: 'stoa',
    name: 'Stoa',
    mentor: 'Aunt Calm',
    charm: 'Still Heart',
    color: 0x6b8cae,
    blurb: 'Weather the wind. Choose your response.',
    greeting:
      'Child, the cliff wind is loud. Your heart need not shout with it. Stand a moment—then walk on.',
    bounds: { x: 0, y: 0, w: 960, h: 720 },
  },
  {
    id: 'academy',
    name: 'Academy',
    mentor: 'Sister Sketch',
    charm: 'Clear Form',
    color: 0x9bb7d4,
    blurb: 'Name the shape of what you seek.',
    greeting:
      'Look—the pools mirror more than faces. Draw the true outline, and the false one fades.',
    bounds: { x: 960, y: 0, w: 960, h: 720 },
  },
  {
    id: 'way',
    name: 'Way',
    mentor: 'Old Drift',
    charm: 'Soft Path',
    color: 0x7fae8a,
    blurb: 'Follow what flows; force less.',
    greeting:
      'The trail refuses your straight line. Good. Crooked roads teach softer feet.',
    bounds: { x: 1920, y: 0, w: 960, h: 720 },
  },
  {
    id: 'garden',
    name: 'Garden',
    mentor: 'Uncle Smile',
    charm: 'Simple Joy',
    color: 0xc4d67a,
    blurb: 'Enough is a feast if you taste it.',
    greeting:
      'Sit. Eat an olive. The island is already generous—why rush past the gift?',
    bounds: { x: 0, y: 720, w: 960, h: 720 },
  },
  {
    id: 'harmony',
    name: 'Harmony',
    mentor: 'Gran Courtesy',
    charm: 'Right Relation',
    color: 0xe0b87a,
    blurb: 'People before cleverness.',
    greeting:
      'Welcome. Wipe your feet. Ask who needs a chair before you ask who is right.',
    bounds: { x: 1920, y: 720, w: 960, h: 720 },
  },
  {
    id: 'inquiry',
    name: 'Inquiry',
    mentor: 'Cousin Why',
    charm: 'Honest Doubt',
    color: 0xd4a0c8,
    blurb: 'A good question is a lantern.',
    greeting:
      'Don\'t bring me answers yet. Bring me the question that makes your feet itchy.',
    bounds: { x: 0, y: 1440, w: 960, h: 720 },
  },
  {
    id: 'craft',
    name: 'Craft',
    mentor: 'Smith Mean',
    charm: 'Good Measure',
    color: 0xc48a5a,
    blurb: 'Virtue is practiced, like a tempered blade.',
    greeting:
      'Swing straight. Heat even. Measure twice—philosophy is a workshop, not a speech.',
    bounds: { x: 960, y: 1440, w: 960, h: 720 },
  },
  {
    id: 'compassion',
    name: 'Compassion',
    mentor: 'Nurse Kind',
    charm: 'Open Hand',
    color: 0xe89aa0,
    blurb: 'Heal what you can; hold what you cannot.',
    greeting:
      'Some shade-mites are only scared. Try kindness first. Your sword is for the rest.',
    bounds: { x: 1920, y: 1440, w: 960, h: 720 },
  },
  {
    id: 'emptiness',
    name: 'Emptiness',
    mentor: 'Silent Twin',
    charm: 'Empty Cup',
    color: 0xe8e0d0,
    blurb: 'Put something down to make room.',
    greeting: '… (They bow. The wind finishes the sentence.)',
    bounds: { x: 1080, y: 600, w: 720, h: 480 },
  },
];

export const AGORA = {
  name: 'Agora Grove',
  bounds: { x: 960, y: 720, w: 960, h: 720 },
  greeting:
    'The Grove holds nine offerings and zero mandatory sermons. Wander. Listen. Fold what fits.',
};

export function philosophyAt(x: number, y: number): Philosophy | null {
  // Emptiness is a plateau overlay — check first
  const emptiness = PHILOSOPHIES.find((p) => p.id === 'emptiness')!;
  const e = emptiness.bounds;
  if (x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h) return emptiness;

  for (const p of PHILOSOPHIES) {
    if (p.id === 'emptiness') continue;
    const b = p.bounds;
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return p;
  }
  return null;
}

export function regionLabel(x: number, y: number): string {
  const a = AGORA.bounds;
  if (x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h) {
    const emptiness = philosophyAt(x, y);
    if (emptiness?.id === 'emptiness') return emptiness.name;
    return AGORA.name;
  }
  return philosophyAt(x, y)?.name ?? 'Tide Edge';
}
