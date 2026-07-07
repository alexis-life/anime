# anime.alexischao.com

A stylized, read-only view of my [AniList](https://anilist.co) anime list. Part of the
`alexischao.com` family of subdomains, sharing a design system loaded live from
[`alexischao.com/theme.css`](https://alexischao.com/theme.css).

There is no manual data entry here — AniList is the source of truth, and the site
rebuilds itself on a schedule.

## How it works

- `scripts/fetch-anilist.js` sends a single GraphQL query to AniList's public
  `https://graphql.anilist.co` endpoint (no auth/token needed — user lists are
  public read-only data) and writes the result to `src/data/anime.json`.
- The Vite + React app imports that JSON statically at build time and renders
  a cover-art grid, grouped by status (Watching, Completed, Paused, Planning,
  Dropped), with search and status-filter tabs.
- `.github/workflows/deploy.yml` runs on every push to `main`, on a daily cron
  schedule, and on manual dispatch. Each run: fetch fresh AniList data → build
  → deploy to GitHub Pages. This keeps the site current with zero manual input.
- If the AniList fetch fails, the workflow fails loudly instead of deploying a
  broken/empty site, and the last committed `anime.json` is left intact.

**Note:** GitHub automatically disables scheduled (`cron`) workflows after 60
days without any repository activity. If the site looks stale, check the
Actions tab and re-enable the workflow.

## Changing the AniList username

Edit `scripts/anilist.config.js`:

```js
export const ANILIST_USERNAME = 'your-username';
```

Then re-run `npm run fetch-data` (or just push to `main` — the workflow does
this automatically).

## Local development

```bash
npm install
npm run fetch-data   # writes src/data/anime.json from AniList
npm run dev
```

## Deploy / DNS

- Hosted on GitHub Pages with a custom domain (`public/CNAME`).
- Cloudflare DNS: a CNAME record for `anime` pointing at
  `alexis-life.github.io`.
- Pages is configured with GitHub Actions as the build source (not the legacy
  branch-based deploy), so `deploy.yml` handles both build and deploy.
