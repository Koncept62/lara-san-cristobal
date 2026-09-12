import { getCollection, type CollectionEntry } from 'astro:content';

export type NoteLocale = 'en' | 'es';

export interface LocalizedNote {
  /** Base slug shared by both locale files, e.g. "why-i-love-living-here" */
  slug: string;
  /** The raw entry to render Content from — the requested locale's file if
   *  translated, otherwise the English entry (see `isFallback`). */
  entry: CollectionEntry<'notes'>;
  /** True when a Spanish version doesn't exist (or has no title) yet, and
   *  this note is showing its English copy on the /notes-es route instead. */
  isFallback: boolean;
  data: {
    title: string;
    blurb: string;
    pubDate: Date;
    featuredHomepage: boolean;
    featuredNotesHero: boolean;
    category: NonNullable<CollectionEntry<'notes'>['data']['category']>;
    coverImage: string;
  };
}

const baseSlug = (id: string) => id.replace(/\.(en|es)$/, '');

/**
 * Groups the raw <slug>.en.md / <slug>.es.md collection entries into one
 * localized note per slug. Non-translatable fields (pubDate, featured flags,
 * category, coverImage) always come from the "en" entry, since Decap's
 * i18n:false fields are only ever written to the default-locale file. When
 * `lang` is "es" but no translated (or title-less) Spanish file exists yet,
 * falls back to the English title/blurb/body so the page never renders blank.
 */
export async function getLocalizedNotes(lang: NoteLocale): Promise<LocalizedNote[]> {
  const all = await getCollection('notes');

  const groups = new Map<string, { en?: CollectionEntry<'notes'>; es?: CollectionEntry<'notes'> }>();
  for (const entry of all) {
    const slug = baseSlug(entry.id);
    const group = groups.get(slug) ?? {};
    if (entry.id.endsWith('.es')) group.es = entry;
    else group.en = entry;
    groups.set(slug, group);
  }

  const notes: LocalizedNote[] = [];
  for (const [slug, { en, es }] of groups) {
    if (!en) {
      console.warn(`[notes] "${slug}" has no default-locale (.en) file — skipping.`);
      continue;
    }
    const translated = lang === 'es' && !!es?.data.title;
    const useEntry = translated ? es! : en;
    notes.push({
      slug,
      entry: useEntry,
      isFallback: lang === 'es' && !translated,
      data: {
        title: useEntry.data.title ?? en.data.title ?? '',
        blurb: useEntry.data.blurb ?? en.data.blurb ?? '',
        pubDate: en.data.pubDate!,
        featuredHomepage: en.data.featuredHomepage,
        featuredNotesHero: en.data.featuredNotesHero,
        category: en.data.category!,
        coverImage: en.data.coverImage!,
      },
    });
  }

  return notes;
}
