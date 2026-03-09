import type { FaceRecord } from "./types";

const STORAGE_KEY = "face_score_records";

export function getRecords(): FaceRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as FaceRecord[];
  } catch {
    return [];
  }
}

export function saveRecord(record: FaceRecord): void {
  const records = getRecords();
  records.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getRecentRecords(days: number = 7): FaceRecord[] {
  const records = getRecords();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return records.filter((r) => new Date(r.date) >= cutoff);
}

export function getAverageScore(): number | null {
  const recent = getRecentRecords(7);
  if (recent.length === 0) return null;
  const sum = recent.reduce((acc, r) => acc + r.totalScore, 0);
  return Math.round(sum / recent.length);
}

export function getLatestRecord(): FaceRecord | null {
  const records = getRecords();
  return records.length > 0 ? records[0] : null;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
