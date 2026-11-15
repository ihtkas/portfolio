import { describe, expect, it } from 'vitest';
import { loadResume, resumeSchema } from '../../src/lib/resume';

describe('resume schema', () => {
  it('accepts the shipped resume data', () => {
    const resume = loadResume();
    expect(resume.orgs.length).toBeGreaterThan(0);
  });
  it('treats the PDF as optional', () => {
    const rest: Record<string, unknown> = { ...loadResume() };
    delete rest['pdf'];
    expect(resumeSchema.safeParse(rest).success).toBe(true);
    expect(resumeSchema.safeParse({ ...rest, pdf: '/resume.pdf' }).success).toBe(true);
  });
  it('rejects a role without a title', () => {
    const bad = {
      ...loadResume(),
      orgs: [{ name: 'Example Co', period: '2020', roles: [{ period: '2020', bullets: [] }] }],
    };
    expect(resumeSchema.safeParse(bad).success).toBe(false);
  });
});
