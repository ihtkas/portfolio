import type { SiteConfig } from './src/lib/site';

export const site: SiteConfig = {
  name: 'Sakthi Natesan',
  mark: 'sakthibuilds',
  tagline: 'Sample tagline: replace with one line about what you do.',
  location: 'Bangalore',
  siteUrl: 'https://sakthibuilds.dev',
  description: 'Sample description: replace with a short summary of this site.',
  socials: {
    github: 'https://github.com/ihtkas',
    linkedin: 'https://www.linkedin.com/in/sakthi-natesan/',
    rss: true,
  },
  nav: [
    { label: 'Home', href: '/' },
    { label: 'Writing', href: '/writing/' },
    { label: 'Projects', href: '/projects/' },
    { label: 'Resume', href: '/resume/' },
  ],
  about: 'Sample about text. Replace this paragraph with a short introduction.',
  now: [
    { title: 'Building', line: 'Sample: what you are building right now.' },
    { title: 'Reading', line: 'Sample: what you are reading right now.' },
    { title: 'Learning', line: 'Sample: what you are learning right now.' },
  ],
  featured: [
    { kind: 'post', slug: 'sample-engineering-post' },
    { kind: 'project', slug: 'sample-oss-project' },
  ],
};
