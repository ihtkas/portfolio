import { describe, expect, it } from 'vitest';
import { groupByYear, neighbours, publishedPosts, readingMinutes } from '../../src/lib/posts';

const post = (id: string, date: string, draft = false) =>
  ({
    id,
    body: '',
    data: { title: id, date: new Date(date), dek: 'd', kind: 'engineering', tags: [], draft },
  }) as never;

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('readingMinutes', () => {
  it('is at least 1', () => expect(readingMinutes('')).toBe(1));
  it('uses 200 words per minute', () => expect(readingMinutes(words(400))).toBe(2));
});

describe('publishedPosts', () => {
  const all = [post('a', '2024-01-01'), post('b', '2025-01-01', true), post('c', '2025-06-01')];
  it('drops drafts and sorts newest first when drafts are excluded', () => {
    expect(publishedPosts(all, { includeDrafts: false }).map((p) => p.id)).toEqual(['c', 'a']);
  });
  it('keeps drafts when included', () => {
    expect(publishedPosts(all, { includeDrafts: true }).map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('groupByYear', () => {
  it('returns [] for no posts', () => expect(groupByYear([])).toEqual([]));
  it('groups by year, newest first', () => {
    const groups = groupByYear([
      post('c', '2025-06-01'),
      post('b', '2025-01-01'),
      post('a', '2024-01-01'),
    ]);
    expect(groups.map((g) => g.year)).toEqual([2025, 2024]);
    expect(groups[0]?.posts).toHaveLength(2);
  });
});

describe('neighbours', () => {
  const sorted = [post('c', '2025-06-01'), post('b', '2025-01-01'), post('a', '2024-01-01')];
  it('has no newer for the newest post', () => {
    const n = neighbours(sorted, 'c');
    expect(n.newer).toBeUndefined();
    expect(n.older?.id).toBe('b');
  });
  it('has no older for the oldest post', () => {
    const n = neighbours(sorted, 'a');
    expect(n.older).toBeUndefined();
    expect(n.newer?.id).toBe('b');
  });
  it('returns nothing for an unknown slug', () => expect(neighbours(sorted, 'zzz')).toEqual({}));
});
