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
        score
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
    score: entry.score || null,
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

  const payload = {
    username: ANILIST_USERNAME,
    fetchedAt: new Date().toISOString(),
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
