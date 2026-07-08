// Renders a static 1200x630 OG/Twitter card image from the profile data
// fetched by fetch-anilist.js — banner, avatar, name, and headline stats,
// similar to AniList's own link-preview card. Runs entirely in Node via
// satori (JSX-like tree -> SVG) + resvg (SVG -> PNG), no browser needed.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(ROOT, '../src/data/anime.json');
const OUT_PATH = path.resolve(ROOT, '../public/og-image.png');

const FONT_REGULAR_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf';
const FONT_BOLD_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf';

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchAsDataUri(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${contentType};base64,${buf.toString('base64')}`;
}

function statBlock(value, label) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginRight: 56 },
      children: [
        { type: 'div', props: { style: { fontSize: 44, fontWeight: 700, color: '#ffffff' }, children: String(value) } },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 16,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginTop: 2,
            },
            children: label,
          },
        },
      ],
    },
  };
}

async function main() {
  const data = JSON.parse(await readFile(DATA_PATH, 'utf-8'));
  const { profile, username } = data;

  if (!profile) {
    throw new Error('No profile data in anime.json — run fetch-data first.');
  }

  const [bannerData, avatarData, fontRegular, fontBold] = await Promise.all([
    profile.banner ? fetchAsDataUri(profile.banner) : Promise.resolve(null),
    profile.avatar ? fetchAsDataUri(profile.avatar) : Promise.resolve(null),
    fetchBuffer(FONT_REGULAR_URL),
    fetchBuffer(FONT_BOLD_URL),
  ]);

  const tree = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: '#ffe0e9',
        fontFamily: 'Poppins',
      },
      children: [
        bannerData && {
          type: 'img',
          props: {
            src: bannerData,
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top right',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: '36px 56px 44px',
              background: 'linear-gradient(to top, rgba(82,46,56,0.88), rgba(82,46,56,0))',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', marginBottom: 28 },
                  children: [
                    avatarData && {
                      type: 'img',
                      props: {
                        src: avatarData,
                        style: {
                          width: 76,
                          height: 76,
                          borderRadius: 16,
                          border: '3px solid white',
                          marginRight: 18,
                          objectFit: 'cover',
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: { style: { fontSize: 40, fontWeight: 700, color: '#ffffff' }, children: profile.name || username },
                    },
                  ].filter(Boolean),
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex' },
                  children: [
                    statBlock(profile.anime.count, 'Anime Watched'),
                    statBlock(profile.anime.daysWatched, 'Days Watched'),
                    statBlock(profile.manga.count, 'Manga Read'),
                  ],
                },
              },
            ],
          },
        },
      ].filter(Boolean),
    },
  };

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Poppins', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Poppins', data: fontBold, weight: 700, style: 'normal' },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();
  await writeFile(OUT_PATH, png);
  console.log(`Wrote OG image to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('Failed to generate OG image:', err.message);
  process.exit(1);
});
