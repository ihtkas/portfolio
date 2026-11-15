# AGENTS.md

A personal portfolio site: Astro 7, static output, hand-written CSS, typed content collections.
Fork it, edit the config and content, deploy anywhere that serves static files.

## Commands

Tools come from mise (`mise install`): node, pnpm, task.

- `task dev` starts the dev server.
- `task build` builds the static site into `dist/`.
- `task check` runs `astro check`, eslint, `prettier --check` and `vitest run`. Run it before every commit.
- `task e2e` runs the Playwright tests.

## Layout

```
site.config.ts        site-wide data (name, siteUrl, socials, nav, ...)
src/pages/            routes
src/components/       components
src/layouts/          page layouts
src/styles/           tokens.css, base.css
src/scripts/          small deferred scripts (theme, slideshow, header instruments)
src/content/          posts/, projects/ collections and resume.yaml
src/assets/           images processed by Astro
public/               static files (resume.pdf, og-default.png)
tests/unit, tests/e2e Vitest and Playwright
```

## Constraints

- TypeScript is pinned to 6.0.3: `@astrojs/check` and typescript-eslint do not support TS 7 yet.
- `@playwright/test` is exactly `1.63.0`, no caret. Each Playwright version wants one specific browser build.
- Every other dependency is pinned exactly, and the lockfile is committed.
- No Cloudflare-only features. No adapter, no `_headers` or `_redirects`. Hosting is a separate decision.
- No third-party requests on page load: fonts are self-hosted, no analytics, YouTube loads only on click via `youtube-nocookie.com`.
- Budgets: at most 8 KB gzipped JS on `/`, 5 KB on other pages, 20 KB gzipped CSS.
- The site URL comes from the `SITE_URL` env var, falling back to `siteUrl` in `site.config.ts`. Never hard-code the domain elsewhere.
- Copy has no em dashes and keeps a humble tone.
- Never commit `docs/`, `drafts/`, `.superpowers/`, `.playwright-mcp/`, `dist/`, `node_modules/`, `test-results/`, `playwright-report/` or `.lighthouseci/`.

## Personal content and docs

Personal content guidelines and design docs live in the gitignored `docs/` and `drafts/` folders on the
owner's machine. They are not in this repo. If you have them locally, read `docs/content-guidelines.md`
before writing or editing any content. If you do not, keep to sample or neutral content and ask.

## Template contract

Everything personal lives in `site.config.ts`, `src/content/` and `public/`. Components read only from these.

```
site.config.ts        name, tagline, location, siteUrl (env SITE_URL, fallback config), socials, nav,
                      featured (slideshow item refs), about, now (3 lines), theme defaults
src/content/posts/    *.md(x)  { title, date, dek, kind: 'engineering'|'life', tags[], draft?, updated? }
src/content/projects/ *.md     { title, section, kind: 'oss'|'work', period, summary, stack[], order,
                                 links: { github?, demo?, writeup? }, video?: { youtubeId, duration, poster } }
src/content/resume.yaml        summary, orgs[{ name, period, roles[{ title, period, bullets[] }] }],
                               skills{ group: items[] }, education[], pdf: '/resume.pdf'
public/resume.pdf, public/og-default.png, src/assets/posters/*
```

- Zod schemas on the content collections fail the build on missing or invalid fields.
- Reading time and prev/next are computed. Section groups and counts are derived from data, never hard-coded.
- Do not put personal data in components. Put it in the three places above.
