import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const toSlug = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Returns a stable picsum.photos URL seeded by a string.
 * Same seed always returns the same image â€” deterministic for dev data.
 * w/h = image dimensions.
 */
const img = (seed, w = 800, h = 800) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

/**
 * Builds an array of ProductPhoto objects for a product.
 * seeds: array of seed strings (one per photo). Position is index.
 */
const productPhotos = (seeds) =>
  seeds.map((seed, i) => ({
    url: img(seed),
    publicId: `seed/${seed.replace(/\s+/g, '-')}`,
    position: i,
  }));

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Seed data
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CATEGORIES_DATA = [
  { name: 'Textiles',        slug: 'textiles',        description: 'Silk, cotton, handloom fabrics and woven goods',             sortOrder: 1 },
  { name: 'Home Decor',      slug: 'home-decor',      description: 'Pottery, brass, wood and home furnishing accents',            sortOrder: 2 },
  { name: 'Jewellery',       slug: 'jewellery',       description: 'Silver, gold, gemstone and artisan jewellery',                sortOrder: 3 },
  { name: 'Accessories',     slug: 'accessories',     description: 'Bags, scarves, wallets and fashion accessories',              sortOrder: 4 },
  { name: 'Apparel',         slug: 'apparel',         description: 'Kurtas, dupattas, sarees and readymade garments',             sortOrder: 5 },
  { name: 'Stationery',      slug: 'stationery',      description: 'Handmade journals, greeting cards and paper goods',           sortOrder: 6 },
  { name: 'Art & Craft',     slug: 'art-craft',       description: 'Paintings, prints, folk art and handcrafted gifts',           sortOrder: 7 },
  { name: 'Food & Wellness', slug: 'food-wellness',   description: 'Artisan spices, teas, herbal remedies and wellness products', sortOrder: 8 },
];

// â”€â”€â”€ Brand definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BRANDS = [
  {
    email: 'varanasi.silk@example.com',
    password: 'Brand@12345',
    brandName: 'Varanasi Silk House',
    slug: 'varanasi-silk-house',
    category: ['Textiles'],
    countryOfOrigin: 'IN',
    gstNumber: '09AABCU9603R1ZM',
    instagramHandle: 'varanasisilkhouse',
    yearFounded: 2008,
    logoUrl: img('varanasi-silk-logo', 200, 200),
    bannerUrl: img('varanasi-silk-banner', 1200, 400),
    brandStory: 'Three generations of master weavers from Varanasi, creating authentic Banarasi silk textiles for international boutiques. Each piece is handwoven on traditional pit looms using pure mulberry silk and real zari.',
    description: 'Wholesale supplier of authentic Banarasi silk â€” sarees, dupattas, stoles, and fabric by the metre.',
    products: [
      {
        name: 'Handwoven Banarasi Silk Saree',
        photos: productPhotos(['banarasi-saree-1', 'banarasi-saree-2', 'banarasi-saree-detail']),
        shortDescription: 'Pure mulberry silk saree with real zari brocade, handwoven on traditional pit loom.',
        fullDescription: 'Each saree takes 15â€“20 days to weave and uses 600â€“800 threads per inch. The zari is real gold-coated silver wire. Perfect for bridal boutiques and luxury fashion retailers.',
        wholesalePriceInr: 4200,

        moq: 3,
        leadTime: 'TWO_TO_FOUR_WEEKS',
        weightGrams: 600,
        hsTariffCode: '5007.90',
        categories: ['Textiles'],
        tags: ['silk', 'banarasi', 'saree', 'zari', 'bridal'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        variants: [], // No variants â€” one style per listing
      },
      {
        name: 'Silk Dupatta with Meenakari Border',
        photos: productPhotos(['silk-dupatta-1', 'silk-dupatta-colors', 'meenakari-detail']),
        shortDescription: 'Lightweight pure silk dupatta with hand-painted meenakari border, 2.5 metres.',
        wholesalePriceInr: 1100,

        moq: 5,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 120,
        categories: ['Textiles'],
        tags: ['silk', 'dupatta', 'meenakari', 'scarf'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        variants: [
          { sku: 'VSD-MAR', priceInr: 1100, stock: 30, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Maroon' }] },
          { sku: 'VSD-GLD', priceInr: 1200, stock: 25, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Gold' }] },
          { sku: 'VSD-NVY', priceInr: 1100, stock: 20, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Navy Blue' }] },
          { sku: 'VSD-IVR', priceInr: 1150, stock: 18, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Ivory' }] },
        ],
      },
      {
        name: 'Brocade Table Runner',
        photos: productPhotos(['brocade-runner-1', 'brocade-runner-styled', 'brocade-pattern']),
        shortDescription: 'Silk brocade table runner with floral jali pattern, available in two sizes.',
        wholesalePriceInr: 680,

        moq: 10,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 180,
        categories: ['Textiles', 'Home Decor'],
        tags: ['brocade', 'table-runner', 'home-decor', 'silk'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        variants: [
          { sku: 'BTR-RED-S', priceInr: 620, stock: 40, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Red' },   { name: 'Size', value: '30×120 cm' }] },
          { sku: 'BTR-RED-L', priceInr: 750, stock: 35, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Red' },   { name: 'Size', value: '30×180 cm' }] },
          { sku: 'BTR-GRN-S', priceInr: 620, stock: 30, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Green' }, { name: 'Size', value: '30×120 cm' }] },
          { sku: 'BTR-GRN-L', priceInr: 750, stock: 28, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Green' }, { name: 'Size', value: '30×180 cm' }] },
        ],
      },
      {
        name: 'Handloom Cotton Khadi Fabric',
        photos: productPhotos(['khadi-fabric-1', 'khadi-fabric-texture', 'khadi-weaving']),
        shortDescription: 'Natural handspun khadi cotton, 44 inches wide, sold per metre.',
        wholesalePriceInr: 280,

        moq: 20,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 200,
        categories: ['Textiles'],
        tags: ['khadi', 'cotton', 'handloom', 'fabric', 'natural'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTHEAST_ASIA'],
        variants: [],
      },
      {
        name: 'Silk Stole with Block Print',
        photos: productPhotos(['silk-stole-1', 'silk-stole-draped', 'block-print-detail']),
        shortDescription: 'Pure silk stole with traditional Bagh block print, 200Ã—75 cm.',
        wholesalePriceInr: 850,

        moq: 5,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 100,
        categories: ['Textiles', 'Accessories'],
        tags: ['silk', 'stole', 'block-print', 'bagh'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        variants: [],
      },
    ],
  },

  {
    email: 'jaipur.pottery@example.com',
    password: 'Brand@12345',
    brandName: 'Jaipur Blue Pottery Studio',
    slug: 'jaipur-blue-pottery-studio',
    category: ['Home Decor'],
    countryOfOrigin: 'IN',
    gstNumber: '08AAEPM2603R1ZD',
    instagramHandle: 'jaipurbluepottery',
    yearFounded: 2014,
    logoUrl: img('jaipur-pottery-logo', 200, 200),
    bannerUrl: img('jaipur-pottery-banner', 1200, 400),
    brandStory: 'Family-run studio in the heart of Jaipur\'s old city. We make traditional Blue Pottery using the ancient Persian-influenced technique brought to Rajasthan 500 years ago. No clay is used â€” our pieces are made from quartz stone powder, glass, multani mitti and gum.',
    description: 'Wholesale Blue Pottery direct from Jaipur â€” vases, bowls, tiles, mugs, and decorative pieces.',
    products: [
      {
        name: 'Blue Pottery Decorative Vase',
        photos: productPhotos(['blue-pottery-vase-1', 'blue-pottery-vase-sizes', 'blue-pottery-detail']),
        shortDescription: 'Hand-painted blue pottery vase with traditional floral motifs, food-safe glaze.',
        wholesalePriceInr: 520,

        moq: 6,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 400,
        hsTariffCode: '6912.00',
        categories: ['Home Decor'],
        tags: ['blue-pottery', 'vase', 'jaipur', 'handpainted'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        variants: [
          { sku: 'BPV-SM', priceInr: 420, stock: 25, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Small (15 cm)' }] },
          { sku: 'BPV-MD', priceInr: 520, stock: 20, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Medium (22 cm)' }] },
          { sku: 'BPV-LG', priceInr: 750, stock: 15, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Large (30 cm)' }] },
        ],
      },
      {
        name: 'Blue Pottery Serving Bowl Set',
        photos: productPhotos(['blue-pottery-bowls-1', 'blue-pottery-bowls-nested', 'peacock-motif-detail']),
        shortDescription: 'Set of 3 nesting blue pottery bowls with peacock motif, microwave safe.',
        wholesalePriceInr: 1100,

        moq: 4,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 900,
        categories: ['Home Decor'],
        tags: ['blue-pottery', 'bowl', 'serving', 'set', 'jaipur'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        variants: [],
      },
      {
        name: 'Block Print Cushion Cover',
        photos: productPhotos(['cushion-cover-1', 'cushion-cover-colors', 'block-print-cushion-styled']),
        shortDescription: 'Hand block-printed cotton cushion cover, 45Ã—45 cm, with zip closure.',
        wholesalePriceInr: 280,

        moq: 10,
        leadTime: 'ONE_TO_THREE_DAYS',
        weightGrams: 150,
        categories: ['Home Decor', 'Textiles'],
        tags: ['block-print', 'cushion', 'rajasthan', 'cotton'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTHEAST_ASIA'],
        variants: [
          { sku: 'BPC-RED', priceInr: 280, stock: 60, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Red Floral' }] },
          { sku: 'BPC-BLU', priceInr: 280, stock: 55, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Indigo' }] },
          { sku: 'BPC-GRN', priceInr: 280, stock: 45, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Forest Green' }] },
          { sku: 'BPC-OCI', priceInr: 280, stock: 40, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Ochre Yellow' }] },
        ],
      },
      {
        name: 'Marble Inlay Coaster Set',
        photos: productPhotos(['marble-coaster-1', 'marble-coaster-set', 'pietra-dura-detail']),
        shortDescription: 'Set of 4 round marble coasters with pietra dura floral inlay, 10 cm diameter.',
        wholesalePriceInr: 880,

        moq: 4,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 600,
        hsTariffCode: '6802.21',
        categories: ['Home Decor'],
        tags: ['marble', 'coaster', 'pietra-dura', 'inlay', 'rajasthan'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        variants: [],
      },
      {
        name: 'Handpainted Ceramic Mug',
        photos: productPhotos(['ceramic-mug-1', 'ceramic-mug-group', 'mug-pattern-closeup']),
        shortDescription: 'Ceramic mug with hand-painted blue pottery floral design, 350 ml, dishwasher safe.',
        wholesalePriceInr: 360,

        moq: 6,
        leadTime: 'ONE_TO_THREE_DAYS',
        weightGrams: 280,
        categories: ['Home Decor'],
        tags: ['mug', 'ceramic', 'blue-pottery', 'handpainted', 'jaipur'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        variants: [],
      },
    ],
  },

  {
    email: 'kashmir.crafts@example.com',
    password: 'Brand@12345',
    brandName: 'Kashmir Artisan Collective',
    slug: 'kashmir-artisan-collective',
    category: ['Accessories', 'Textiles'],
    countryOfOrigin: 'IN',
    gstNumber: '01AAACK8403R1ZF',
    instagramHandle: 'kashmirartisans',
    yearFounded: 1998,
    logoUrl: img('kashmir-artisan-logo', 200, 200),
    bannerUrl: img('kashmir-artisan-banner', 1200, 400),
    brandStory: 'A cooperative of 120+ artisan families from the Kashmir Valley. We specialise in pure Pashmina, hand-embroidered shawls, and Kashmiri papier mache. All our Pashmina is GI-certified and comes with a certificate of authenticity.',
    description: 'GI-certified pure Pashmina, Kashmiri embroidery, and traditional handicrafts wholesale.',
    products: [
      {
        name: 'GI-Certified Pure Pashmina Shawl',
        photos: productPhotos(['pashmina-shawl-1', 'pashmina-shawl-draped', 'pashmina-texture', 'pashmina-colors']),
        shortDescription: 'Authentic GI-tagged Pashmina shawl, hand-woven in Kashmir, 200Ã—70 cm, 12 micron fineness.',
        fullDescription: 'This shawl is made from genuine Grade-A Pashmina wool sourced from Changthangi goats in Ladakh. Each shawl takes 72 hours to weave and comes with a GI certification card. The fineness is verified at 12â€“15 microns.',
        wholesalePriceInr: 3800,

        moq: 2,
        leadTime: 'TWO_TO_FOUR_WEEKS',
        weightGrams: 180,
        hsTariffCode: '6117.10',
        categories: ['Accessories', 'Textiles'],
        tags: ['pashmina', 'kashmir', 'shawl', 'gi-certified', 'luxury'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        variants: [
          { sku: 'PAS-CRM-SM', priceInr: 3600, stock: 12, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Cream' }, { name: 'Size', value: '90×200 cm' }] },
          { sku: 'PAS-CRM-LG', priceInr: 3800, stock: 10, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Cream' }, { name: 'Size', value: '100×220 cm' }] },
          { sku: 'PAS-GRY-SM', priceInr: 3600, stock: 10, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Grey' },  { name: 'Size', value: '90×200 cm' }] },
          { sku: 'PAS-GRY-LG', priceInr: 3800, stock: 8,  status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Grey' },  { name: 'Size', value: '100×220 cm' }] },
        ],
      },
      {
        name: 'Sozni Embroidered Evening Bag',
        photos: productPhotos(['sozni-bag-1', 'sozni-bag-open', 'sozni-embroidery-closeup']),
        shortDescription: 'Kashmiri Sozni needlework evening bag on silk, fully hand-embroidered, 25Ã—15 cm.',
        wholesalePriceInr: 1650,

        moq: 3,
        leadTime: 'TWO_TO_FOUR_WEEKS',
        weightGrams: 200,
        categories: ['Accessories'],
        tags: ['sozni', 'embroidery', 'bag', 'kashmir', 'silk'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        variants: [
          { sku: 'SEB-BLK', priceInr: 1650, stock: 20, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Black' }] },
          { sku: 'SEB-BRN', priceInr: 1650, stock: 18, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Chestnut Brown' }] },
          { sku: 'SEB-NVY', priceInr: 1700, stock: 15, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Midnight Navy' }] },
        ],
      },
      {
        name: 'Wool Sozni Stole',
        photos: productPhotos(['wool-stole-1', 'wool-stole-styled', 'sozni-border-detail']),
        shortDescription: 'Merino wool stole with Sozni hand embroidery border, 200Ã—75 cm.',
        wholesalePriceInr: 2200,

        moq: 2,
        leadTime: 'TWO_TO_FOUR_WEEKS',
        weightGrams: 220,
        categories: ['Accessories', 'Textiles'],
        tags: ['wool', 'sozni', 'stole', 'embroidery', 'kashmir'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        variants: [],
      },
      {
        name: 'Papier Mache Jewellery Box',
        photos: productPhotos(['papier-mache-box-1', 'papier-mache-box-open', 'papier-mache-painting']),
        shortDescription: 'Hand-painted Kashmiri papier mache jewellery box with floral Chinar leaf motif, 3 compartments.',
        wholesalePriceInr: 580,

        moq: 6,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 250,
        hsTariffCode: '4813.99',
        categories: ['Accessories', 'Art & Craft'],
        tags: ['papier-mache', 'jewellery-box', 'kashmir', 'chinar', 'gift'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        variants: [],
      },
      {
        name: 'Kani Weave Wool Shawl',
        photos: productPhotos(['kani-shawl-1', 'kani-shawl-pattern', 'kani-loom-weaving']),
        shortDescription: 'Traditional Kani loom-woven wool shawl with geometric motifs, 200Ã—80 cm.',
        wholesalePriceInr: 4500,

        moq: 2,
        leadTime: 'TWO_TO_FOUR_WEEKS',
        weightGrams: 350,
        categories: ['Accessories', 'Textiles'],
        tags: ['kani', 'weave', 'shawl', 'kashmir', 'wool', 'luxury'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        variants: [],
      },
    ],
  },

  {
    email: 'rajasthan.heritage@example.com',
    password: 'Brand@12345',
    brandName: 'Rajasthan Heritage Crafts',
    slug: 'rajasthan-heritage-crafts',
    category: ['Art & Craft', 'Home Decor'],
    countryOfOrigin: 'IN',
    gstNumber: '08AAFCR5603R1ZK',
    instagramHandle: 'rajasthanheritage',
    yearFounded: 2011,
    logoUrl: img('rajasthan-heritage-logo', 200, 200),
    bannerUrl: img('rajasthan-heritage-banner', 1200, 400),
    brandStory: 'Based in Jodhpur\'s blue city, we work with third-generation potters, miniature painters, and woodcarvers. We revive dying craft traditions by connecting master artisans with global markets.',
    description: 'Terracotta, folk art, miniature paintings, and carved wood â€” authentic Rajasthani crafts wholesale.',
    products: [
      {
        name: 'Hand-Painted Terracotta Planter',
        photos: productPhotos(['terracotta-planter-1', 'terracotta-planter-sizes', 'terracotta-motif-detail']),
        shortDescription: 'Handmade terracotta planter with traditional Rajasthani floral motifs, drainage hole included.',
        wholesalePriceInr: 320,

        moq: 6,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 500,
        hsTariffCode: '6913.10',
        categories: ['Home Decor', 'Art & Craft'],
        tags: ['terracotta', 'planter', 'rajasthan', 'handpainted', 'garden'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        variants: [
          { sku: 'TPC-SM', priceInr: 220, stock: 50, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Small (10 cm)' }] },
          { sku: 'TPC-MD', priceInr: 320, stock: 40, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Medium (18 cm)' }] },
          { sku: 'TPC-LG', priceInr: 480, stock: 30, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Large (25 cm)' }] },
        ],
      },
      {
        name: 'Rajasthani Miniature Painting',
        photos: productPhotos(['miniature-painting-1', 'miniature-painting-detail', 'miniature-painting-framed']),
        shortDescription: 'Original miniature painting on marble, Rajput royal court scene, hand-painted by certified master artists.',
        wholesalePriceInr: 2800,

        moq: 2,
        leadTime: 'TWO_TO_FOUR_WEEKS',
        weightGrams: 300,
        hsTariffCode: '9701.10',
        categories: ['Art & Craft'],
        tags: ['miniature', 'painting', 'marble', 'rajput', 'original-art'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        variants: [],
      },
      {
        name: 'Carved Wooden Jharokha Frame',
        photos: productPhotos(['jharokha-frame-1', 'jharokha-frame-installed', 'jharokha-carving-detail']),
        shortDescription: 'Hand-carved sheesham wood jharokha (balcony) mirror frame, 45Ã—60 cm.',
        wholesalePriceInr: 1800,

        moq: 2,
        leadTime: 'TWO_TO_FOUR_WEEKS',
        weightGrams: 1200,
        hsTariffCode: '4414.00',
        categories: ['Home Decor', 'Art & Craft'],
        tags: ['jharokha', 'carved', 'wood', 'mirror', 'rajasthan', 'sheesham'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        variants: [],
      },
      {
        name: 'Meenakari Brass Elephant Figurine',
        photos: productPhotos(['meenakari-elephant-1', 'meenakari-elephant-group', 'meenakari-enamel-detail']),
        shortDescription: 'Brass elephant with meenakari enamel work, hand-finished, 12 cm height.',
        wholesalePriceInr: 680,

        moq: 4,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 350,
        hsTariffCode: '8306.29',
        categories: ['Art & Craft', 'Home Decor'],
        tags: ['meenakari', 'brass', 'elephant', 'figurine', 'jaipur', 'gift'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        variants: [],
      },
      {
        name: 'Hand-Carved Wooden Camel',
        photos: productPhotos(['wooden-camel-1', 'wooden-camel-sizes', 'wooden-camel-painted']),
        shortDescription: 'Decorative wooden camel carved from sheesham wood, painted with traditional Rajasthani motifs.',
        wholesalePriceInr: 440,

        moq: 6,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: 280,
        categories: ['Art & Craft'],
        tags: ['camel', 'wooden', 'carved', 'rajasthan', 'souvenir', 'gift'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST', 'SOUTH_ASIA'],
        variants: [
          { sku: 'WCC-SM', priceInr: 320, stock: 35, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Small (12 cm)' }] },
          { sku: 'WCC-MD', priceInr: 440, stock: 25, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Medium (20 cm)' }] },
        ],
      },
    ],
  },

  {
    email: 'kerala.spice@example.com',
    password: 'Brand@12345',
    brandName: 'Kerala Spice Gardens',
    slug: 'kerala-spice-gardens',
    category: ['Food & Wellness'],
    countryOfOrigin: 'IN',
    gstNumber: '32AABCK7203R1ZX',
    instagramHandle: 'keralaspicegardens',
    yearFounded: 2017,
    logoUrl: img('kerala-spice-logo', 200, 200),
    bannerUrl: img('kerala-spice-banner', 1200, 400),
    brandStory: 'Family-owned spice estate in Munnar, Kerala. We grow, harvest, and pack our spices with zero additives. FSSAI certified, APEDA registered for export, and certified organic by IMO. Our cardamom won the Kerala Spices Board award two years running.',
    description: 'Award-winning organic Kerala spices, cold-pressed coconut oil, and Ayurvedic wellness products.',
    products: [
      {
        name: 'Organic Malabar Black Pepper',
        photos: productPhotos(['black-pepper-1', 'black-pepper-sizes', 'pepper-estate-kerala']),
        shortDescription: 'Bold, aromatic Malabar black pepper, single-estate, sun-dried, FSSAI certified organic.',
        fullDescription: 'Sourced from Wayanad hills at 3,000+ feet altitude. Our pepper scores 7.5% piperine content â€” significantly higher than commercial varieties. Ideal for premium grocery and specialty food retailers.',
        wholesalePriceInr: 480,

        moq: 10,
        leadTime: 'ONE_TO_THREE_DAYS',
        weightGrams: 250,
        hsTariffCode: '0904.11',
        categories: ['Food & Wellness'],
        tags: ['black-pepper', 'malabar', 'organic', 'kerala', 'spice'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        variants: [
          { sku: 'OBP-100', priceInr: 220, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '100g' }] },
          { sku: 'OBP-250', priceInr: 480, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '250g' }] },
          { sku: 'OBP-500', priceInr: 880, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '500g' }] },
        ],
      },
      {
        name: 'Cold-Pressed Virgin Coconut Oil',
        photos: productPhotos(['coconut-oil-1', 'coconut-oil-bottles', 'coconut-farm-kerala']),
        shortDescription: 'Single-pass cold-pressed virgin coconut oil from fresh coconuts, no heat or chemicals.',
        wholesalePriceInr: 340,

        moq: 12,
        leadTime: 'ONE_TO_THREE_DAYS',
        weightGrams: 500,
        hsTariffCode: '1513.11',
        categories: ['Food & Wellness'],
        tags: ['coconut-oil', 'cold-pressed', 'virgin', 'kerala', 'organic'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        variants: [
          { sku: 'VCO-250', priceInr: 200, stock: 180, status: 'ACTIVE', attrs: [{ name: 'Size', value: '250 ml' }] },
          { sku: 'VCO-500', priceInr: 340, stock: 140, status: 'ACTIVE', attrs: [{ name: 'Size', value: '500 ml' }] },
          { sku: 'VCO-1LT', priceInr: 600, stock: 90,  status: 'ACTIVE', attrs: [{ name: 'Size', value: '1 Litre' }] },
        ],
      },
      {
        name: 'Ayurvedic Tulsi Green Tea',
        photos: productPhotos(['tulsi-tea-1', 'tulsi-tea-pyramid-bags', 'tulsi-plant-kerala']),
        shortDescription: 'Organic Assam green tea blended with fresh Malabar Tulsi and lemongrass, 25 pyramid bags.',
        wholesalePriceInr: 360,

        moq: 10,
        leadTime: 'ONE_TO_THREE_DAYS',
        weightGrams: 60,
        hsTariffCode: '0902.20',
        categories: ['Food & Wellness'],
        tags: ['tea', 'tulsi', 'green-tea', 'ayurvedic', 'wellness', 'herbal'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        variants: [],
      },
      {
        name: 'Green Cardamom Pods',
        photos: productPhotos(['cardamom-pods-1', 'cardamom-pods-closeup', 'cardamom-estate']),
        shortDescription: 'Large bold Idukki cardamom pods, premium grade 8mm+, hand-harvested from high-altitude estates.',
        wholesalePriceInr: 820,

        moq: 8,
        leadTime: 'ONE_TO_THREE_DAYS',
        weightGrams: 100,
        hsTariffCode: '0908.31',
        categories: ['Food & Wellness'],
        tags: ['cardamom', 'idukki', 'spice', 'kerala', 'premium'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        variants: [],
      },
      {
        name: 'Wild Turmeric & Raw Honey Blend',
        photos: productPhotos(['turmeric-honey-1', 'turmeric-honey-jar', 'lakadong-turmeric']),
        shortDescription: 'Lakadong wild turmeric (9.5% curcumin) blended with cold-extracted raw forest honey, 200g jar.',
        wholesalePriceInr: 520,

        moq: 6,
        leadTime: 'ONE_TO_THREE_DAYS',
        weightGrams: 280,
        categories: ['Food & Wellness'],
        tags: ['turmeric', 'honey', 'lakadong', 'curcumin', 'wellness', 'ayurvedic'],
        enabledZones: ['EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        variants: [],
      },
    ],
  },
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main seed function
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function main() {
  console.log('\nðŸŒ± Starting seed...\n');

  // â”€â”€ 1. Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('Seeding categories...');
  for (const cat of CATEGORIES_DATA) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`  âœ“ ${CATEGORIES_DATA.length} categories`);

  // â”€â”€ 2. Admin user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const adminHash = await bcrypt.hash('Admin@12345', 12);
  await prisma.user.upsert({
    where: { email: 'admin@solomonbharat.com' },
    update: {},
    create: {
      email: 'admin@solomonbharat.com',
      passwordHash: adminHash,
      name: 'Platform Admin',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log('  âœ“ Admin user');

  // â”€â”€ 3. Sample buyer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const buyerHash = await bcrypt.hash('Buyer@12345', 12);
  await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      passwordHash: buyerHash,
      name: 'Jane Smith',
      role: 'BUYER',
      isEmailVerified: true,
      buyerProfile: {
        create: {
          businessName: 'Little Boutique NYC',
          countryCode: 'US',
          preferredCurrency: 'USD',
          storeType: 'boutique',
          aesthetic: 'artisan',
          categoryInterests: ['Textiles', 'Accessories', 'Home Decor'],
        },
      },
      wallet: { create: {} },
      cart: { create: {} },
    },
  });
  console.log('  âœ“ Sample buyer');

  // â”€â”€ 4. Brands + Products + Variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\nSeeding brands, products, and variants...');

  let totalProducts = 0;
  let totalVariants = 0;
  let totalPhotos = 0;

  for (const brandData of BRANDS) {
    const { email, password, brandName, slug, products, ...brandFields } = brandData;

    // Create or find brand user
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hash,
        name: brandName,
        role: 'BRAND',
        isEmailVerified: true,
        brandProfile: {
          create: {
            brandName,
            slug,
            status: 'APPROVED',
            achievementLevel: 'L1_SPROUT',
            approvedAt: new Date(),
            ...brandFields,
          },
        },
      },
      include: { brandProfile: true },
    });

    const brand = user.brandProfile ?? await prisma.brandProfile.findUnique({ where: { userId: user.id } });

    // Patch logoUrl / bannerUrl if the brand profile already existed (upsert update was no-op)
    if (brandFields.logoUrl || brandFields.bannerUrl) {
      await prisma.brandProfile.update({
        where: { id: brand.id },
        data: {
          ...(brandFields.logoUrl  && { logoUrl:  brandFields.logoUrl  }),
          ...(brandFields.bannerUrl && { bannerUrl: brandFields.bannerUrl }),
        },
      });
    }

    console.log(`  Brand: ${brandName}`);

    for (const productData of products) {
      const { variants: variantDefs, photos, ...productFields } = productData;

      // Generate unique slug
      const productSlug = `${toSlug(productData.name)}-${brand.id.slice(-6)}`;

      // Upsert product
      const product = await prisma.product.upsert({
        where: { slug: productSlug },
        update: {},
        create: {
          ...productFields,
          slug: productSlug,
          brandProfileId: brand.id,
          availability: 'ACTIVE',
          countryOfOrigin: 'IN',
        },
      });

      totalProducts++;

      // Seed photos â€” delete existing first to make re-seeding idempotent
      if (photos && photos.length > 0) {
        await prisma.productPhoto.deleteMany({ where: { productId: product.id } });
        await prisma.productPhoto.createMany({
          data: photos.map((p) => ({
            productId: product.id,
            url:       p.url,
            publicId:  p.publicId,
            position:  p.position,
          })),
        });
        totalPhotos += photos.length;
      }

      // Create variants if defined
      if (variantDefs && variantDefs.length > 0) {
        for (const v of variantDefs) {
          // Skip if SKU already exists
          const exists = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
          if (exists) continue;

          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: v.sku,
              priceInr: v.priceInr,

              stock: v.stock,
              status: v.status,
              attributes: {
                create: v.attrs.map((a) => ({ name: a.name, value: a.value })),
              },
            },
          });
          totalVariants++;
        }
      }
    }
  }

  // â”€â”€ Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log('\n' + 'â”€'.repeat(50));
  console.log('âœ… Seed complete!\n');
  console.log(`  Categories : ${CATEGORIES_DATA.length}`);
  console.log(`  Brands     : ${BRANDS.length}`);
  console.log(`  Products   : ${totalProducts}`);
  console.log(`  Photos     : ${totalPhotos}`);
  console.log(`  Variants   : ${totalVariants}`);
  console.log('â”€'.repeat(50) + '\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
