// One-off, non-destructive seed: a single fully-detailed demo brand (every
// onboarding field populated, including bank account and shipping rates) plus
// 5 products with 3+ variants each. Uses upsert throughout — safe to re-run,
// never truncates existing data (unlike seed.js).

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const toSlug = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const W2 = 'ONE_TO_TWO_WEEKS';
const ACT = 'ACTIVE';
const ALL_ZONES = ['DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD'];
const pics = (kw, s) => ({ __kw: kw, __s: s });

async function resolvePhotos(photoSpec) {
  const { __kw: kw, __s: s } = photoSpec;
  const fallback = [0, 1, 2, 3].map((i) => ({ url: `https://picsum.photos/seed/${s + i}/800/600`, publicId: `seed/demo-ph${s + i}`, position: i }));
  if (!process.env.PEXELS_API_KEY) return fallback;
  try {
    const query = encodeURIComponent(kw.replace(/,/g, ' '));
    const res = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=4&orientation=landscape`, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.photos) && data.photos.length
      ? data.photos.map((p, i) => ({ url: p.src.large, publicId: String(p.id), position: i }))
      : fallback;
  } catch (err) {
    console.warn(`  ⚠ Pexels failed for "${kw}": ${err.message} — using picsum`);
    return fallback;
  }
}

const BRAND = {
  email: 'contact@artisanhomecollective.com',
  password: 'Demo@2025',
  brandName: 'Artisan Home Collective',
  slug: 'artisan-home-collective',

  // Core identity
  category: ['Home Décor & Living'],
  countryOfOrigin: 'IN',
  gstNumber: '08AAACA1234B1Z5',
  businessRegNumber: 'U36999RJ2018PTC123456',
  description: 'Handcrafted home décor — soy candles, macramé wall art, seagrass baskets, block-print table linen and kantha cushion covers — made by artisan collectives across Rajasthan and West Bengal.',
  brandStory: 'Founded in 2016 by a collective of five artisan workshops in Jaipur, Artisan Home Collective brings together candle-makers, macramé weavers, basket-weavers, block-printers and kantha embroiderers under one wholesale catalogue. Every piece is handmade in small batches, and every order supports fair wages for the artisans who make it.',
  instagramHandle: 'artisanhomecollective',
  websiteUrl: 'https://artisanhomecollective.com',
  yearFounded: 2016,
  socialLinks: {
    instagram: 'https://instagram.com/artisanhomecollective',
    facebook: 'https://facebook.com/artisanhomecollective',
    twitter: 'https://twitter.com/artisanhomeco',
    pinterest: 'https://pinterest.com/artisanhomecollective',
  },
  existingRetailPartners: 'Nicobar, Good Earth, Anthropologie India (regional stockists)',
  city: 'Jaipur',
  state: 'Rajasthan',
  pickupPincode: '302001',
  logoUrl: 'https://picsum.photos/seed/9101/200/200',
  bannerUrl: 'https://picsum.photos/seed/9151/1200/400',

  // Onboarding extras
  registrationType: 'business',
  tagline: "Handmade home décor, straight from Rajasthan's artisan workshops",
  phone: '+919829012345',
  wholesaleProductCount: 5,
  defaultLeadTime: W2,
  defaultShippingZones: ALL_ZONES,

  // Identity & business document URLs — real Cloudinary uploads (not plain
  // picsum links) since the admin/brand document viewer signs a download URL
  // by parsing "/upload/<public_id>" out of the stored URL; a non-Cloudinary
  // URL produces a broken signed link that 404s when clicked.
  aadharUrl: 'https://res.cloudinary.com/dxnqyvcdl/image/upload/v1783853937/Solomon-Bharat2/docs/demo-brand-aadhar.jpg',
  panUrl: 'https://res.cloudinary.com/dxnqyvcdl/image/upload/v1783853938/Solomon-Bharat2/docs/demo-brand-pan.jpg',
  gstCertUrl: 'https://res.cloudinary.com/dxnqyvcdl/image/upload/v1783853939/Solomon-Bharat2/docs/demo-brand-gstcert.jpg',
  incorporateCertUrl: 'https://res.cloudinary.com/dxnqyvcdl/image/upload/v1783853940/Solomon-Bharat2/docs/demo-brand-incorporatecert.jpg',
  msmeCertUrl: 'https://res.cloudinary.com/dxnqyvcdl/image/upload/v1783853942/Solomon-Bharat2/docs/demo-brand-msmecert.jpg',
  isoCertUrl: 'https://res.cloudinary.com/dxnqyvcdl/image/upload/v1783853943/Solomon-Bharat2/docs/demo-brand-isocert.jpg',
  iecCertUrl: 'https://res.cloudinary.com/dxnqyvcdl/image/upload/v1783853944/Solomon-Bharat2/docs/demo-brand-ieccert.jpg',

  // Status / achievement — onboarding itself defaults to PENDING/L1_SPROUT,
  // but a usable demo brand should already be approved with a mid-tier track record.
  status: 'APPROVED',
  achievementLevel: 'L3_TRUSTED',
  confirmedOrderCount: 340,
  avgRating: 4.8,
  totalGmvInr: 4850000,
  avgDispatchDays: 3.5,
  payoutSpeed: 'EXPRESS',
  minimumOrderValue: 8000,
  returnsWindowDays: 14,

  bankAccount: {
    accountHolderName: 'Artisan Home Collective Pvt Ltd',
    bankName: 'HDFC Bank',
    accountNumber: '50100234567890',
    ifscCode: 'HDFC0001234',
    accountType: 'CURRENT',
    upiId: 'artisanhomecollective@hdfcbank',
  },

  shippingRates: [
    { zone: 'DOMESTIC', rateType: 'FLAT', flatRateInr: 0, freeShippingAboveInr: 0 },
    { zone: 'SOUTH_ASIA', rateType: 'FLAT', flatRateInr: 450, freeShippingAboveInr: 12000 },
    { zone: 'SOUTHEAST_ASIA', rateType: 'FLAT', flatRateInr: 650, freeShippingAboveInr: 15000 },
    { zone: 'MIDDLE_EAST', rateType: 'FLAT', flatRateInr: 800, freeShippingAboveInr: 15000 },
    { zone: 'EUROPE', rateType: 'PER_KG', perKgRateInr: 950, freeShippingAboveInr: 20000 },
    { zone: 'NORTH_AMERICA', rateType: 'PER_KG', perKgRateInr: 1100, freeShippingAboveInr: 20000 },
    { zone: 'OCEANIA', rateType: 'PER_KG', perKgRateInr: 1200, freeShippingAboveInr: 22000 },
    { zone: 'REST_OF_WORLD', rateType: 'PER_KG', perKgRateInr: 1300, freeShippingAboveInr: 25000 },
  ],
};

const PRODUCTS = [
  {
    name: 'Sandalwood & Rose Soy Candle Trio',
    description: 'Hand-poured pure soy wax candles in recycled glass jars, scented with natural sandalwood, rose and lavender essential oil blends. Cotton wicks, no paraffin. Burn time ≥ 35 hrs each.',
    // Base wholesalePriceInr/moq mirror the cheapest variant's own entry
    // tier (lowest-MOQ price) — same convention the brand portal's "Add
    // Product" form uses when variants are enabled.
    wholesalePriceInr: 400, moq: 24, stepQty: 12, leadTime: W2, weightGrams: 350,
    hsTariffCode: '34060090', countryOfOrigin: 'IN',
    categories: ['Home Décor & Living', 'Candles & Holders', 'Soy Candles'],
    tags: ['candle', 'soy', 'handmade', 'gift'], enabledZones: ALL_ZONES,
    material: 'Soy wax, cotton wick, recycled glass', dimensions: '7 x 7 x 8 cm',
    isHandmade: true, placeOfOrigin: 'Jaipur, Rajasthan', isGITagged: false,
    howItIsMade: 'Hand-poured in small batches using pure soy wax and lead-free cotton wicks, scented with natural essential oil blends.',
    artisanName: 'Meera Soni',
    photos: pics('soy,candle,jar,handmade', 401),
    // Each variant carries its own MOQ→price ladder — no product-level tiers
    // when variants exist, since pricing is set per variant, not per product.
    variants: [
      { sku: 'AHC-CND-001-SW', stock: 250, status: ACT, attrs: [{ name: 'Scent', value: 'Sandalwood' }],
        tiers: [{ moq: 24, priceInr: 420 }, { moq: 48, priceInr: 390 }, { moq: 96, priceInr: 360 }] },
      { sku: 'AHC-CND-001-RS', stock: 250, status: ACT, attrs: [{ name: 'Scent', value: 'Rose' }],
        tiers: [{ moq: 24, priceInr: 440 }, { moq: 48, priceInr: 400 }, { moq: 96, priceInr: 370 }] },
      { sku: 'AHC-CND-001-LV', stock: 250, status: ACT, attrs: [{ name: 'Scent', value: 'Lavender' }],
        tiers: [{ moq: 24, priceInr: 400 }, { moq: 48, priceInr: 370 }, { moq: 96, priceInr: 340 }] },
    ],
  },
  {
    name: 'Boho Macramé Wall Hanging',
    description: 'Hand-knotted macramé wall art using 100% natural cotton rope in a diamond-lattice pattern. Driftwood dowel included. Three sizes available for gallery-wall layouts.',
    wholesalePriceInr: 950, moq: 10, stepQty: 5, leadTime: W2, weightGrams: 500,
    hsTariffCode: '63049200', countryOfOrigin: 'IN',
    categories: ['Home Décor & Living', 'Wall Décor', 'Macramé Wall Art'],
    tags: ['macrame', 'wall-art', 'boho', 'cotton'], enabledZones: ALL_ZONES,
    material: 'Cotton rope', dimensions: 'Varies by size (see variants)',
    isHandmade: true, placeOfOrigin: 'Jaipur, Rajasthan', isGITagged: false,
    howItIsMade: 'Hand-knotted using 100% cotton rope in traditional macramé patterns, finished with a driftwood dowel.',
    artisanName: 'Radha Devi',
    photos: pics('macrame,wall,art,boho', 405),
    variants: [
      { sku: 'AHC-MAC-002-S', stock: 100, status: ACT, attrs: [{ name: 'Size', value: 'Small (16x24 in)' }],
        tiers: [{ moq: 10, priceInr: 950 }, { moq: 20, priceInr: 850 }, { moq: 30, priceInr: 780 }] },
      { sku: 'AHC-MAC-002-M', stock: 80, status: ACT, attrs: [{ name: 'Size', value: 'Medium (24x36 in)' }],
        tiers: [{ moq: 10, priceInr: 1200 }, { moq: 20, priceInr: 1000 }, { moq: 30, priceInr: 900 }] },
      { sku: 'AHC-MAC-002-L', stock: 60, status: ACT, attrs: [{ name: 'Size', value: 'Large (32x48 in)' }],
        tiers: [{ moq: 10, priceInr: 1450 }, { moq: 20, priceInr: 1250 }, { moq: 30, priceInr: 1150 }] },
    ],
  },
  {
    name: 'Seagrass Woven Storage Basket Set',
    description: 'Hand-woven natural seagrass storage baskets with braided cotton rope handles. Sold individually across three nested sizes. Eco-certified seagrass, wipe-clean finish.',
    wholesalePriceInr: 900, moq: 8, stepQty: 4, leadTime: W2, weightGrams: 1200,
    hsTariffCode: '46021900', countryOfOrigin: 'IN',
    categories: ['Home Décor & Living', 'Storage & Organisation', 'Baskets'],
    tags: ['basket', 'seagrass', 'storage', 'eco'], enabledZones: ALL_ZONES,
    material: 'Seagrass, cotton rope', dimensions: 'Varies by size (see variants)',
    isHandmade: true, placeOfOrigin: 'Jaipur, Rajasthan', isGITagged: false,
    howItIsMade: "Hand-woven from sustainably harvested seagrass by women's self-help groups near Jaipur.",
    artisanName: 'Kusum Bai',
    photos: pics('seagrass,basket,storage,woven', 409),
    variants: [
      { sku: 'AHC-BSK-003-S', stock: 150, status: ACT, attrs: [{ name: 'Size', value: 'Small (18cm dia)' }],
        tiers: [{ moq: 8, priceInr: 900 }, { moq: 16, priceInr: 820 }, { moq: 24, priceInr: 760 }] },
      { sku: 'AHC-BSK-003-M', stock: 100, status: ACT, attrs: [{ name: 'Size', value: 'Medium (24cm dia)' }],
        tiers: [{ moq: 8, priceInr: 1400 }, { moq: 16, priceInr: 1300 }, { moq: 24, priceInr: 1200 }] },
      { sku: 'AHC-BSK-003-L', stock: 70, status: ACT, attrs: [{ name: 'Size', value: 'Large (30cm dia)' }],
        tiers: [{ moq: 8, priceInr: 1900 }, { moq: 16, priceInr: 1750 }, { moq: 24, priceInr: 1600 }] },
    ],
  },
  {
    name: 'Block-Print Cotton Table Runner',
    description: 'Hand block-printed table runner on 200TC cotton using natural indigo and madder dyes, stamped with hand-carved sheesham wood blocks. 14x72 in. Machine wash cold.',
    wholesalePriceInr: 780, moq: 12, stepQty: 6, leadTime: W2, weightGrams: 300,
    hsTariffCode: '63039200', countryOfOrigin: 'IN',
    categories: ['Home Décor & Living', 'Tabletop & Dining', 'Table Runners'],
    tags: ['table-runner', 'blockprint', 'cotton', 'handmade'], enabledZones: ALL_ZONES,
    material: 'Cotton', dimensions: '14 x 72 in',
    isHandmade: true, placeOfOrigin: 'Bagru, Rajasthan', isGITagged: false,
    howItIsMade: 'Hand block-printed using natural indigo and madder dyes with hand-carved sheesham wood blocks.',
    artisanName: 'Ramesh Chhipa',
    photos: pics('blockprint,table,runner,cotton', 413),
    variants: [
      { sku: 'AHC-TRN-004-IN', stock: 200, status: ACT, attrs: [{ name: 'Color', value: 'Indigo' }],
        tiers: [{ moq: 12, priceInr: 780 }, { moq: 24, priceInr: 720 }, { moq: 36, priceInr: 660 }] },
      { sku: 'AHC-TRN-004-TC', stock: 200, status: ACT, attrs: [{ name: 'Color', value: 'Terracotta' }],
        tiers: [{ moq: 12, priceInr: 780 }, { moq: 24, priceInr: 720 }, { moq: 36, priceInr: 660 }] },
      { sku: 'AHC-TRN-004-SG', stock: 200, status: ACT, attrs: [{ name: 'Color', value: 'Sage' }],
        tiers: [{ moq: 12, priceInr: 780 }, { moq: 24, priceInr: 720 }, { moq: 36, priceInr: 660 }] },
    ],
  },
  {
    name: 'Kantha-Embroidered Cushion Cover Set of 2',
    description: 'Hand-stitched kantha embroidery layering upcycled cotton sari fabric into a soft, textured cushion cover. Sold as a set of 2. Zip closure, 18x18 in. Hand wash recommended.',
    wholesalePriceInr: 950, moq: 10, stepQty: 5, leadTime: W2, weightGrams: 400,
    hsTariffCode: '63049300', countryOfOrigin: 'IN',
    categories: ['Home Décor & Living', 'Soft Furnishings', 'Cushion Covers'],
    tags: ['cushion', 'kantha', 'embroidered', 'cotton'], enabledZones: ALL_ZONES,
    material: 'Cotton', dimensions: '18 x 18 in',
    isHandmade: true, placeOfOrigin: 'West Bengal', isGITagged: true,
    howItIsMade: 'Hand-stitched kantha embroidery layering upcycled cotton sari fabric using the traditional running-stitch technique.',
    artisanName: 'Anjali Das',
    photos: pics('kantha,cushion,embroidered,cotton', 417),
    variants: [
      { sku: 'AHC-CUS-005-NT', stock: 180, status: ACT, attrs: [{ name: 'Color', value: 'Natural' }],
        tiers: [{ moq: 10, priceInr: 950 }, { moq: 20, priceInr: 880 }, { moq: 30, priceInr: 820 }] },
      { sku: 'AHC-CUS-005-CH', stock: 180, status: ACT, attrs: [{ name: 'Color', value: 'Charcoal' }],
        tiers: [{ moq: 10, priceInr: 950 }, { moq: 20, priceInr: 880 }, { moq: 30, priceInr: 820 }] },
      { sku: 'AHC-CUS-005-RS', stock: 180, status: ACT, attrs: [{ name: 'Color', value: 'Rust' }],
        tiers: [{ moq: 10, priceInr: 950 }, { moq: 20, priceInr: 880 }, { moq: 30, priceInr: 820 }] },
    ],
  },
];

async function main() {
  console.log('\n🌱 Seeding demo brand (non-destructive)...\n');

  const { email, password, brandName, slug, bankAccount, shippingRates, ...brandFields } = BRAND;
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    // Re-running the seed should keep an already-created brand's scalar
    // fields (including document URLs) in sync with the source data above —
    // bankAccount/shippingRates are separate relations, left untouched here.
    update: {
      brandProfile: { update: { brandName, ...brandFields } },
    },
    create: {
      email, passwordHash: hash, name: brandName, role: 'BRAND', isEmailVerified: true,
      brandProfile: {
        create: {
          brandName, slug, approvedAt: new Date(),
          ...brandFields,
          bankAccount: { create: bankAccount },
          shippingRates: { create: shippingRates },
        },
      },
    },
    include: { brandProfile: true },
  });

  const brand = user.brandProfile ?? await prisma.brandProfile.findUnique({ where: { userId: user.id } });
  console.log(`  ✔ Brand: ${brandName} (${brand.city}) — status=${brand.status}, tier=${brand.achievementLevel}`);

  let totalProducts = 0, totalVariants = 0, totalPhotos = 0, totalTiers = 0;

  for (const productData of PRODUCTS) {
    // No product-level priceTiers here — every product below has variants,
    // and pricing/MOQ belong to each variant's own tier ladder, not the base
    // product. wholesalePriceInr/moq on productFields are just the cheapest
    // variant's entry price, kept in sync on every re-run via `update`.
    const { variants: variantDefs, photos, ...productFields } = productData;
    const productSlug = `${toSlug(productData.name)}-${brand.id.slice(-6)}`;

    const product = await prisma.product.upsert({
      where: { slug: productSlug },
      update: productFields,
      create: { ...productFields, slug: productSlug, brandProfileId: brand.id, availability: 'ACTIVE' },
    });
    totalProducts++;

    const productPhotos = photos ? await resolvePhotos(photos) : [];
    await prisma.productPhoto.deleteMany({ where: { productId: product.id } });
    await prisma.productPhoto.createMany({
      data: productPhotos.map((ph) => ({ productId: product.id, url: ph.url, publicId: ph.publicId, position: ph.position })),
    });
    totalPhotos += productPhotos.length;

    for (const v of variantDefs) {
      // priceInr/moq are denormalized from the tier ladder's lowest-MOQ
      // entry — same convention the brand portal uses when saving variants
      // with tiers enabled.
      const sortedTiers = [...v.tiers].sort((a, b) => a.moq - b.moq);
      const basePriceInr = sortedTiers[0].priceInr;
      const baseMoq = sortedTiers[0].moq;

      const existing = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
      let variantId;
      if (existing) {
        await prisma.productVariant.update({
          where: { id: existing.id },
          data: { priceInr: basePriceInr, moq: baseMoq, stock: v.stock, status: v.status },
        });
        variantId = existing.id;
      } else {
        const created = await prisma.productVariant.create({
          data: {
            productId: product.id, sku: v.sku, priceInr: basePriceInr, moq: baseMoq,
            stock: v.stock, status: v.status,
            attributes: { create: v.attrs.map((a) => ({ name: a.name, value: a.value })) },
          },
        });
        variantId = created.id;
      }

      await prisma.variantPriceTier.deleteMany({ where: { variantId } });
      await prisma.variantPriceTier.createMany({
        data: sortedTiers.map((t) => ({ variantId, moq: t.moq, priceInr: t.priceInr })),
      });
      totalTiers += sortedTiers.length;
      totalVariants++;
    }

    console.log(`  ✔ Product: ${productData.name} — ${variantDefs.length} variants`);
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✅ Demo brand seed complete!\n');
  console.log(`  Brand      : 1 (${brandName})`);
  console.log(`  Products   : ${totalProducts}`);
  console.log(`  Photos     : ${totalPhotos}`);
  console.log(`  Price tiers: ${totalTiers}`);
  console.log(`  Variants   : ${totalVariants}`);
  console.log('─'.repeat(50) + '\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
