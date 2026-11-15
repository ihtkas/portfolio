import { describe, expect, it } from 'vitest';
import type { Resume } from '../../src/lib/resume';
import type { SiteConfig } from '../../src/lib/site';
import { ids, person, pngSize } from '../../src/lib/structured-data';

const site = {
  name: 'Ada',
  description: 'Desc',
  location: 'Town',
  socials: { github: 'https://github.com/ada', rss: true },
} as unknown as SiteConfig;

const resume = (orgs: Resume['orgs']): Resume => ({
  summary: '',
  skills: { A: ['Go'], B: ['SQL'] },
  education: [{ school: 'Uni', degree: 'BSc', years: '2000 to 2004' }],
  orgs,
});

describe('person', () => {
  const id = ids('https://e.com');
  it('takes the job and employer from the current role', () => {
    const p = person(
      site,
      resume([
        {
          name: 'Now Co',
          period: '2024 to present',
          roles: [{ title: 'Lead', period: '2024 to present', bullets: [] }],
        },
        { name: 'Old Co', period: '2020 to 2024', roles: [] },
      ]),
      id,
    );
    expect(p['@id']).toBe('https://e.com/#person');
    expect(p.jobTitle).toBe('Lead');
    expect(p.worksFor).toEqual({ '@type': 'Organization', name: 'Now Co' });
    expect(p.knowsAbout).toEqual(['Go', 'SQL']);
    expect(p.sameAs).toEqual(['https://github.com/ada']);
  });
  it('leaves job and employer out when nothing is current', () => {
    const p = person(site, resume([{ name: 'Old', period: '2020 to 2021', roles: [] }]), id);
    expect(p).not.toHaveProperty('jobTitle');
    expect(p).not.toHaveProperty('worksFor');
  });
});

describe('pngSize', () => {
  it('reads the OG image size', () => {
    expect(pngSize('public/og-default.png')).toEqual({ width: 1200, height: 630 });
  });
});
