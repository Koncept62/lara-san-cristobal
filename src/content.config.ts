import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const status = z.enum(['Available', 'Reserved', 'Sold']).default('Available');

const noteCategory = z.enum(['Buying in Mexico', 'Restoring', 'Off grid', 'The town', 'Interiors', 'From Lara']);

export const collections = {
  notes: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
    schema: z.object({
      title: z.string(),
      pubDate: z.string(),
      category: noteCategory,
      blurb: z.string(),
      coverImage: z.string(),
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
