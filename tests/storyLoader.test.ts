// tests/storyLoader.test.ts — CHARACTERISATION tests for the reader engine.
// Locks the CURRENT behaviour of src/lib/storyLoader.ts: band boundaries,
// read-time math, the plain-text parser (chapters/dividers/dropcaps) and the
// DB-row → Story mapper (poem mode, excerpt fallback, chapter paging).
import { describe, it, expect } from 'vitest';
import { bandFromWords, buildStory, buildStoryFromDB } from '../src/lib/storyLoader';

const meta = {
    slug: 's1',
    title: 'The Test Story',
    author: 'Jane Writer',
    genre: 'will-be-replaced',
    excerpt: 'e',
    publishedDate: '2026-01-01',
};

describe('bandFromWords — the length bands', () => {
    it('under 1000 words is Flash Fiction', () => {
        expect(bandFromWords(0)).toBe('Flash Fiction');
        expect(bandFromWords(999)).toBe('Flash Fiction');
    });
    it('1000–7499 is Short Story', () => {
        expect(bandFromWords(1000)).toBe('Short Story');
        expect(bandFromWords(7499)).toBe('Short Story');
    });
    it('7500–17499 is Novelette', () => {
        expect(bandFromWords(7500)).toBe('Novelette');
        expect(bandFromWords(17499)).toBe('Novelette');
    });
    it('17500+ is Novella', () => {
        expect(bandFromWords(17500)).toBe('Novella');
        expect(bandFromWords(99999)).toBe('Novella');
    });
});

describe('buildStory — plain-text parsing', () => {
    it('counts words and derives read time at ~200 wpm, minimum 1', () => {
        const s = buildStory(meta, 'one two three\n\nfour five');
        expect(s.wordCount).toBe(5);
        expect(s.readTime).toBe('1 min read');
    });

    it('rounds read time up (300 words → 2 min)', () => {
        const text = Array.from({ length: 300 }, (_, i) => `w${i}`).join(' ');
        expect(buildStory(meta, text).readTime).toBe('2 min read');
    });

    it('clamps short stories to at least 1 min', () => {
        const text = Array.from({ length: 60 }, (_, i) => `w${i}`).join(' ');
        expect(buildStory(meta, text).readTime).toBe('1 min read');
    });

    it('overrides meta.genre with the computed band', () => {
        expect(buildStory(meta, 'tiny').genre).toBe('Flash Fiction');
    });

    it('defaults genreTag to Literary Fiction, preserves a custom one', () => {
        expect(buildStory(meta, 'tiny').genreTag).toBe('Literary Fiction');
        expect(buildStory({ ...meta, genreTag: 'Weird Fiction' }, 'tiny').genreTag).toBe('Weird Fiction');
    });

    it('blank lines split paragraphs; only the first gets the dropcap', () => {
        const s = buildStory(meta, 'First para here.\n\nSecond para.\n\nThird para.');
        expect(s.content.map((b: any) => b.type)).toEqual(['paragraph', 'paragraph', 'paragraph']);
        expect(s.content[0].dropcap).toBe(true);
        expect(s.content[1].dropcap).toBe(false);
        expect(s.content[2].dropcap).toBe(false);
        expect(s.content[0].text).toBe('First para here.');
    });

    it('--- becomes the ✦ divider heading and advances the chapter', () => {
        const s = buildStory(meta, 'Para one.\n\n---\n\nPara two.');
        expect(s.content[1].type).toBe('heading');
        expect(s.content[1].text).toBe('✦');
        expect(s.content[1].chapter).toBe(1);
        expect(s.content[2].chapter).toBe(1);
    });

    it('"Chapter 1" at the very top leads chapter 0 (no empty first chapter)', () => {
        const s = buildStory(meta, 'Chapter 1\n\nText of chapter one.');
        expect(s.content[0].type).toBe('heading');
        expect(s.content[0].text).toBe('Chapter 1');
        expect(s.content[0].chapter).toBe(0);
        expect(s.content[1].chapter).toBe(0);
    });

    it('a later chapter marker advances the chapter only when content exists', () => {
        const s = buildStory(meta, 'Chapter 1\n\nText one.\n\nChapter 2\n\nText two.');
        expect(s.content.map((b: any) => [b.type, b.chapter])).toEqual([
            ['heading', 0],
            ['paragraph', 0],
            ['heading', 1],
            ['paragraph', 1],
        ]);
        expect(s.content[2].text).toBe('Chapter 2');
    });
});

describe('buildStoryFromDB — the Supabase row mapper', () => {
    it('maps the core fields (slug=row.id, author=row.author_name)', () => {
        const s = buildStoryFromDB({
            id: 'uuid-1',
            title: 'DB Story',
            author_name: 'Writer',
            content: '<p>Just a short body.</p>',
            created_at: '2026-02-02T00:00:00Z',
        });
        expect(s.slug).toBe('uuid-1');
        expect(s.title).toBe('DB Story');
        expect(s.author).toBe('Writer');
        expect(s.kind).toBe('story');
        expect(s.publishedDate).toBe('2026-02-02T00:00:00Z');
        expect(s.readCount).toBe(0);
        expect(s.is_featured).toBe(false);
    });

    it('strips HTML for the word count and bands accordingly', () => {
        const words = Array.from({ length: 1200 }, (_, i) => `w${i}`).join(' ');
        const s = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: `<p>${words}</p>` });
        expect(s.wordCount).toBe(1200);
        expect(s.genre).toBe('Short Story');
    });

    it('falls back to the first 150 chars + "..." when the row has no excerpt', () => {
        const long = Array.from({ length: 200 }, (_, i) => `w${i}`).join(' ');
        const s = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: `<p>${long}</p>` });
        expect(s.excerpt).toBe(long.substring(0, 150) + '...');
        const withExcerpt = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: '<p>x</p>', excerpt: 'Hand-written.' });
        expect(withExcerpt.excerpt).toBe('Hand-written.');
    });

    it('an empty body falls back to the house excerpt line', () => {
        const s = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: '' });
        expect(s.excerpt).toBe('A new story on Raconteur.');
        expect(s.content).toEqual([]);
        expect(s.genre).toBe('Flash Fiction');
    });

    it('poem rows become Poetry with preserved line breaks and no dropcap', () => {
        const s = buildStoryFromDB({ id: 'u', title: 'Poem', author_name: 'a', kind: 'poem', content: '<p>line one<br>line two</p>' });
        expect(s.genre).toBe('Poetry');
        expect(s.kind).toBe('poem');
        expect(s.content[0].text).toBe('line one<br>line two');
        expect(s.content[0].dropcap).toBeFalsy();
    });

    it('"Chapter 1" paragraphs page the story like an ebook', () => {
        const s = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: '<p>Chapter 1</p><p>One.</p><p>Chapter 2</p><p>Two.</p>' });
        expect(s.content.map((b: any) => [b.type, b.text, b.chapter])).toEqual([
            ['heading', 'Chapter 1', 0],
            ['paragraph', 'One.', 0],
            ['heading', 'Chapter 2', 1],
            ['paragraph', 'Two.', 1],
        ]);
    });

    it('h1/h2 are chapter boundaries, h3 stays in-chapter', () => {
        const s = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: '<p>P1.</p><h2>Big Head</h2><p>P2.</p>' });
        expect(s.content[1]).toMatchObject({ type: 'heading', chapter: 1 });
        expect(s.content[2]).toMatchObject({ chapter: 1 });
        const s3 = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: '<p>P1.</p><h3>Sub Head</h3><p>P2.</p>' });
        expect(s3.content[1]).toMatchObject({ type: 'heading', chapter: 0 });
        expect(s3.content[2]).toMatchObject({ chapter: 0 });
    });

    it('blockquotes become quote blocks; text-align is preserved on paragraphs', () => {
        const s = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: '<blockquote>Quoted line.</blockquote><p style="text-align: center">Centered.</p>' });
        expect(s.content[0]).toMatchObject({ type: 'quote', text: 'Quoted line.' });
        expect(s.content[1]).toMatchObject({ type: 'paragraph', align: 'center' });
    });

    it('cover_url maps to cover (undefined when absent); read_count flows through', () => {
        const withCover = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: '<p>x</p>', cover_url: 'https://example.com/c.png', read_count: 7 });
        expect(withCover.cover).toBe('https://example.com/c.png');
        expect(withCover.readCount).toBe(7);
        const noCover = buildStoryFromDB({ id: 'u', title: 't', author_name: 'a', content: '<p>x</p>' });
        expect(noCover.cover).toBeUndefined();
    });
});

