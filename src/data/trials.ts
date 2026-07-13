import type { PhilosophyId } from './philosophies';
import { PHILOSOPHIES, WORLD_W, WORLD_H, AGORA } from './philosophies';

export interface TrialMeta {
  id: PhilosophyId;
  title: string;
  hint: string;
  sceneKey: string;
  successToast: string;
}

export const TRIALS: TrialMeta[] = [
  {
    id: 'stoa',
    title: 'Stoa Trial — Still Heart',
    hint: 'Dodge the wind. Reach the Still Column.',
    sceneKey: 'mini-trial',
    successToast: 'Stoa trial complete — Still Heart earned.',
  },
  {
    id: 'garden',
    title: 'Garden Trial — Simple Joy',
    hint: 'Gather ripe olives. Avoid greed snares.',
    sceneKey: 'mini-trial',
    successToast: 'Garden trial complete — Simple Joy earned.',
  },
  {
    id: 'academy',
    title: 'Academy Trial — Clear Form',
    hint: 'Step the pads in the order shown.',
    sceneKey: 'mini-trial',
    successToast: 'Academy trial complete — Clear Form earned.',
  },
  {
    id: 'way',
    title: 'Way Trial — Soft Path',
    hint: 'Follow the crooked stream. Do not force the banks.',
    sceneKey: 'mini-trial',
    successToast: 'Way trial complete — Soft Path earned.',
  },
  {
    id: 'harmony',
    title: 'Harmony Trial — Right Relation',
    hint: 'Greet guests in courtesy order: Elder, Child, Traveler.',
    sceneKey: 'mini-trial',
    successToast: 'Harmony trial complete — Right Relation earned.',
  },
  {
    id: 'inquiry',
    title: 'Inquiry Trial — Honest Doubt',
    hint: 'Choose the door that asks a better question.',
    sceneKey: 'mini-trial',
    successToast: 'Inquiry trial complete — Honest Doubt earned.',
  },
  {
    id: 'craft',
    title: 'Craft Trial — Good Measure',
    hint: 'Strike the glowing sparks with your sword.',
    sceneKey: 'mini-trial',
    successToast: 'Craft trial complete — Good Measure earned.',
  },
  {
    id: 'compassion',
    title: 'Compassion Trial — Open Hand',
    hint: 'Calm the scared mites with Talk (E), not the sword.',
    sceneKey: 'mini-trial',
    successToast: 'Compassion trial complete — Open Hand earned.',
  },
  {
    id: 'emptiness',
    title: 'Emptiness Trial — Empty Cup',
    hint: 'Place three burdens in the circle, then step out empty.',
    sceneKey: 'mini-trial',
    successToast: 'Emptiness trial complete — Empty Cup earned.',
  },
];

export function trialMeta(id: string): TrialMeta | undefined {
  return TRIALS.find((t) => t.id === id);
}

/** Shrine placement: offset inside each school bounds. */
export function shrinePos(id: PhilosophyId): { x: number; y: number } {
  const p = PHILOSOPHIES.find((x) => x.id === id)!;
  if (id === 'emptiness') {
    return { x: p.bounds.x + p.bounds.w / 2, y: p.bounds.y + p.bounds.h / 2 + 40 };
  }
  return { x: p.bounds.x + 180, y: p.bounds.y + 260 };
}

export interface FerryDock {
  id: string;
  label: string;
  x: number;
  y: number;
  destX: number;
  destY: number;
  destLabel: string;
}

/** Ferries ring the Agora and jump to each school’s shrine approach. */
export function ferryDocks(): FerryDock[] {
  const a = AGORA.bounds;
  const cx = a.x + a.w / 2;
  const cy = a.y + a.h / 2;
  const docks: FerryDock[] = [];
  for (const p of PHILOSOPHIES) {
    if (p.id === 'emptiness') continue;
    const shrine = shrinePos(p.id);
    // Place dock on agora edge toward that school
    const midX = p.bounds.x + p.bounds.w / 2;
    const midY = p.bounds.y + p.bounds.h / 2;
    const dx = midX - cx;
    const dy = midY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const dockX = cx + (dx / len) * 320;
    const dockY = cy + (dy / len) * 280;
    docks.push({
      id: `ferry-${p.id}`,
      label: `Ferry → ${p.name}`,
      x: PhaserClamp(dockX, a.x + 80, a.x + a.w - 80),
      y: PhaserClamp(dockY, a.y + 80, a.y + a.h - 80),
      destX: shrine.x + 60,
      destY: shrine.y + 40,
      destLabel: p.name,
    });
  }
  // Return ferry at each school near shrine → agora
  for (const p of PHILOSOPHIES) {
    if (p.id === 'emptiness') continue;
    const shrine = shrinePos(p.id);
    docks.push({
      id: `return-${p.id}`,
      label: 'Ferry → Agora',
      x: shrine.x + 100,
      y: shrine.y + 80,
      destX: WORLD_W / 2,
      destY: WORLD_H / 2 + 40,
      destLabel: 'Agora Grove',
    });
  }
  return docks;
}

function PhaserClamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
