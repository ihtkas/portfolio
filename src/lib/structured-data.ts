// schema.org JSON-LD nodes, built only from site.config.ts, the resume data and the collections.
import { readFileSync } from 'node:fs';
import { isoDateTime } from './agents';
import { readingWords, type Post } from './posts';
import type { Resume } from './resume';
import type { SiteConfig } from './site';

export const LANGUAGE = 'en';
export const OG_IMAGE_PATH = '/og-default.png';

/** Width and height of a PNG in public/, read from its IHDR chunk. */
export function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

export interface Ids {
  base: URL | string;
  person: string;
  website: string;
}

export const ids = (base: URL | string): Ids => ({
  base,
  person: new URL('/#person', base).href,
  website: new URL('/#website', base).href,
});

const abs = (path: string, base: URL | string) => new URL(path, base).href;

function image(base: URL | string) {
  const { width, height } = pngSize(`public${OG_IMAGE_PATH}`);
  return { '@type': 'ImageObject', url: abs(OG_IMAGE_PATH, base), width, height };
}

/** The full Person node. Job and employer come from the first resume role marked "present". */
export function person(site: SiteConfig, resume: Resume, id: Ids) {
  const current = resume.orgs.find((o) => /present/i.test(o.period));
  const role = current?.roles.find((r) => /present/i.test(r.period)) ?? current?.roles[0];
  return {
    '@type': 'Person',
    '@id': id.person,
    name: site.name,
    url: abs('/', id.base),
    image: image(id.base),
    description: site.description,
    ...(role && { jobTitle: role.title }),
    ...(current && { worksFor: { '@type': 'Organization', name: current.name } }),
    homeLocation: { '@type': 'Place', name: site.location },
    alumniOf: resume.education.map((e) => ({ '@type': 'EducationalOrganization', name: e.school })),
    knowsAbout: Object.values(resume.skills).flat(),
    sameAs: [site.socials.github, site.socials.linkedin].filter((u): u is string => Boolean(u)),
  };
}

/** A short Person reference for nodes on pages that do not carry the full Person. */
const author = (site: SiteConfig, id: Ids) => ({
  '@type': 'Person',
  '@id': id.person,
  name: site.name,
  url: abs('/', id.base),
});

export function homeGraph(site: SiteConfig, resume: Resume, id: Ids) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      person(site, resume, id),
      {
        '@type': 'WebSite',
        '@id': id.website,
        url: abs('/', id.base),
        name: site.name,
        description: site.description,
        inLanguage: LANGUAGE,
        publisher: { '@id': id.person },
      },
    ],
  };
}

export function blogPosting(site: SiteConfig, post: Post, id: Ids) {
  const url = abs(`/writing/${post.id}/`, id.base);
  const { title, dek, date, updated, tags } = post.data;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: dek,
    datePublished: isoDateTime(date),
    dateModified: isoDateTime(updated ?? date),
    author: author(site, id),
    image: image(id.base),
    url,
    mainEntityOfPage: url,
    isPartOf: { '@type': 'Blog', '@id': abs('/writing/', id.base) },
    inLanguage: LANGUAGE,
    keywords: tags,
    wordCount: readingWords(post.body ?? ''),
  };
}

export function blog(site: SiteConfig, posts: Post[], id: Ids) {
  const url = abs('/writing/', id.base);
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': url,
    url,
    name: `Writing by ${site.name}`,
    description: site.pages.writing.lede,
    inLanguage: LANGUAGE,
    author: author(site, id),
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.data.title,
      url: abs(`/writing/${p.id}/`, id.base),
      datePublished: isoDateTime(p.data.date),
    })),
  };
}

export function profilePage(site: SiteConfig, resume: Resume, id: Ids) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: abs('/resume/', id.base),
    name: `Resume of ${site.name}`,
    inLanguage: LANGUAGE,
    mainEntity: person(site, resume, id),
  };
}
