import { z } from 'astro/zod';
import data from '../data/resume.json';

export const resumeSchema = z.object({
  summary: z.string(),
  skills: z.record(z.string(), z.array(z.string())),
  education: z.array(z.object({ school: z.string(), degree: z.string(), years: z.string() })),
  orgs: z.array(
    z.object({
      name: z.string(),
      period: z.string(),
      roles: z.array(
        z.object({
          title: z.string(),
          period: z.string(),
          intro: z.string().optional(),
          bullets: z.array(z.string()),
        }),
      ),
    }),
  ),
  pdf: z.string(),
});

export type Resume = z.infer<typeof resumeSchema>;

export function loadResume(): Resume {
  return resumeSchema.parse(data);
}
