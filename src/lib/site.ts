export interface FeaturedRef {
  kind: 'post' | 'project';
  slug: string;
}

export interface SiteConfig {
  name: string;
  mark: string;
  tagline: string;
  location: string;
  siteUrl: string;
  description: string;
  socials: {
    github?: string;
    linkedin?: string;
    email?: string;
    rss: boolean;
  };
  nav: { label: string; href: string }[];
  about: string;
  now: { title: string; line: string }[];
  featured: FeaturedRef[];
}
