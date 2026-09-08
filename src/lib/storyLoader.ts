// src/lib/storyLoader.ts
// Reads .txt files from src/data/stories/ and converts them into Story objects.
// Smart enough to handle Word-style exports (single line breaks between paragraphs).

import type { Story, StoryBlock } from '../data/stories';
import { esc } from './escape';

export interface StoryMeta {
    slug: string;
    title: string;
    author: string;
    genre: string;
    excerpt: string;
    publishedDate: string;
    hidden?: boolean;
    cover?: string;
    genreTag?: string;
}

function estimateReadTime(wordCount: number): string {
    const minutes = Math.max(1, Math.round(wordCount / 200));
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
}

// Detect whether the text uses blank-line paragraph breaks (clean)
// or single line breaks everywhere (Word export style).
function needsLineMerge(raw: string): boolean {
    const lines = raw.split(/\r?\n/);
    const nonEmpty = lines.filter((l) => l.trim().length > 0);
    const blank = lines.filter((l) => l.trim().length === 0);
    // If there are many lines but very few blanks, Word probably used soft breaks.
    return nonEmpty.length > 5 && blank.length < nonEmpty.length / 3;
}

// Merge Word-style soft line breaks into proper paragraphs.
// Rule: a line that ends with sentence punctuation (. ! ? " ” ') likely ends a paragraph.
function mergeSoftBreaks(raw: string): string {
    const lines = raw.split(/\r?\n/);
    const out: string[] = [];
    let buffer = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (buffer) {
                out.push(buffer);
                buffer = '';
            }
            out.push('');
            continue;
        }
        buffer = buffer ? buffer + ' ' + trimmed : trimmed;

        // If the line ends like a sentence, close the paragraph.
        if (/[.!?”"']\s*$/.test(trimmed)) {
            out.push(buffer);
            buffer = '';
        }
    }
    if (buffer) out.push(buffer);
    return out.join('\n\n');
}

// Parse raw text into structured blocks.
// Supports:
//   *italic*    → italic emphasis
//   ---         → section divider (rendered as ✦)
//   # Heading   → section heading
//   > quote     → pull quote
//   blank line  → paragraph break
// Parses Tiptap HTML content into clean story blocks
function stripHtml(s: string): string {
    return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseHtmlBody(html: string, preserveLines = false): StoryBlock[] {
    const blocks: StoryBlock[] = [];
    let isFirstParagraph = true;
       const tagRe = /<(p|blockquote|h[1-3])([^>]*)>([\s\S]*?)<\/\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(html))) {
                const tag = m[1].toLowerCase();
        const alignMatch = m[2].match(/text-align\s*:\s*(left|center|right)/i);
        const align = (alignMatch ? alignMatch[1].toLowerCase() : undefined) as 'left' | 'center' | 'right' | undefined;
        let inner = m[3]
            .replace(/<br\s*\/?>/gi, preserveLines ? '__BR__' : ' ')
            // keep only em / i / strong / b; strip everything else (spans, style junk)
            .replace(preserveLines ? /<\/?(?!em|i|strong|b|__BR__)[a-z][^>]*>/gi : /<\/?(?!em|i|strong|b)[a-z][^>]*>/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/__BR__/g, '<br>');
        if (!inner) continue;
        if (tag === 'blockquote') {
            blocks.push({ type: 'quote', text: inner });
        } else if (tag.startsWith('h')) {
            blocks.push({ type: 'heading', text: inner });
                } else {
             blocks.push({ type: 'paragraph', text: inner, dropcap: isFirstParagraph && !preserveLines, ...(align ? { align } : {}) });
            isFirstParagraph = false;
        }
    }
    if (blocks.length === 0) {
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text) blocks.push({ type: 'paragraph', text, dropcap: true });
    }
    return blocks;
}

function parseBody(raw: string, preserveLines = false): StoryBlock[] {
    // Tiptap saves HTML — route it through the HTML parser
    if (/<(p|blockquote|h[1-6])[\s>]/i.test(raw)) {
        return parseHtmlBody(raw, preserveLines);
    }
    const normalized = needsLineMerge(raw) ? mergeSoftBreaks(raw) : raw;
    const blocks: StoryBlock[] = [];
    const paragraphs = normalized.split(/\n\s*\n/);

    let isFirstParagraph = true;

    for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        if (/^-{3,}$/.test(trimmed)) {
            blocks.push({ type: 'heading', text: '✦' });
            continue;
        }

        if (trimmed.startsWith('# ')) {
            blocks.push({ type: 'heading', text: trimmed.slice(2).trim() });
            continue;
        }

        if (trimmed.startsWith('> ')) {
            blocks.push({ type: 'quote', text: trimmed.slice(2).trim() });
            continue;
        }

        blocks.push({
            type: 'paragraph',
            text: esc(trimmed.replace(/\s+/g, ' ')),
            dropcap: isFirstParagraph,
        });
        isFirstParagraph = false;
    }

    return blocks;
}

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

export function bandFromWords(words: number): string {
    if (words < 1000) return 'Flash Fiction';
    if (words < 7500) return 'Short Story';
    if (words < 17500) return 'Novelette';
    return 'Novella';
}

export function buildStory(meta: StoryMeta, rawText: string): Story {
    const wordCount = countWords(rawText);
        return {
        ...meta,
        genre: bandFromWords(wordCount),
        genreTag: meta.genreTag || 'Literary Fiction',
        wordCount,
        readTime: estimateReadTime(wordCount),
        content: parseBody(rawText),
    };
}
// Converts a raw Supabase database row into our Story shape
export function buildStoryFromDB(row: any): Story {
    const plain = stripHtml(row.content || '');
    const wordCount = countWords(plain);
    const excerpt = row.excerpt || (plain ? plain.substring(0, 150) + '...' : 'A new story on Raconteur.');
    const isPoem = row.kind === 'poem' || row.genre === 'Poetry';
        return {
        slug: row.id,
        title: row.title,
        author: row.author_name,
        author_id: row.author_id,
        kind: row.kind || 'story',
        collection_id: row.collection_id || null,
        genre: isPoem ? 'Poetry' : bandFromWords(wordCount),
        genreTag: row.genre_tag || 'Literary Fiction',
        cover: row.cover_url || undefined,
        publishedDate: row.created_at,
        excerpt: excerpt,
        wordCount: wordCount,
        readTime: estimateReadTime(wordCount),
        readCount: (row as any).read_count || 0,
        content: parseBody(row.content || '', isPoem),
        is_featured: row.is_featured || false
    };
}