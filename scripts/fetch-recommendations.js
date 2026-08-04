// Builds src/data/recommendations.json: anime that are airing now or premiering
// soon, picked by an LLM (via GitHub Models) from candidates not already on the
// user's Watching or Completed lists, using recently watched titles as context.
//
// Unlike fetch-anilist.js this fails soft — a bad LLM call or missing token
// shouldn't block the daily deploy, so on any error we keep the last committed
// recommendations.json and exit cleanly.
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ANILIST_USERNAME } from './anilist.config.js';

const ANILIST_API = 'https://graphql.anilist.co';
const MODELS_API = 'https://models.github.ai/inference/chat/completions';
const MODEL = 'openai/gpt-4o-mini';
const RECENT_COUNT = 20;
const PICK_COUNT = 12;

const ANIME_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/anime.json'
);
const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/recommendations.json'
);

const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

function currentSeason(date = new Date()) {
  const month = date.getUTCMonth(); // 0-11
  const season = SEASONS[Math.floor(((month + 1) % 12) / 3)];
  return { season, year: date.getUTCFullYear() };
}

function nextSeason({ season, year }) {
  const idx = SEASONS.indexOf(season);
  if (idx === 3) return { season: SEASONS[0], year: year + 1 };
  return { season: SEASONS[idx + 1], year };
}

const CANDIDATES_QUERY = `
query ($season: MediaSeason, $seasonYear: Int, $nextSeasonArg: MediaSeason, $nextYear: Int) {
  current: Page(perPage: 50) {
    media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC, format_in: [TV, TV_SHORT, ONA]) {
      id
      title { romaji english }
      coverImage { large color }
      genres
      format
      status
      startDate { year month day }
      siteUrl
    }
  }
  upcoming: Page(perPage: 50) {
    media(season: $nextSeasonArg, seasonYear: $nextYear, type: ANIME, sort: POPULARITY_DESC, format_in: [TV, TV_SHORT, ONA]) {
      id
      title { romaji english }
      coverImage { large color }
      genres
      format
      status
      startDate { year month day }
      siteUrl
    }
  }
}
`;

async function fetchCandidates() {
  const now = currentSeason();
  const next = nextSeason(now);

  const res = await fetch(ANILIST_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: CANDIDATES_QUERY,
      variables: {
        season: now.season,
        seasonYear: now.year,
        nextSeasonArg: next.season,
        nextYear: next.year,
      },
    }),
  });

  if (!res.ok) throw new Error(`AniList candidates request failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(`AniList candidates API error: ${JSON.stringify(json.errors)}`);

  const byId = new Map();
  for (const media of [...json.data.current.media, ...json.data.upcoming.media]) {
    if (media.status !== 'RELEASING' && media.status !== 'NOT_YET_RELEASED') continue;
    if (!byId.has(media.id)) byId.set(media.id, media);
  }
  return byId;
}

function formatAirDate(startDate) {
  if (!startDate || !startDate.year) return null;
  const { year, month, day } = startDate;
  if (!month) return `${year}`;
  const d = new Date(Date.UTC(year, month - 1, day || 1));
  return d.toLocaleDateString('en-US', { month: 'short', day: day ? 'numeric' : undefined, year: 'numeric' });
}

async function pickRecommendations(recentlyWatched, candidates) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not set — cannot call GitHub Models');

  const candidateList = [...candidates.values()].map((m) => ({
    id: m.id,
    title: m.title.english || m.title.romaji,
    genres: m.genres,
    format: m.format,
    status: m.status,
  }));

  const messages = [
    {
      role: 'system',
      content:
        'You are a precise anime recommendation engine. You will receive a list of anime the viewer ' +
        'has recently watched (with genres and their 0-100 score) and a list of candidate anime that are ' +
        `either currently airing or premiering soon. Pick the ${PICK_COUNT} candidates most likely to appeal ` +
        'to this viewer, based on genre overlap, tone, and franchise/studio connections you can infer from ' +
        'titles. Respond with ONLY strict JSON of the form ' +
        '{"recommendations":[{"id":123,"reason":"short reason, <=8 words, written to the viewer"}]}. ' +
        'The "id" must exactly match a candidate id. No prose, no markdown.',
    },
    {
      role: 'user',
      content: JSON.stringify({ recentlyWatched, candidates: candidateList }),
    },
  ];

  const res = await fetch(MODELS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub Models request failed: ${res.status} ${res.statusText} ${body}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error('GitHub Models response had no content');

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.recommendations)) throw new Error('GitHub Models response missing "recommendations" array');
  return parsed.recommendations;
}

async function main() {
  const animeData = JSON.parse(await readFile(ANIME_PATH, 'utf-8'));
  const excludeIds = new Set(
    animeData.entries.filter((e) => e.status === 'CURRENT' || e.status === 'COMPLETED').map((e) => e.id)
  );

  const recentlyWatched = animeData.entries
    .filter((e) => e.status === 'CURRENT' || e.status === 'COMPLETED')
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, RECENT_COUNT)
    .map((e) => ({ title: e.title, genres: e.genres, scorePercent: e.scorePercent }));

  const allCandidates = await fetchCandidates();
  const candidates = new Map([...allCandidates].filter(([id]) => !excludeIds.has(id)));

  if (candidates.size === 0) {
    throw new Error('No eligible candidates this season after filtering — skipping recommendation run');
  }

  const picks = await pickRecommendations(recentlyWatched, candidates);

  const items = picks
    .map((pick) => {
      const media = candidates.get(pick.id);
      if (!media) return null;
      return {
        id: media.id,
        title: media.title.english || media.title.romaji,
        titleRomaji: media.title.romaji,
        coverImage: media.coverImage.large,
        coverColor: media.coverImage.color || null,
        genres: media.genres,
        format: media.format,
        status: media.status,
        airDate: formatAirDate(media.startDate),
        siteUrl: media.siteUrl,
        reason: pick.reason || '',
      };
    })
    .filter(Boolean)
    .slice(0, PICK_COUNT);

  const payload = {
    username: ANILIST_USERNAME,
    generatedAt: new Date().toISOString(),
    basedOn: recentlyWatched.slice(0, 5).map((e) => e.title),
    items,
  };

  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${items.length} recommendations to ${OUT_PATH}`);
}

main().catch(async (err) => {
  console.error('Failed to build recommendations:', err.message);
  console.error('Keeping last committed recommendations.json intact.');
});
