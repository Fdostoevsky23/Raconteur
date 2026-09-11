// src/data/stories.ts
// Your story database. Add new stories by appending to the array below.

import { buildStory } from '../lib/storyLoader';
import poetsFromTomorrowRaw from './stories/poets-from-tomorrow.txt?raw';

export interface Story {
    slug: string;
    title: string;
    author: string;
    author_id?: string;
    readCount?: number;
    on_homepage?: boolean;
    genre: string;
    kind?: 'story' | 'poem';
    collection_id?: string | null;
    is_featured?: boolean;
    excerpt: string;
    publishedDate: string;
    hidden?: boolean;
    cover?: string;
    genreTag?: string;
    wordCount: number;
    readTime: string;
    content: StoryBlock[];
}

export type StoryBlock =
    | { type: 'paragraph'; text: string; dropcap?: boolean; ending?: boolean; align?: 'left' | 'center' | 'right'; chapter?: number }
    | { type: 'heading'; text: string; chapter?: number }
    | { type: 'quote'; text: string; chapter?: number };
    
export const stories: Story[] = [
    {
        slug: 'the-last-letter-home',
        hidden: true,
        title: 'The Last Letter Home',
        author: 'Elena Marsh',
        genre: 'Literary Fiction',
        excerpt:
            'She folded the paper three times, the way her mother had taught her, and pressed it into the envelope like a secret she couldn\'t keep forever.',
        wordCount: 2400,
        readTime: '12 min read',
        publishedDate: '2026-08-01',
        content: [
            {
                type: 'paragraph',
                dropcap: true,
                text: 'She folded the paper three times, the way her mother had taught her, and pressed it into the envelope like a secret she couldn\'t keep forever. Outside, the rain had been falling for six days straight — the kind of rain that doesn\'t so much fall as insist, as if the sky had something to say and refused to be interrupted.',
            },
            {
                type: 'paragraph',
                text: 'The cottage smelled of woodsmoke and old books. Her father\'s study, unchanged since the funeral, still held his half-finished cup of tea on the desk, a ring of brown staining the oak like a small, stubborn planet. She had not moved it. Some things, she had learned, are not meant to be moved.',
            },
            {
                type: 'paragraph',
                text: '"You\'re writing to him again," her sister said from the doorway, arms crossed, voice soft with the particular exhaustion of someone who has given the same advice too many times to count.',
            },
            {
                type: 'paragraph',
                text: '"I\'m writing to myself," she replied, which was not quite true but was closer to the truth than anything else she could have said.',
            },
            { type: 'heading', text: 'I.' },
            {
                type: 'paragraph',
                text: 'The letter began the way all her letters began: with an apology for the silence. *I know it has been months. I know you asked me not to wait this long. I know.* But apologies, she had discovered, were a kind of currency that lost value the more you spent them, and she had been bankrupt for years.',
            },
            {
                type: 'paragraph',
                text: 'What she really wanted to say — what she had been circling around for six months like a dog around a sore paw — was simpler than any of the careful sentences she\'d composed in her head on the train, in the bath, in the three sleepless hours before dawn when the house was finally quiet enough to think:',
            },
            {
                type: 'quote',
                text: 'I am afraid I have become someone you would not recognize.',
            },
            {
                type: 'paragraph',
                text: 'The pen hovered. The rain insisted. Somewhere in the village below, a church bell counted out the hour in slow bronze syllables, and she let each one land before she wrote the next word.',
            },
            { type: 'heading', text: 'II.' },
            {
                type: 'paragraph',
                text: 'Her mother had been a writer of letters. Not stories, not novels — though she had the talent for both, everyone agreed, the kind of quiet luminous talent that makes other writers nervous — but letters. Letters to friends, to strangers, to newspapers, to the dead. She kept copies of every one, bound in leather journals that now lined the bottom shelf of the study, forty years of correspondence arranged not by date but by feeling: *Grief. Joy. The In-Between. Things I Should Not Have Said.*',
            },
            {
                type: 'paragraph',
                text: '"A letter," her mother had told her once, folding a fresh sheet with the precision of a surgeon, "is the only honest form of writing. Everything else — the novel, the poem, the essay — is performance. But a letter? A letter is just two people, one of them absent, trying to be true."',
            },
            {
                type: 'paragraph',
                text: 'She had been twelve. She had not understood. She understood now, in the way that understanding arrives not as a flash but as a slow tide, rising around your ankles while you\'re busy looking at the horizon.',
            },
            { type: 'heading', text: 'III.' },
            {
                type: 'paragraph',
                text: 'The letter, when she finished it, was four pages long. She did not reread it. Rereading was for people who still believed they could edit themselves into being better, and she had passed that stage sometime around the third month of silence, somewhere between the second apology and the first lie.',
            },
            {
                type: 'paragraph',
                text: 'She sealed the envelope. She wrote the address in her mother\'s handwriting — she had practiced until the loops and crossings were indistinguishable, a small forgery that felt less like deception and more like inheritance.',
            },
            {
                type: 'paragraph',
                text: 'Then she walked out into the rain, which had not stopped, which would not stop, which seemed now less like weather and more like a condition of the world she had agreed to live in.',
            },
            {
                type: 'paragraph',
                text: 'The postbox stood at the end of the lane, red as a wound against the grey. She held the letter for a long moment. Not because she was unsure. Because she was sure, finally, completely, in a way that frightened her more than the silence ever had.',
            },
            {
                type: 'paragraph',
                text: 'She let it go.',
            },
            {
                type: 'paragraph',
                ending: true,
                text: 'The rain kept falling. The bell kept counting. And somewhere, in a city she had not visited in years, a letter was beginning its slow journey toward a hand that would open it, or wouldn\'t, and either way — either way — she would be free.',
            },
        ],
    },
    {
        slug: 'saltwater',
        hidden: true,
        title: 'Saltwater',
        author: 'Elena Marsh',
        genre: 'Flash Fiction',
        excerpt:
            'The ocean doesn\'t remember your name. That\'s why he kept returning — to be forgotten, briefly, completely.',
        wordCount: 650,
        readTime: '3 min read',
        publishedDate: '2026-07-28',
        content: [
            {
                type: 'paragraph',
                dropcap: true,
                text: 'The ocean doesn\'t remember your name. That\'s why he kept returning — to be forgotten, briefly, completely.',
            },
            {
                type: 'paragraph',
                text: 'Every morning at six, before the town woke, he walked the half-mile of dune grass to the water\'s edge. He never swam. Swimming implied a kind of hope — that you would return to shore changed, improved, rinsed clean. He wasn\'t interested in improvement. He was interested in subtraction.',
            },
            {
                type: 'paragraph',
                text: 'He would stand knee-deep and let the cold climb his legs like a slow animal. The gulls watched him with the patient indifference of creatures who have seen every kind of human sadness and found none of it particularly original.',
            },
            {
                type: 'quote',
                text: 'What he wanted, he had finally admitted to no one, was not to be healed. He wanted to be worn down. Smoothed. Made small enough to fit inside a single wave.',
            },
            {
                type: 'paragraph',
                text: 'His wife had left in October. Or he had left her — the grammar of it shifted depending on the day. What remained constant was the silence in the house afterward, a silence so complete it had texture, like velvet pressed too long in one direction.',
            },
            {
                type: 'paragraph',
                text: 'The ocean offered no counsel. That was its gift. It did not tell him it would get better. It did not tell him he deserved happiness. It simply continued, indifferent and enormous, and in its indifference he found a strange permission: to be unfinished. To be a sentence without a period. To be, for one cold hour each morning, nobody at all.',
            },
            {
                type: 'paragraph',
                ending: true,
                text: 'He walked home as the town began to wake. Smoke from chimneys. A dog barking. The ordinary machinery of living, grinding on without him and somehow, because of that, including him too.',
            },
        ],
    },
    {
        slug: 'the-cartographers-daughter',
        hidden: true,
        title: "The Cartographer's Daughter",
        author: 'Elena Marsh',
        genre: 'Novella',
        excerpt:
            'Every map her father drew left something out. It took her thirty years to understand that the missing pieces were the only honest parts.',
        wordCount: 18200,
        readTime: '1 hr read',
        publishedDate: '2026-07-15',
        content: [
            {
                type: 'paragraph',
                dropcap: true,
                text: 'Every map her father drew left something out. It took her thirty years to understand that the missing pieces were the only honest parts.',
            },
            {
                type: 'paragraph',
                text: 'His workshop occupied the top floor of their narrow house in Lisbon — a room that smelled permanently of ink, linseed oil, and the particular dust that accumulates around important work. Maps covered every surface: pinned to walls, rolled in brass tubes, spread across the great oak table where he bent each morning over coastlines that did not yet exist.',
            },
            {
                type: 'paragraph',
                text: '*This is a preview.* The full novella continues for another eighteen thousand words — coming soon to Inkwell.',
            },
        ],
    },
        buildStory(
        {
            slug: 'poets-from-tomorrow',
            title: 'Poets From Tomorrow',
            author: 'Nzan Kikon',
            genre: 'Flash Fiction',
            excerpt: 'What if tomorrow makes today?',
            publishedDate: '2026-08-05',
            cover: '/covers/poets-from-tomorrow.jpg',
            genreTag: 'Drama/Play',
            hidden: true,
        },
        poetsFromTomorrowRaw
    ),
    {
        slug: 'the-weight-of-small-things',
        hidden: true,
        title: 'The Weight of Small Things',
        author: 'Elena Marsh',
        genre: 'Literary Fiction',
        excerpt:
            'She had been collecting ordinary objects for years, each one a small anchor against the drift of forgetting.',
        wordCount: 3100,
        readTime: '15 min read',
        publishedDate: '2026-08-02',
        content: [
            {
                type: 'paragraph',
                dropcap: true,
                text: 'She had been collecting ordinary objects for years, each one a small anchor against the drift of forgetting. A bus ticket from the day she met him. A dried flower pressed between the pages of a cookbook she never cooked from. The plastic lid of a coffee cup from an airport she would never pass through again.',
            },
            {
                type: 'paragraph',
                text: 'Her apartment was a museum of the unremarkable. Visitors called it cluttered. She called it honest. Every object had survived the great culling of memory — the way the mind quietly discards nine thousand days to keep three.',
            },
            {
                type: 'quote',
                text: 'Grief, she had learned, is not the absence of things. It is the unbearable presence of the small ones.',
            },
            {
                type: 'paragraph',
                ending: true,
                text: 'That evening she added a new piece to the collection: a single house key, brass gone soft with use, that opened a door behind which no one lived anymore. She placed it on the shelf beside the others and whispered, as she always did, the only prayer she still believed in: *Let me remember. Let me remember. Let me remember.*',
            },
        ],
    },
    {
        slug: 'how-to-disappear-in-three-easy-steps',
        hidden: true,
        title: 'How to Disappear in Three Easy Steps',
        author: 'Marcus Velez',
        genre: 'Speculative Fiction',
        excerpt:
            'The manual arrived on a Tuesday, printed on paper so thin you could read the weather through it.',
        wordCount: 1850,
        readTime: '9 min read',
        publishedDate: '2026-07-30',
        content: [
            {
                type: 'paragraph',
                dropcap: true,
                text: 'The manual arrived on a Tuesday, printed on paper so thin you could read the weather through it. Step One, it said, in a font that seemed embarrassed to be there at all: *Stop answering when your name is called.* Not rudely. Not dramatically. Just let the syllables fall past you like rain off a roof that is no longer yours.',
            },
            {
                type: 'paragraph',
                text: 'Step Two was harder. *Return everything borrowed, including the versions of yourself you lent out to other people.* The wife you performed for your mother. The ambition you wore for your father. The easy laugh you gave strangers so they would not look too closely.',
            },
            {
                type: 'heading',
                text: '✦',
            },
            {
                type: 'paragraph',
                text: 'Step Three took the longest, though the manual devoted only a single line to it: *Go somewhere the light does not know your shape.* He tried the coast first. Then the desert. Then a town so small it had no name on any map he could find, only a diner, a library, and a bench facing the mountains where he sat each morning and practiced being no one in particular.',
            },
            {
                type: 'paragraph',
                ending: true,
                text: 'It worked, mostly. The trouble with disappearing, he discovered too late, was not the leaving. It was that somewhere inside the quiet, a small stubborn voice kept asking — in his own handwriting, in his own tired cadence — whether the person he had become was finally someone worth staying for.',
            },
        ],
    },
];

// Compute read time from word count (200 wpm = calm literary pace)
function computeReadTime(wordCount: number): string {
    const minutes = Math.max(1, Math.round(wordCount / 200));
    if (minutes < 60) return `${minutes} min read`;
    const hours = Math.round(minutes / 60);
    return hours === 1 ? '1 hr read' : `${hours} hr read`;
}

// Ensure every story has a readTime (use manual if given, else compute)
function withReadTime(story: Story): Story {
    return { ...story, readTime: story.readTime ?? computeReadTime(story.wordCount) };
}

// Find a story by its slug (auto-computes read time)
export function getStoryBySlug(slug: string): Story | undefined {
    const found = stories.find((s) => s.slug === slug);
    return found ? withReadTime(found) : undefined;
}

// Get all slugs (used by Astro to generate static pages)
export function getAllStorySlugs(): string[] {
    return stories.map((s) => s.slug);
}

// Homepage only shows non-hidden stories (auto-computes read times)
export function getVisibleStories(): Story[] {
    return stories.filter((s) => !s.hidden).map(withReadTime);
}