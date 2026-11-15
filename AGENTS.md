# AGENTS.md

A personal portfolio site: Astro 7, static output, hand-written CSS, typed content collections.
Fork it, edit the config and content, deploy anywhere that serves static files.

## Commands

Tools come from mise (`mise install`): node, pnpm, task.

- `task dev` starts the dev server.
- `task build` builds the static site into `dist/`.
- `task check` runs `astro check`, eslint, `prettier --check` and `vitest run`. Run it before every commit.
- `task e2e` runs the Playwright tests.
- `task empty` builds with empty content and asserts the empty states render.
- `task gate` runs check, build, budgets, empty and e2e. Without `task`, use `pnpm gate` (and `pnpm check`, `pnpm test`, `pnpm e2e`).

## Layout

```
site.config.ts        site-wide data (name, siteUrl, socials, nav, ...)
src/pages/            routes
src/components/       components
src/layouts/          page layouts
src/styles/           tokens.css, base.css
src/scripts/          small deferred scripts (theme, slideshow, header instruments)
src/lib/              data helpers (posts, projects, resume, agent files, JSON-LD)
integrations/         build hooks: csp.ts (CSP script hashes), lastmod.ts (sitemap dates)
scripts/              budgets, empty-content check, font-fallbacks.py
src/content/          posts/, projects/ collections
src/data/             resume.json
src/assets/           images processed by Astro
public/               static files (og-default.png; optional resume.pdf)
tests/unit, tests/e2e Vitest and Playwright
```

## Constraints

- TypeScript is pinned to 6.0.3: `@astrojs/check` and typescript-eslint do not support TS 7 yet.
- `@playwright/test` is exactly `1.63.0`, no caret. Each Playwright version wants one specific browser build.
- Every other dependency is pinned exactly, and the lockfile is committed.
- Hosting: Cloudflare Workers static assets, deployed by the `deploy` job in CI after a merge to `main`
  (`wrangler.jsonc`). The output stays plain static files. Any other Cloudflare-only feature (adapter,
  `_redirects`, KV, image service, analytics) needs an explicit owner decision first. Approved by the owner
  on 2026-11-15: `public/_headers` (caching and security headers, see below), and in the Cloudflare
  dashboard (not in this repo) Web Analytics, "Always Use HTTPS" and a Single Redirect rule from `www` to
  the apex (301, path and query kept). Forks on other hosts handle HTTPS and `www` their own way.
- Changes land through pull requests that the owner merges. Do not push to `main`.
- The repo itself ships no analytics and makes no third-party requests on page load: fonts are self-hosted,
  and YouTube loads only on click via `youtube-nocookie.com`. This deployment has Cloudflare Web Analytics
  injected at the edge, approved by the owner on 2026-11-15. Forks do not get it unless they enable it.
- Budgets: at most 8 KB gzipped JS on `/`, 6 KB on other pages, 20 KB gzipped CSS.
- The site URL comes from the `SITE_URL` env var, falling back to `siteUrl` in `site.config.ts`. Never hard-code the domain elsewhere.
- Copy has no em dashes and keeps a humble tone.

## Headers and CSP

- `public/_headers` is the single source for response headers (Cloudflare and Netlify both read it).
- The `/*` block sends a CSP, HSTS, nosniff, Referrer-Policy, COOP, `X-Frame-Options: DENY` and a
  Permissions-Policy, plus Trusted Types as `Content-Security-Policy-Report-Only`. Never put
  `Cache-Control` in `/*`: Cloudflare comma-joins a header that two rules set, which breaks the
  `/_astro/*` rule. Keep `autoplay`, `encrypted-media` and `fullscreen` out of Permissions-Policy (the
  YouTube embed needs them) and leave `tools` alone.
- `script-src` has no `'unsafe-inline'`. The CSP contains the placeholder `'inline-script-hashes'`; after
  the build, `integrations/csp.ts` replaces it in `dist/_headers` with the sha256 of every inline
  executable script in `dist/**/*.html`. Never hand-maintain hashes.
- To add an inline script, just add it (`is:inline` or a small hoisted script). The build hashes it.
  `tests/e2e/csp.spec.ts` serves every page with the generated policy and fails on any violation, and
  checks every inline script in `dist` is covered. JSON-LD needs no hash.
- A new third-party origin (script, frame, image, connect) needs an owner decision and a CSP change.
  `style-src` allows `'unsafe-inline'` because the CSS is inlined and Shiki uses style attributes.
- `static.cloudflareinsights.com` and `cloudflareinsights.com` in the CSP are only for the edge-injected
  Cloudflare Web Analytics. Forks without it can remove them.

## Crawlers and agent files

- AI crawler policy (owner decision 2026-11-15): allow all crawlers, stated in `robots.txt` with
  `Content-Signal: search=yes, ai-input=yes, ai-train=yes`. Keep the policy in `src/pages/robots.txt.ts`,
  not in Cloudflare managed robots.txt.
- Built at build time from the config and collections, so forks get their own: `/llms.txt`
  (llmstxt.org format), `/writing/<slug>.md` for each post (linked with
  `<link rel="alternate" type="text/markdown">`), full-text RSS (rendered and sanitised) and a sitemap with
  `lastmod`. Never hard-code content or the domain in them.
- JSON-LD: Person and WebSite on `/`, BlogPosting on posts, Blog on `/writing/`, ProfilePage on
  `/resume/`, all from `src/lib/structured-data.ts`. The Person's job and employer come from the resume
  role whose period says "present".

## Fonts

- Two self-hosted variable fonts, Latin subset: Big Shoulders Display and Newsreader. Code and labels use
  the system stack `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. Do not add a web font
  without a reason that beats its bytes on every page.
- Keep `font-display: swap`. Every stack ends in a generic family that exists on Android (`sans-serif`,
  `serif`).
- The metric-matched fallbacks in `src/styles/fonts.css` make Arial and Georgia take the same space as
  the web fonts, so the swap does not reflow the page. If you change a font or the weights in use,
  regenerate them with `uvx --from 'fonttools[woff]==4.60.1' python scripts/font-fallbacks.py`.
- Preload only the two normal faces. The italic loads only on pages that render italic text.
- The CSS is inlined into every page (`build.inlineStylesheets: 'always'`), so there is no
  render-blocking stylesheet. Keep it small; the budget counts it per page.
- Never commit `docs/`, `drafts/`, `.superpowers/`, `.playwright-mcp/`, `dist/`, `node_modules/`, `test-results/`, `playwright-report/` or `.lighthouseci/`.

## Personal content and docs

Personal content guidelines and design docs live in the gitignored `docs/` and `drafts/` folders on the
owner's machine. They are not in this repo. If you have them locally, read `docs/content-guidelines.md`
before writing or editing any content. If you do not, keep to sample or neutral content and ask.

## Template contract

Everything personal lives in `site.config.ts`, `src/content/`, `src/data/` and `public/`. Components read only from these.

```
site.config.ts        name, tagline, location, siteUrl (env SITE_URL, fallback config), socials, nav,
                      description, mark, featured (slideshow item refs), about, now (3 lines),
                      pages { writing.lede, projects.lede }
src/content/posts/    *.md(x)  { title, date, dek, kind: 'engineering'|'life', tags[], draft?, updated? }
src/content/projects/ *.md     { title, section, kind: 'oss'|'work', period, summary, stack[], order,
                                 links: { github?, demo? (http(s)), writeup? (http(s) or /path) },
                                 video?: { youtubeId (11 chars), duration, poster } }
src/data/resume.json           summary, orgs[{ name, period, roles[{ title, period, bullets[] }] }],
                               skills{ group: items[] }, education[], pdf?: '/resume.pdf' (optional; hides the button)
public/og-default.png, public/resume.pdf (optional), public/favicon.svg, src/assets/posters/*
```

- The OG image size in the meta tags is read from `public/og-default.png`; its alt text is the site name.

- Project Markdown bodies are not rendered; only the frontmatter is used.
- Zod schemas on the content collections fail the build on missing or invalid fields.
- Reading time and prev/next are computed. Section groups and counts are derived from data, never hard-coded.
- Do not put personal data in components. Put it in the four places above.
