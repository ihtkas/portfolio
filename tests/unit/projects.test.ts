import { describe, expect, it } from 'vitest';
import { groupProjects } from '../../src/lib/projects';

const project = (id: string, section: string, order: number) =>
  ({ id, data: { title: id, section, order } }) as never;

describe('groupProjects', () => {
  it('returns [] for no projects', () => expect(groupProjects([])).toEqual([]));
  it('orders sections by their lowest order and items by order', () => {
    const groups = groupProjects([
      project('b2', 'Beta', 5),
      project('a2', 'Alpha', 3),
      project('b1', 'Beta', 1),
      project('a1', 'Alpha', 2),
    ]);
    expect(groups.map((g) => g.section)).toEqual(['Beta', 'Alpha']);
    expect(groups[0]?.items.map((p) => p.id)).toEqual(['b1', 'b2']);
    expect(groups[1]?.items.map((p) => p.id)).toEqual(['a1', 'a2']);
  });
});
