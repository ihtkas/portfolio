import type { FeaturedRef } from './site';
import type { Post } from './posts';
import type { Project } from './projects';

export type FeaturedItem = { kind: 'post'; entry: Post } | { kind: 'project'; entry: Project };

/** Resolves `site.featured` against the collections. Throws on an unknown slug so the build fails loudly. */
export function resolveFeatured(
  refs: FeaturedRef[],
  posts: Post[],
  projects: Project[],
): FeaturedItem[] {
  return refs.map((ref) => {
    if (ref.kind === 'post') {
      const entry = posts.find((p) => p.id === ref.slug);
      if (!entry)
        throw new Error(
          `site.featured: no published post with slug "${ref.slug}" (missing or draft)`,
        );
      return { kind: 'post', entry };
    }
    const entry = projects.find((p) => p.id === ref.slug);
    if (!entry) throw new Error(`site.featured: no project with slug "${ref.slug}" (missing)`);
    return { kind: 'project', entry };
  });
}
