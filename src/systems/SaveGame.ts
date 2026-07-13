import type { PhilosophyId } from '../data/philosophies';

export interface DialogueLogEntry {
  speaker: string;
  text: string;
  at: number;
}

export interface SaveData {
  version: 1;
  hp: number;
  maxHp: number;
  charms: PhilosophyId[];
  trials: string[];
  x: number;
  y: number;
  dialogueLog: DialogueLogEntry[];
  muted: boolean;
  savedAt: number;
}

const KEY = 'ninefold-save-v1';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data?.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadSave() != null;
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // quota / private mode — ignore
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function emptySave(x: number, y: number): SaveData {
  return {
    version: 1,
    hp: 5,
    maxHp: 5,
    charms: [],
    trials: [],
    x,
    y,
    dialogueLog: [],
    muted: false,
    savedAt: Date.now(),
  };
}
