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
    let chapterIndex = 0;
    let chapterHasContent = false;
       const tagRe = /<(p|blockquote|h[1-3])([^>]*)>([\s\S]*?)<\/\1>/gi;
    let m: RegExpExecArray | null;

    // Chapter boundary detection — lets uploaded stories paginate like an ebook.
    // A SHORT standalone line is treated as a chapter marker when it looks like:
    //   "Chapter 1", "CHAPTER 2: The Portal", "Ch. 5", "Chapter Twelve",
    //   "Part One", "Prologue", "Epilogue", "Interlude"
    // or a scene divider: "---", "***", "* * *", "✦"
    const chapterTextRe = /^(chapter|chap\.?|ch\.?)\s*(\d+|[ivxlcdm]+\b|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b[\s.:—–-]*/i;
    const namedChapterRe = /^(prologue|epilogue|interlude|part\s+([a-z]+|\d+))\b/i;
    const dividerRe = /^([-–—_*]\s*){3,}$|^✦+$/;
    const isChapterMarker = (plain: string) =>
        plain.length <= 60 && (chapterTextRe.test(plain) || namedChapterRe.test(plain) || dividerRe.test(plain));

    // A chapter heading belongs to the content that FOLLOWS it. The counter only
    // advances when the current chapter already has content, so "Chapter 1" at
    // the very top of a story leads its own group instead of leaving an empty
    // first page with the heading stranded at the bottom.
    const pushChapterHeading = (text: string) => {
        if (chapterHasContent) {
            chapterIndex++;
            chapterHasContent = false;
        }
        blocks.push({ type: 'heading', text, chapter: chapterIndex });
    };

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

        // Visible text without any tags — used for chapter detection only
        const plainText = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

        // Bold/plain lines like "Chapter 1" or "CHAPTER 2: The Portal" start a new chapter
        if (tag === 'p' && isChapterMarker(plainText)) {
            pushChapterHeading(dividerRe.test(plainText) ? '✦' : plainText);
            continue;
        }

        // Top-level headings (h1/h2) are treated as chapter boundaries too.
        // h3 stays an in-chapter subheading so section titles don't over-split.
        if ((tag === 'h1' || tag === 'h2') && !preserveLines) {
            pushChapterHeading(inner);
            continue;
        }

        if (tag === 'blockquote') {
            blocks.push({ type: 'quote', text: inner, chapter: chapterIndex });
            chapterHasContent = true;
        } else if (tag.startsWith('h')) {
            blocks.push({ type: 'heading', text: inner, chapter: chapterIndex });
            chapterHasContent = true;
                } else {
             blocks.push({ type: 'paragraph', text: inner, dropcap: isFirstParagraph && !preserveLines, ...(align ? { align } : {}), chapter: chapterIndex });
            isFirstParagraph = false;
            chapterHasContent = true;
        }
    }
    if (blocks.length === 0) {
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text) blocks.push({ type: 'paragraph', text, dropcap: true, chapter: 0 });
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
    
    // Split on blank lines OR chapter markers
    const chapterPattern = /^(CH\s+\d+[:.]?\s*|Chapter\s+\d+[:.]?\s*|---+|\*\*\*+)$/i;
    const lines = normalized.split(/\n/);
    let currentPara = '';
    let isFirstParagraph = true;
    let chapterIndex = 0;
    let chapterHasContent = false;

    for (const line of lines) {
        const trimmed = line.trim();
        
        // Check if this line is a chapter marker
        if (chapterPattern.test(trimmed)) {
            // Flush any accumulated paragraph
            if (currentPara.trim()) {
                blocks.push({
                    type: 'paragraph',
                    text: esc(currentPara.trim().replace(/\s+/g, ' ')),
                    dropcap: isFirstParagraph,
                    chapter: chapterIndex,
                });
                isFirstParagraph = false;
                currentPara = '';
                chapterHasContent = true;
            }
            // The heading leads the chapter that FOLLOWS it — only advance the
            // counter when the current chapter already has content
            if (chapterHasContent) {
                chapterIndex++;
                chapterHasContent = false;
            }
            // Add chapter heading
            if (/^---+|\*\*\*+$/.test(trimmed)) {
                blocks.push({ type: 'heading', text: '✦', chapter: chapterIndex });
            } else {
                blocks.push({ type: 'heading', text: trimmed, chapter: chapterIndex });
            }
            continue;
        }
        
        // Blank line = paragraph break
        if (!trimmed) {
            if (currentPara.trim()) {
                blocks.push({
                    type: 'paragraph',
                    text: esc(currentPara.trim().replace(/\s+/g, ' ')),
                    dropcap: isFirstParagraph,
                    chapter: chapterIndex,
                });
                isFirstParagraph = false;
                currentPara = '';
                chapterHasContent = true;
            }
            continue;
        }
        
        // Accumulate text into current paragraph
        currentPara = currentPara ? currentPara + ' ' + trimmed : trimmed;
    }
    
    // Flush final paragraph
    if (currentPara.trim()) {
        blocks.push({
            type: 'paragraph',
            text: esc(currentPara.trim().replace(/\s+/g, ' ')),
            dropcap: isFirstParagraph,
            chapter: chapterIndex,
        });
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