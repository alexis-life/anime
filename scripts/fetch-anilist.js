// Fetches the AniList anime list at build time and writes src/data/anime.json.
// Public read-only GraphQL query — no auth/token required.
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ANILIST_USERNAME } from './anilist.config.js';

const ANILIST_API = 'https://graphql.anilist.co';
const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/data/anime.json'
);

// MediaListCollection returns lists chunked by status; perChunk covers
// typical list sizes in one request, chunk param lets us page if needed.
const QUERY = `
query ($userName: String, $chunk: Int, $perChunk: Int) {
  MediaListCollection(userName: $userName, type: ANIME, chunk: $chunk, perChunk: $perChunk) {
    hasNextChunk
    lists {
      entries {
        id
        status
        scorePercent: score(format: POINT_100)
        progress
        updatedAt
        media {
          title { romaji english }
          coverImage { large color }
          episodes
          format
          genres
          siteUrl
        }
      }
    }
  }
}
`;

// Profile header data: avatar/banner + anime & manga statistics, fetched
// once (not chunked/paged like the list above).
const PROFILE_QUERY = `
query ($userName: String) {
  User(name: $userName) {
    name
    avatar { large }
    bannerImage
    statistics {
      anime {
        count
        meanScore
        minutesWatched
        genres(sort: COUNT_DESC) { genre count }
      }
      manga {
        count
        meanScore
        chaptersRead
        genres(sort: COUNT_DESC) { genre count }
      }
    }
  }
}
`;

async function fetchChunk(chunk, perChunk) {
  const res = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { userName: ANILIST_USERNAME, chunk, perChunk },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AniList request failed: ${res.status} ${res.statusText} ${body}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`AniList API error: ${JSON.stringify(json.errors)}`);
  }
  return json.data.MediaListCollection;
}

async function fetchProfile() {
  const res = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: PROFILE_QUERY,
      variables: { userName: ANILIST_USERNAME },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AniList profile request failed: ${res.status} ${res.statusText} ${body}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`AniList profile API error: ${JSON.stringify(json.errors)}`);
  }

  const user = json.data.User;
  return {
    name: user.name,
    avatar: user.avatar?.large || null,
    banner: user.bannerImage || null,
    anime: {
      count: user.statistics.anime.count,
      meanScore: user.statistics.anime.meanScore,
      daysWatched: Math.round((user.statistics.anime.minutesWatched / 60 / 24) * 10) / 10,
      genres: user.statistics.anime.genres.map((g) => ({ genre: g.genre, count: g.count })),
    },
    manga: {
      count: user.statistics.manga.count,
      meanScore: user.statistics.manga.meanScore,
      chaptersRead: user.statistics.manga.chaptersRead,
      genres: user.statistics.manga.genres.map((g) => ({ genre: g.genre, count: g.count })),
    },
  };
}

function normalizeEntry(entry) {
  const { media } = entry;
  return {
    id: entry.id,
    title: media.title.english || media.title.romaji,
    titleRomaji: media.title.romaji,
    coverImage: media.coverImage.large,
    coverColor: media.coverImage.color || null,
    episodes: media.episodes,
    format: media.format,
    genres: media.genres,
    siteUrl: media.siteUrl,
    status: entry.status,
    scorePercent: entry.scorePercent || null,
    progress: entry.progress || 0,
    updatedAt: entry.updatedAt,
  };
}

async function main() {
  const perChunk = 500;
  let chunk = 1;
  // Keyed by entry id: AniList splits entries across both the default
  // status list and any custom lists (e.g. genre lists), duplicating rows.
  const entriesById = new Map();

  while (true) {
    const collection = await fetchChunk(chunk, perChunk);
    for (const list of collection.lists) {
      for (const entry of list.entries) {
        entriesById.set(entry.id, normalizeEntry(entry));
      }
    }
    if (!collection.hasNextChunk) break;
    chunk += 1;
  }

  const entries = [...entriesById.values()].sort((a, b) => b.updatedAt - a.updatedAt);
  const profile = await fetchProfile();

  const payload = {
    username: ANILIST_USERNAME,
    fetchedAt: new Date().toISOString(),
    profile,
    entries,
  };

  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`Wrote ${entries.length} entries to ${OUT_PATH}`);
}

main().catch(async (err) => {
  console.error('Failed to fetch AniList data:', err.message);
  try {
    await readFile(OUT_PATH, 'utf-8');
    console.error('Keeping last committed anime.json intact.');
  } catch {
    console.error(`No existing ${OUT_PATH} found — this is a fresh checkout.`);
  }
  process.exit(1);
});
