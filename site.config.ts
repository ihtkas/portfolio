import type { SiteConfig } from './src/lib/site';

export const site: SiteConfig = {
  name: 'Sakthi Natesan',
  mark: 'Sakthi Natesan',
  tagline: 'Engineering manager building software with AI agents.',
  location: 'Bangalore',
  siteUrl: 'https://sakthibuilds.dev',
  description:
    'Writing and projects from Sakthi Natesan, an engineering manager in Bangalore who builds software with AI agents.',
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
  about:
    'I have worked on distributed systems for about 12 years, and I lead the Developer Experience and Core Platform teams at slice. In my own time I build software with AI coding agents and write about what works.',
  now: [
    {
      title: 'Software factory',
      line: 'Shared libraries for building and self-hosting production software with AI agents.',
    },
    {
      title: 'Vela',
      line: 'Self-hosted project management for software teams, in acceptance testing.',
    },
    {
      title: 'My Mac and the agent box',
      line: 'A MacBook rebuilt from one repo, and a sandbox where coding agents run unattended.',
    },
  ],
  pages: {
    writing: {
      lede: 'Notes on building software with AI coding agents, and what it changes for teams.',
    },
    projects: {
      lede: 'What I build in my own time, on weekends and holidays: with AI coding agents, a very small team can build and run software that used to need a large one.',
    },
  },
  featured: [
    { kind: 'project', slug: 'software-factory' },
    { kind: 'post', slug: 'software-is-cheap-now' },
    { kind: 'project', slug: 'vela' },
    { kind: 'post', slug: 'building-the-software-factory' },
  ],
};
