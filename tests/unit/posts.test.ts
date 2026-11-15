import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  groupByYear,
  neighbours,
  publishedPosts,
  readingMinutes,
  type Post,
} from '../../src/lib/posts';

const post = (id: string, date: string, draft = false) =>
  ({
    id,
    body: '',
    data: { title: id, date: new Date(date), dek: 'd', kind: 'engineering', tags: [], draft },
  }) as unknown as Post;

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

describe('readingMinutes', () => {
  it('is at least 1', () => expect(readingMinutes('')).toBe(1));
  it('uses 200 words per minute', () => expect(readingMinutes(words(400))).toBe(2));
});

describe('publishedPosts', () => {
  afterEach(() => vi.unstubAllEnvs());
  const all = [post('a', '2024-01-01'), post('b', '2025-01-01', true), post('c', '2025-06-01')];
  it('drops drafts and sorts newest first when drafts are excluded', () => {
    expect(publishedPosts(all, { includeDrafts: false }).map((p) => p.id)).toEqual(['c', 'a']);
  });
  it('drops drafts by default in production', () => {
    vi.stubEnv('PROD', true);
    expect(publishedPosts(all).map((p) => p.id)).toEqual(['c', 'a']);
  });
  it('keeps drafts by default outside production', () => {
    vi.stubEnv('PROD', false);
    expect(publishedPosts(all).map((p) => p.id)).toEqual(['c', 'b', 'a']);
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

describe('groupByYear input order and time zone', () => {
  it('sorts a copy newest first and does not mutate the input', () => {
    const input = [post('a', '2024-01-01'), post('c', '2025-06-01'), post('b', '2025-01-01')];
    const groups = groupByYear(input);
    expect(groups.map((g) => g.year)).toEqual([2025, 2024]);
    expect(groups[0]?.posts.map((p) => p.id)).toEqual(['c', 'b']);
    expect(input.map((p) => p.id)).toEqual(['a', 'c', 'b']);
  });
  it('groups by the UTC year', () => {
    const groups = groupByYear([
      post('x', '2025-01-01T00:00:00Z'),
      post('y', '2024-12-31T23:59:59Z'),
    ]);
    expect(groups.map((g) => g.year)).toEqual([2025, 2024]);
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
  it('works on unsorted input', () => {
    const shuffled = [post('a', '2024-01-01'), post('c', '2025-06-01'), post('b', '2025-01-01')];
    const n = neighbours(shuffled, 'b');
    expect(n.newer?.id).toBe('c');
    expect(n.older?.id).toBe('a');
  });
  it('returns nothing for an empty list', () => expect(neighbours([], 'x')).toEqual({}));
  it('returns nothing for an unknown slug', () => expect(neighbours(sorted, 'zzz')).toEqual({}));
});
