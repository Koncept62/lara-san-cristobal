import { getCollection, type CollectionEntry } from 'astro:content';

export type Locale = 'en' | 'es';

const baseSlug = (id: string) => id.replace(/\.(en|es)$/, '');

/**
 * Groups the raw <slug>.en.md / <slug>.es.md collection entries into one
 * map per base slug, keyed by locale. Shared by the three listing helpers
 * below — see getLocalizedNotes() in src/lib/notes.ts for the original
 * pattern this mirrors.
 */
async function groupByLocale<C extends 'property-for-sale' | 'property-for-rent' | 'land'>(collection: C) {
  const all = await getCollection(collection);
  const groups = new Map<string, { en?: CollectionEntry<C>; es?: CollectionEntry<C> }>();
  for (const entry of all) {
    const slug = baseSlug(entry.id);
    const group = groups.get(slug) ?? {};
    if (entry.id.endsWith('.es')) group.es = entry;
    else group.en = entry;
    groups.set(slug, group);
  }
  return groups;
}

export interface LocalizedPropertyForSale {
  slug: string;
  entry: CollectionEntry<'property-for-sale'>;
  isFallback: boolean;
  data: {
    propertyName: string;
    location: string;
    inBrief: string;
    propertySize: string;
    plotSize: string;
    bedrooms: number;
    bathrooms: number;
    description: string;
    priceMxn?: string;
    priceUsd?: string;
    referenceCode?: string;
    status: NonNullable<CollectionEntry<'property-for-sale'>['data']['status']>;
    mainImage: string;
    gallery: string[];
    floorPlan?: string;
    featuredHomepage: boolean;
    dateAdded?: Date;
  };
}

export async function getLocalizedPropertyForSale(lang: Locale): Promise<LocalizedPropertyForSale[]> {
  const groups = await groupByLocale('property-for-sale');

  const listings: LocalizedPropertyForSale[] = [];
  for (const [slug, { en, es }] of groups) {
    if (!en) {
      console.warn(`[property-for-sale] "${slug}" has no default-locale (.en) file — skipping.`);
      continue;
    }
    const translated = lang === 'es' && !!es?.data.propertyName;
    const useEntry = translated ? es! : en;
    listings.push({
      slug,
      entry: useEntry,
      isFallback: lang === 'es' && !translated,
      data: {
        propertyName: useEntry.data.propertyName ?? en.data.propertyName ?? '',
        location: en.data.location!,
        inBrief: useEntry.data.inBrief ?? en.data.inBrief ?? '',
        propertySize: en.data.propertySize!,
        plotSize: en.data.plotSize!,
        bedrooms: en.data.bedrooms!,
        bathrooms: en.data.bathrooms!,
        description: useEntry.data.description ?? en.data.description ?? '',
        priceMxn: en.data.priceMxn,
        priceUsd: en.data.priceUsd,
        referenceCode: en.data.referenceCode,
        status: en.data.status!,
        mainImage: en.data.mainImage!,
        gallery: en.data.gallery,
        floorPlan: en.data.floorPlan,
        featuredHomepage: en.data.featuredHomepage,
        dateAdded: en.data.dateAdded,
      },
    });
  }
  return listings;
}

export interface LocalizedPropertyForRent {
  slug: string;
  entry: CollectionEntry<'property-for-rent'>;
  isFallback: boolean;
  data: {
    propertyName: string;
    location: string;
    inBrief: string;
    propertySize: string;
    plotSize?: string;
    bedrooms: number;
    bathrooms: number;
    description: string;
    priceMxn?: string;
    priceUsd?: string;
    referenceCode?: string;
    status: NonNullable<CollectionEntry<'property-for-rent'>['data']['status']>;
    mainImage: string;
    gallery: string[];
    floorPlan?: string;
  };
}

export async function getLocalizedPropertyForRent(lang: Locale): Promise<LocalizedPropertyForRent[]> {
  const groups = await groupByLocale('property-for-rent');

  const listings: LocalizedPropertyForRent[] = [];
  for (const [slug, { en, es }] of groups) {
    if (!en) {
      console.warn(`[property-for-rent] "${slug}" has no default-locale (.en) file — skipping.`);
      continue;
    }
    const translated = lang === 'es' && !!es?.data.propertyName;
    const useEntry = translated ? es! : en;
    listings.push({
      slug,
      entry: useEntry,
      isFallback: lang === 'es' && !translated,
      data: {
        propertyName: useEntry.data.propertyName ?? en.data.propertyName ?? '',
        location: en.data.location!,
        inBrief: useEntry.data.inBrief ?? en.data.inBrief ?? '',
        propertySize: en.data.propertySize!,
        plotSize: en.data.plotSize,
        bedrooms: en.data.bedrooms!,
        bathrooms: en.data.bathrooms!,
        description: useEntry.data.description ?? en.data.description ?? '',
        priceMxn: en.data.priceMxn,
        priceUsd: en.data.priceUsd,
        referenceCode: en.data.referenceCode,
        status: en.data.status!,
        mainImage: en.data.mainImage!,
        gallery: en.data.gallery,
        floorPlan: en.data.floorPlan,
      },
    });
  }
  return listings;
}

export interface LocalizedLand {
  slug: string;
  entry: CollectionEntry<'land'>;
  isFallback: boolean;
  data: {
    propertyName: string;
    location: string;
    inBrief: string;
    landSize: string;
    description: string;
    priceMxn?: string;
    priceUsd?: string;
    referenceCode?: string;
    status: NonNullable<CollectionEntry<'land'>['data']['status']>;
    mainImage: string;
    gallery: string[];
  };
}

export async function getLocalizedLand(lang: Locale): Promise<LocalizedLand[]> {
  const groups = await groupByLocale('land');

  const listings: LocalizedLand[] = [];
  for (const [slug, { en, es }] of groups) {
    if (!en) {
      console.warn(`[land] "${slug}" has no default-locale (.en) file — skipping.`);
      continue;
    }
    const translated = lang === 'es' && !!es?.data.propertyName;
    const useEntry = translated ? es! : en;
    listings.push({
      slug,
      entry: useEntry,
      isFallback: lang === 'es' && !translated,
      data: {
        propertyName: useEntry.data.propertyName ?? en.data.propertyName ?? '',
        location: en.data.location!,
        inBrief: useEntry.data.inBrief ?? en.data.inBrief ?? '',
        landSize: en.data.landSize!,
        description: useEntry.data.description ?? en.data.description ?? '',
        priceMxn: en.data.priceMxn,
        priceUsd: en.data.priceUsd,
        referenceCode: en.data.referenceCode,
        status: en.data.status!,
        mainImage: en.data.mainImage!,
        gallery: en.data.gallery,
      },
    });
  }
  return listings;
}
