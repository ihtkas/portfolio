# portfolio

A fast, static personal portfolio site built with Astro 7: posts, projects, a resume page and a
dark/light theme. No analytics, no third-party requests on page load, self-hosted fonts.

## Quick start

```sh
mise install        # node, pnpm, task
pnpm install
task dev            # http://localhost:4321
```

Other commands: `task build`, `task check` (types, lint, format, unit tests), `task e2e`, `task empty`
(builds with empty content and checks the empty states) and `task gate` (all of them plus the budgets).
Without `task`, the same checks run as `pnpm check`, `pnpm test`, `pnpm e2e` and `pnpm gate`.

## Make it yours

1. Fork this repo.
2. Edit `site.config.ts`: `name`, `mark`, `tagline`, `location`, `description`, `socials`, `nav`, `about`,
   `now`, `pages` (the intro lines under the Writing and Projects titles) and `featured` (the home
   slideshow, as `{ kind, slug }` refs to your posts and projects; `[]` omits it).
3. Replace the content: posts and projects in `src/content/`, the resume in `src/data/resume.json`, and
   poster images in `src/assets/posters/`.
4. Replace the files in `public/`: `og-default.png` (the social share image) and `favicon.svg` (add `resume.pdf` and set `pdf` in `src/data/resume.json` to show the Download PDF button; it is optional).
5. Set `SITE_URL` to your domain (or change `siteUrl` in `site.config.ts`).
6. Build with `task build` and deploy the `dist/` folder to any static host. This repo deploys to Cloudflare
   Workers static assets from CI after a merge to `main`. To use it:
   1. Change `name` in `wrangler.jsonc`.
   2. Create a Cloudflare API token from the "Edit Cloudflare Workers" template, scoped to your account. It
      needs no DNS permission.
   3. Add the repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
   4. After the first deploy, attach your domain once in the Cloudflare dashboard: Workers & Pages, then the
      Worker, then Settings, Domains & Routes, Add custom domain (your domain and its `www`).

   To host elsewhere, delete `wrangler.jsonc` and the `deploy` job.

Components read only from `site.config.ts`, `src/content/`, `src/data/` and `public/`. The schemas fail the
build with a clear message if a field is missing or invalid. A featured slug that is missing or a draft also
fails the build.

Notes:

- Only the frontmatter of a project is used. The Markdown body of a project is not rendered.
- Project `links.github` and `links.demo` must be http(s) URLs, `links.writeup` an http(s) URL or a path
  starting with `/`, and `video.youtubeId` the 11 character YouTube id.
- With no posts or no projects the pages show a short empty message and hide the filter. `task empty`
  checks this.
- The tests read your content and `site.config.ts`, so they stay green after you replace the sample. A few
  tests need sample-like content and skip themselves when it is absent: the slideshow tests need at least two
  featured items, and the video tests need a featured or listed project with a `video`.
- Lighthouse CI (`pnpm lhci autorun`) picks its post URL from the first post in `dist/writing/`.

## Decisions

- **TypeScript is pinned to 6.0.3.** `@astrojs/check` and typescript-eslint do not support TypeScript 7 yet.
- **Playwright is pinned to exactly 1.63.0.** Each version needs one specific browser build, so it is not
  allowed to drift.
- All other dependencies are pinned exactly, and the lockfile is committed.
- No Cloudflare-only features and no adapter. Where to host is a separate decision.

## Licence

The code is MIT licensed, see `LICENSE`. The site's written content (posts, project write-ups, resume) and
personal data (name, photos, contact details) are all rights reserved, and are not covered by the MIT licence.
