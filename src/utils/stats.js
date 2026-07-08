import { groupKeyForStatus } from './groups';

const SCORE_BUCKETS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export function scoreDistribution(entries) {
  const counts = new Map(SCORE_BUCKETS.map((b) => [b, 0]));
  for (const e of entries) {
    if (!e.scorePercent) continue;
    const bucket = Math.max(10, Math.min(100, Math.floor(e.scorePercent / 10) * 10));
    counts.set(bucket, counts.get(bucket) + 1);
  }
  return SCORE_BUCKETS.map((b) => ({ label: String(b), count: counts.get(b) }));
}

const EPISODE_BUCKETS = [
  { label: '1', test: (n) => n === 1 },
  { label: '2-6', test: (n) => n >= 2 && n <= 6 },
  { label: '7-16', test: (n) => n >= 7 && n <= 16 },
  { label: '17-28', test: (n) => n >= 17 && n <= 28 },
  { label: '29-55', test: (n) => n >= 29 && n <= 55 },
  { label: '56-100', test: (n) => n >= 56 && n <= 100 },
  { label: '101+', test: (n) => n >= 101 },
];

export function episodeCountDistribution(entries) {
  const counts = EPISODE_BUCKETS.map(() => 0);
  for (const e of entries) {
    if (!e.episodes) continue;
    const idx = EPISODE_BUCKETS.findIndex((b) => b.test(e.episodes));
    if (idx >= 0) counts[idx] += 1;
  }
  return EPISODE_BUCKETS.map((b, i) => ({ label: b.label, count: counts[i] }));
}

const FORMAT_LABELS = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music',
};

export function formatDistribution(entries) {
  const counts = new Map();
  for (const e of entries) {
    if (!e.format) continue;
    counts.set(e.format, (counts.get(e.format) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([format, count]) => ({ label: FORMAT_LABELS[format] || format, count }))
    .sort((a, b) => b.count - a.count);
}

export function statusDistribution(entries) {
  const counts = new Map();
  for (const e of entries) {
    const key = groupKeyForStatus(e.status);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

// Year an entry was finished, derived from updatedAt (AniList doesn't
// expose a separate "completed on" timestamp) — an approximation, not
// the exact completion date.
export function watchYearDistribution(entries) {
  const counts = new Map();
  for (const e of entries) {
    if (e.status !== 'COMPLETED' || !e.updatedAt) continue;
    const year = new Date(e.updatedAt * 1000).getFullYear();
    counts.set(year, (counts.get(year) || 0) + 1);
  }
  const years = [...counts.keys()].sort((a, b) => a - b);
  return years.map((year) => ({ label: String(year), count: counts.get(year) }));
}

// Mean score per genre — which genres you rate highest, not just watch
// most. Genres with too few scored entries are dropped so one outlier
// title can't swing a genre's average.
export function meanScoreByGenre(entries, minCount = 3) {
  const totals = new Map();
  for (const e of entries) {
    if (!e.scorePercent) continue;
    for (const genre of e.genres || []) {
      const t = totals.get(genre) || { sum: 0, count: 0 };
      t.sum += e.scorePercent;
      t.count += 1;
      totals.set(genre, t);
    }
  }
  return [...totals.entries()]
    .filter(([, t]) => t.count >= minCount)
    .map(([genre, t]) => ({ label: genre, meanScore: t.sum / t.count }))
    .sort((a, b) => b.meanScore - a.meanScore)
    .slice(0, 10);
}
