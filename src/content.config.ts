import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const status = z.enum(['Available', 'Reserved', 'Sold']).default('Available');

const noteCategory = z.enum(['Buying in Mexico', 'Restoring', 'Off grid', 'The town', 'Interiors', 'From Lara']);

export const collections = {
  notes: defineCollection({
    // Decap i18n (structure_multiple_files) persists one file per locale:
    // <slug>.en.md / <slug>.es.md. Translatable fields (title, blurb, body)
    // live in both files; non-translatable fields (pubDate, featured flags,
    // category, coverImage) are i18n:false in config.yml, so Decap only ever
    // writes them into the default-locale (.en) file — they're optional here
    // because the .es entry won't have them. Use getLocalizedNotes() in
    // src/lib/notes.ts to read a note, which merges the pair correctly and
    // falls back to English copy when a Spanish file doesn't exist yet.
    // Custom generateId: the default id generator slugifies the filename
    // (via github-slugger), which strips the "." before the locale suffix —
    // "why-i-love-living-here.en.md" becomes id "why-i-love-living-hereen",
    // merging the locale into the slug with no separator. Preserve the raw
    // filename (minus extension) instead so "<slug>.en" / "<slug>.es" stay
    // splittable in src/lib/notes.ts.
    loader: glob({
      pattern: '**/*.md',
      base: './src/content/notes',
      generateId: ({ entry }) => entry.replace(/\.md$/, ''),
    }),
    schema: z.object({
      title: z.string().optional(),
      blurb: z.string().optional(),
      pubDate: z.coerce.date().optional(),
      // Two independent editorial flags, both toggled in Decap. Not tied to
      // recency; each falls back to the most recent note when nothing is set.
      //   featuredHomepage  → the "Notes from the office" strip on the homepage
      //   featuredNotesHero → the hero band above the grid on /notes and /notes-es
      featuredHomepage: z.boolean().default(false),
      featuredNotesHero: z.boolean().default(false),
      category: noteCategory.optional(),
      coverImage: z.string().optional(),
    }),
  }),

  land: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/land' }),
    schema: z.object({
      propertyName: z.string(),
      location: z.string(),
      inBrief: z.string(),
      landSize: z.string(),
      description: z.string(),
      priceMxn: z.string().optional(),
      priceUsd: z.string().optional(),
      referenceCode: z.string().optional(),
      status,
      mainImage: z.string(),
      gallery: z.array(z.string()).default([]),
    }),
  }),

  'property-for-sale': defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/property-for-sale' }),
    schema: z.object({
      propertyName: z.string(),
      location: z.string(),
      inBrief: z.string(),
      propertySize: z.string(),
      plotSize: z.string(),
      bedrooms: z.number(),
      bathrooms: z.number(),
      description: z.string(),
      priceMxn: z.string().optional(),
      priceUsd: z.string().optional(),
      referenceCode: z.string().optional(),
      status,
      mainImage: z.string(),
      gallery: z.array(z.string()).default([]),
      floorPlan: z.string().optional(),
      // Homepage property grid, toggled in Decap. Flagged entries lead the grid;
      // any remaining slots fill with the most recently added listings. dateAdded
      // is set when an entry is created and drives that recency sort.
      featuredHomepage: z.boolean().default(false),
      dateAdded: z.coerce.date().optional(),
    }),
  }),

  'property-for-rent': defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/property-for-rent' }),
    schema: z.object({
      propertyName: z.string(),
      location: z.string(),
      inBrief: z.string(),
      propertySize: z.string(),
      plotSize: z.string().optional(),
      bedrooms: z.number(),
      bathrooms: z.number(),
      description: z.string(),
      priceMxn: z.string().optional(),
      priceUsd: z.string().optional(),
      referenceCode: z.string().optional(),
      status,
      mainImage: z.string(),
      gallery: z.array(z.string()).default([]),
      floorPlan: z.string().optional(),
    }),
  }),
};
