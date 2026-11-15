import type { CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

/** Sections ordered by their lowest `order`; items inside a section ordered by `order`. */
export function groupProjects(projects: Project[]): { section: string; items: Project[] }[] {
  const sorted = [...projects].sort((a, b) => a.data.order - b.data.order);
  const groups = new Map<string, Project[]>();
  for (const p of sorted) {
    const items = groups.get(p.data.section);
    if (items) items.push(p);
    else groups.set(p.data.section, [p]);
  }
  return [...groups].map(([section, items]) => ({ section, items }));
}
