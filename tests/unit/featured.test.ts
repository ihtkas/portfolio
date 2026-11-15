import { describe, expect, it } from 'vitest';
import { resolveFeatured } from './featured';
import type { Post } from './posts';
import type { Project } from './projects';

const post = { id: 'a-post' } as Post;
const project = { id: 'a-project' } as Project;

describe('resolveFeatured', () => {
  it('resolves refs in order', () => {
    const out = resolveFeatured(
      [
        { kind: 'project', slug: 'a-project' },
        { kind: 'post', slug: 'a-post' },
      ],
      [post],
      [project],
    );
    expect(out.map((i) => i.kind)).toEqual(['project', 'post']);
  });

  it('throws a clear error for an unknown slug', () => {
    expect(() => resolveFeatured([{ kind: 'post', slug: 'nope' }], [post], [project])).toThrow(
      'site.featured: no post with slug "nope"',
    );
    expect(() => resolveFeatured([{ kind: 'project', slug: 'nope' }], [post], [project])).toThrow(
      'site.featured: no project with slug "nope"',
    );
  });
});
