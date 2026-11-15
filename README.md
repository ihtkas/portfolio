# portfolio

A fast, static personal portfolio site built with Astro 7: posts, projects, a resume page and a
dark/light theme. No analytics, no third-party requests on page load, self-hosted fonts.

## Quick start

```sh
mise install        # node, pnpm, task
pnpm install
task dev            # http://localhost:4321
```

Other commands: `task build`, `task check` (types, lint, format, unit tests), `task e2e`.

## Make it yours

1. Fork this repo.
2. Edit `site.config.ts`: name, tagline, location, socials, nav, about, now.
3. Replace the content in `src/content/` (posts, projects, `resume.yaml`) and `public/resume.pdf`.
4. Set `SITE_URL` to your domain (or change `siteUrl` in `site.config.ts`).
5. Build with `task build` and deploy the `dist/` folder to any static host.

Components read only from `site.config.ts`, `src/content/` and `public/`. The schemas fail the build with a
clear message if a field is missing or invalid.

## Decisions

- **TypeScript is pinned to 6.0.3.** `@astrojs/check` and typescript-eslint do not support TypeScript 7 yet.
- **Playwright is pinned to exactly 1.63.0.** Each version needs one specific browser build, so it is not
  allowed to drift.
- All other dependencies are pinned exactly, and the lockfile is committed.
- No Cloudflare-only features and no adapter. Where to host is a separate decision.

## Licence

The code is MIT licensed, see `LICENSE`. The site's written content (posts, project write-ups, resume) and
personal data (name, photos, contact details) are all rights reserved, and are not covered by the MIT licence.
