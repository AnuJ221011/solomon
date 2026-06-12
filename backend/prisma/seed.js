import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toSlug = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES_DATA = [
  { name: 'Home Decor',            slug: 'home-decor',            description: 'Handcrafted decorative items for homes and interiors',                  imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop', sortOrder: 1  },
  { name: 'Handmade Textiles',     slug: 'handmade-textiles',     description: 'Block-printed, woven, and embroidered fabrics and apparel',              imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=600&fit=crop', sortOrder: 2  },
  { name: 'Jewelry & Accessories', slug: 'jewelry-accessories',   description: 'Artisan silver, brass, and gemstone jewelry from Indian craftsmen',      imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop', sortOrder: 3  },
  { name: 'Organic Foods',         slug: 'organic-foods',         description: 'Certified organic spices, grains, and specialty food products',          imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=600&fit=crop', sortOrder: 4  },
  { name: 'Wellness & Ayurveda',   slug: 'wellness-ayurveda',     description: 'Traditional Ayurvedic skincare, oils, and wellness products',            imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=600&fit=crop', sortOrder: 5  },
  { name: 'Handcrafted Furniture', slug: 'handcrafted-furniture', description: 'Solid wood and artisan-crafted furniture pieces',                        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop', sortOrder: 6  },
  { name: 'Gifts & Souvenirs',     slug: 'gifts-souvenirs',       description: 'Curated gift sets and India-inspired souvenir collections',              imageUrl: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop', sortOrder: 7  },
  { name: 'Leather Goods',         slug: 'leather-goods',         description: 'Hand-stitched leather bags, wallets, and accessories',                   imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=600&fit=crop', sortOrder: 8  },
  { name: 'Sustainable Products',  slug: 'sustainable-products',  description: 'Eco-friendly, zero-waste, and upcycled goods',                          imageUrl: 'https://images.unsplash.com/photo-1542601906897-ecd68e87f3f0?w=800&h=600&fit=crop', sortOrder: 9  },
  { name: 'Kitchen & Dining',      slug: 'kitchen-dining',        description: 'Handmade pottery, brassware, and artisan kitchen accessories',           imageUrl: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&h=600&fit=crop', sortOrder: 10 },
];

// ─── Brands ───────────────────────────────────────────────────────────────────

const BRANDS = [
  {
    email: 'contact@jaipuricraft.com',
    password: 'Solomon@2025',
    brandName: 'Jaipuri Craft Co.',
    slug: 'jaipuri-craft-co',
    city: 'Jaipur',
    category: ['Home Decor', 'Gifts & Souvenirs'],
    description: 'Third-generation artisan workshop specialising in hand-block-printed home décor from the Pink City.',
    brandStory: 'Founded in 1992 by Ramesh Sharma, Jaipuri Craft Co. carries forward the centuries-old block-printing tradition of Jaipur. Every piece is stamped by hand using carved wooden blocks and natural dyes.',
    yearFounded: 1992,
    logoUrl: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&h=400&fit=crop',
    pickupPincode: '302001',
    instagramHandle: 'jaipuricraft',
    achievementLevel: 'L4_ELITE',
    confirmedOrderCount: 340,
    avgRating: 4.8,
    products: [
      {
        name: 'Sanganeri Block-Print Cushion Covers',
        shortDescription: 'Set of 5 hand-block-printed cotton cushion covers in traditional floral motifs, 18×18 in.',
        fullDescription: 'Each cover is stamped individually using heritage wooden blocks carved from sheesham wood. Printed with AZO-free dyes on 200-thread-count cotton. Set of 5 assorted motifs.',
        wholesalePriceInr: 1200, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 400,
        categories: ['Home Decor'], tags: ['block-print', 'cotton', 'cushion', 'floral', 'jaipur'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800', publicId: 'seed/jcc-cus-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', publicId: 'seed/jcc-cus-001-b', position: 1 },
          { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', publicId: 'seed/jcc-cus-001-c', position: 2 },
        ],
        variants: [
          { sku: 'JCC-CUS-001-IB', priceInr: 1200, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Indigo Blue' }] },
          { sku: 'JCC-CUS-001-TR', priceInr: 1200, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Terracotta Red' }] },
          { sku: 'JCC-CUS-001-FG', priceInr: 1200, stock: 180, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Forest Green' }] },
        ],
      },
      {
        name: 'Bagru Hand-Printed Table Runner',
        shortDescription: 'Mud-resist Bagru-printed cotton table runner, 14×72 in., natural beige and charcoal.',
        fullDescription: 'Made using the Bagru mud-resist printing process, an ancient craft from Bagru village near Jaipur. Each runner is slightly unique. Sold individually.',
        wholesalePriceInr: 850, moq: 20, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 250,
        categories: ['Home Decor', 'Kitchen & Dining'], tags: ['bagru', 'table-runner', 'mud-resist', 'cotton'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800', publicId: 'seed/jcc-tbr-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', publicId: 'seed/jcc-tbr-002-b', position: 1 },
        ],
        variants: [
          { sku: 'JCC-TBR-002-CB', priceInr: 850, stock: 300, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Charcoal on Beige' }] },
          { sku: 'JCC-TBR-002-IN', priceInr: 850, stock: 250, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Indigo on Natural' }] },
        ],
      },
      {
        name: 'Dabu-Print Cotton Throw Blanket',
        shortDescription: 'Lightweight 100% cotton throw with traditional dabu geometric motifs, 50×60 in.',
        fullDescription: 'Dabu printing uses a thick paste of clay and gum to create resist patterns before dyeing. The result is a distinctive crackled texture unique to each piece.',
        wholesalePriceInr: 1800, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 600,
        categories: ['Home Decor', 'Handmade Textiles'], tags: ['dabu', 'throw', 'geometric', 'cotton'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=800', publicId: 'seed/jcc-thr-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', publicId: 'seed/jcc-thr-003-b', position: 1 },
        ],
        variants: [
          { sku: 'JCC-THR-003-SB', priceInr: 1800, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Slate Blue' }] },
          { sku: 'JCC-THR-003-RO', priceInr: 1800, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Rust Orange' }] },
        ],
      },
      {
        name: 'Rajasthani Hand-Painted Tray',
        shortDescription: 'Papier-mâché tray with hand-painted miniature art, 12×8 in. Gold and jewel tones.',
        fullDescription: 'Each tray is crafted from recycled paper pulp, shaped, dried, and painted by miniature artists using fine brushes and natural pigments. Lacquered for durability.',
        wholesalePriceInr: 650, moq: 24, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 180,
        categories: ['Home Decor', 'Gifts & Souvenirs'], tags: ['papier-mache', 'miniature-art', 'tray', 'gold'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'MIDDLE_EAST', 'NORTH_AMERICA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', publicId: 'seed/jcc-try-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800', publicId: 'seed/jcc-try-004-b', position: 1 },
        ],
        variants: [
          { sku: 'JCC-TRY-004-PB', priceInr: 650, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Peacock Blue' }] },
          { sku: 'JCC-TRY-004-CG', priceInr: 650, stock: 350, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Crimson & Gold' }] },
          { sku: 'JCC-TRY-004-EG', priceInr: 650, stock: 280, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Emerald Green' }] },
        ],
      },
      {
        name: 'Block-Print Cotton Gift Wrap Set',
        shortDescription: '10-sheet set of hand-block-printed cotton gift wrap sheets, mixed motifs, 20×28 in.',
        fullDescription: 'Eco-friendly alternative to paper gift wrap. Each sheet is block-printed on unbleached cotton and is reusable. Supplied in a branded kraft box.',
        wholesalePriceInr: 900, moq: 30, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 300,
        categories: ['Gifts & Souvenirs', 'Sustainable Products'], tags: ['gift-wrap', 'block-print', 'eco', 'reusable'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1513201099705-a9746072228c?w=800', publicId: 'seed/jcc-gws-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800', publicId: 'seed/jcc-gws-005-b', position: 1 },
        ],
        variants: [
          { sku: 'JCC-GWS-005-AF', priceInr: 900, stock: 500, status: 'ACTIVE', attrs: [{ name: 'Pattern', value: 'Assorted Floral' }] },
          { sku: 'JCC-GWS-005-GM', priceInr: 900, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Pattern', value: 'Geometric Mix' }] },
        ],
      },
    ],
  },

  {
    email: 'hello@bluepotteryhouse.com',
    password: 'Solomon@2025',
    brandName: 'Blue Pottery House',
    slug: 'blue-pottery-house',
    city: 'Jaipur',
    category: ['Home Decor', 'Kitchen & Dining'],
    description: 'Authentic Jaipur blue pottery — ceramic tiles, vases, and tableware using the traditional Mughal technique.',
    brandStory: 'Blue Pottery House was born from a mission to revive Jaipur\'s GI-tagged blue pottery craft and bring it to global wholesale buyers at fair prices.',
    yearFounded: 2008,
    logoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
    pickupPincode: '302003',
    instagramHandle: 'bluepotteryhouse',
    achievementLevel: 'L3_TRUSTED',
    confirmedOrderCount: 180,
    avgRating: 4.6,
    products: [
      {
        name: 'Jaipur Blue Pottery Dinner Plate',
        shortDescription: 'Hand-painted Jaipur blue pottery dinner plate, 10 in. diameter, traditional floral motif.',
        fullDescription: 'Made from a unique dough of quartz stone powder, powdered glass, Fuller\'s earth, borax, and gum. Each piece is fired at low temperature, giving the distinctive soft-blue glaze.',
        wholesalePriceInr: 750, moq: 12, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 320,
        categories: ['Kitchen & Dining', 'Home Decor'], tags: ['blue-pottery', 'plate', 'ceramic', 'jaipur', 'gi-tag'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1578926078693-4e7b6a0c3b37?w=800', publicId: 'seed/bph-plt-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', publicId: 'seed/bph-plt-001-b', position: 1 },
        ],
        variants: [
          { sku: 'BPH-PLT-001-BW', priceInr: 750, stock: 240, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Classic Blue & White' }] },
          { sku: 'BPH-PLT-001-TF', priceInr: 780, stock: 180, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Turquoise Floral' }] },
        ],
      },
      {
        name: 'Blue Pottery Decorative Vase',
        shortDescription: 'GI-certified Jaipur blue pottery vase, 8 in. tall, hand-painted peacock motif.',
        fullDescription: 'A collector\'s piece and elegant home accent. Fired in traditional kilns and hand-painted by third-generation potters. Each vase varies slightly — a mark of handmade authenticity.',
        wholesalePriceInr: 1100, moq: 6, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 500,
        categories: ['Home Decor'], tags: ['vase', 'blue-pottery', 'peacock', 'gi-tag'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', publicId: 'seed/bph-vas-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800', publicId: 'seed/bph-vas-002-b', position: 1 },
        ],
        variants: [
          { sku: 'BPH-VAS-002-IP', priceInr: 1100, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Indigo Peacock' }] },
          { sku: 'BPH-VAS-002-TF', priceInr: 1100, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Teal Floral' }] },
        ],
      },
      {
        name: 'Blue Pottery Tea Cup Set',
        shortDescription: 'Set of 6 blue pottery tea cups, 150 ml each, with floral border design.',
        fullDescription: 'Perfect for boutique tea collections and café retail. Each cup is individually hand-painted. Sold as a set of 6 in a protective foam-lined export box.',
        wholesalePriceInr: 2200, moq: 6, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 900,
        categories: ['Kitchen & Dining'], tags: ['tea-cups', 'blue-pottery', 'set', 'ceramic'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800', publicId: 'seed/bph-tcs-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800', publicId: 'seed/bph-tcs-003-b', position: 1 },
        ],
        variants: [
          { sku: 'BPH-TCS-003-BF', priceInr: 2200, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Blue Floral' }] },
          { sku: 'BPH-TCS-003-WT', priceInr: 2200, stock: 80, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'White & Turquoise' }] },
        ],
      },
      {
        name: 'Blue Pottery Mosaic Tile Set',
        shortDescription: '25-piece set of 4×4 in. hand-painted blue pottery tiles for wall and backsplash installation.',
        fullDescription: 'Ideal for interior designers, hotels, and retail décor projects. Each tile is individually crafted and signed by the artisan. Sold in sets of 25 in a sturdy export crate.',
        wholesalePriceInr: 4500, moq: 4, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 3000,
        categories: ['Home Decor'], tags: ['tiles', 'mosaic', 'blue-pottery', 'wall-decor'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', publicId: 'seed/bph-tls-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1578926078693-4e7b6a0c3b37?w=800', publicId: 'seed/bph-tls-004-b', position: 1 },
        ],
        variants: [
          { sku: 'BPH-TLS-004-CB', priceInr: 4500, stock: 60, status: 'ACTIVE', attrs: [{ name: 'Pattern', value: 'Classic Blue' }] },
          { sku: 'BPH-TLS-004-MM', priceInr: 4800, stock: 40, status: 'ACTIVE', attrs: [{ name: 'Pattern', value: 'Mixed Motifs' }] },
        ],
      },
      {
        name: 'Blue Pottery Bathroom Accessories Set',
        shortDescription: 'Bathroom set: 1 soap dish and 1 toothbrush holder, matching blue floral pattern.',
        fullDescription: 'A best-seller for boutique bathroom product lines. Waterproof glaze finish. Sold as a matching 2-piece set in a branded gift box.',
        wholesalePriceInr: 950, moq: 12, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 420,
        categories: ['Home Decor', 'Gifts & Souvenirs'], tags: ['bathroom', 'blue-pottery', 'soap-dish', 'gift-set'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', publicId: 'seed/bph-bth-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800', publicId: 'seed/bph-bth-005-b', position: 1 },
        ],
        variants: [
          { sku: 'BPH-BTH-005-CB', priceInr: 950, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Classic Blue' }] },
          { sku: 'BPH-BTH-005-TG', priceInr: 950, stock: 160, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Teal Green' }] },
        ],
      },
    ],
  },

  {
    email: 'export@rajwadafurnishing.in',
    password: 'Solomon@2025',
    brandName: 'Rajwada Furnishing',
    slug: 'rajwada-furnishing',
    city: 'Jodhpur',
    category: ['Handcrafted Furniture', 'Home Decor'],
    description: 'Solid sheesham and mango wood furniture with hand-carved inlay work, crafted in Jodhpur\'s furniture belt.',
    brandStory: 'Operating from Jodhpur\'s industrial export hub since 2001, Rajwada Furnishing supplies hand-carved solid-wood furniture to retailers across Europe and North America.',
    yearFounded: 2001,
    logoUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=400&fit=crop',
    pickupPincode: '342001',
    instagramHandle: 'rajwadafurnishing',
    achievementLevel: 'L4_ELITE',
    confirmedOrderCount: 520,
    avgRating: 4.9,
    products: [
      {
        name: 'Sheesham Wood Side Table',
        shortDescription: 'Solid sheesham wood side table with hand-carved floral inlay, 18×18×22 in.',
        fullDescription: 'Crafted from sustainably sourced Indian sheesham (rosewood). Each table features a hand-carved top panel. Assembled with mortise-and-tenon joints. Knock-down for container shipping.',
        wholesalePriceInr: 8500, moq: 5, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 8000,
        categories: ['Handcrafted Furniture'], tags: ['sheesham', 'side-table', 'hand-carved', 'solid-wood'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', publicId: 'seed/rwf-st-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', publicId: 'seed/rwf-st-001-b', position: 1 },
          { url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800', publicId: 'seed/rwf-st-001-c', position: 2 },
        ],
        variants: [
          { sku: 'RWF-ST-001-NT', priceInr: 8500, stock: 40, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Natural Teak' }] },
          { sku: 'RWF-ST-001-WB', priceInr: 8500, stock: 35, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Walnut Brown' }] },
          { sku: 'RWF-ST-001-WW', priceInr: 9000, stock: 25, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Whitewash' }] },
        ],
      },
      {
        name: 'Mango Wood Console Table',
        shortDescription: 'Reclaimed mango wood console table with iron hairpin legs, 48×14×30 in.',
        fullDescription: 'Made from reclaimed mango wood slabs sourced from aged orchard trees. The live-edge top is hand-finished with natural oil. Paired with matte-black powder-coated iron hairpin legs.',
        wholesalePriceInr: 14000, moq: 3, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 18000,
        categories: ['Handcrafted Furniture'], tags: ['mango-wood', 'console', 'live-edge', 'hairpin-legs'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', publicId: 'seed/rwf-ct-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', publicId: 'seed/rwf-ct-002-b', position: 1 },
        ],
        variants: [
          { sku: 'RWF-CT-002-NO', priceInr: 14000, stock: 20, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Natural Oil' }] },
          { sku: 'RWF-CT-002-DW', priceInr: 14500, stock: 18, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Dark Walnut' }] },
        ],
      },
      {
        name: 'Carved Sheesham Bookshelf',
        shortDescription: '4-shelf solid sheesham bookshelf with jali carved side panels, 32×12×60 in.',
        fullDescription: 'Traditional jali (lattice) carving on side panels adds ornamental appeal. Three adjustable shelves. Finished with beeswax polish. Flat-packed for container export with assembly hardware.',
        wholesalePriceInr: 18500, moq: 2, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 30000,
        categories: ['Handcrafted Furniture'], tags: ['bookshelf', 'sheesham', 'jali', 'carved'],
        enabledZones: ['DOMESTIC', 'EUROPE'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800', publicId: 'seed/rwf-bs-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', publicId: 'seed/rwf-bs-003-b', position: 1 },
        ],
        variants: [
          { sku: 'RWF-BS-003-HT', priceInr: 18500, stock: 15, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Honey Teak' }] },
          { sku: 'RWF-BS-003-DE', priceInr: 19000, stock: 12, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Dark Ebony' }] },
        ],
      },
      {
        name: 'Wooden Dressing Mirror',
        shortDescription: 'Solid sheesham dressing mirror with carved frame, 24×36 in., free-standing.',
        fullDescription: 'Full-length free-standing mirror with a solid sheesham carved frame. Bevelled glass. Adjustable tilt mechanism. Each frame is individually carved and waxed by Jodhpur craftsmen.',
        wholesalePriceInr: 11000, moq: 4, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 12000,
        categories: ['Handcrafted Furniture', 'Home Decor'], tags: ['mirror', 'sheesham', 'dressing', 'carved-frame'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', publicId: 'seed/rwf-mr-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', publicId: 'seed/rwf-mr-004-b', position: 1 },
        ],
        variants: [
          { sku: 'RWF-MR-004-NS', priceInr: 11000, stock: 22, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Natural Sheesham' }] },
          { sku: 'RWF-MR-004-CW', priceInr: 11500, stock: 16, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Painted Chalk White' }] },
        ],
      },
      {
        name: 'Hand-Carved Photo Frames Set of 3',
        shortDescription: 'Set of 3 hand-carved sheesham photo frames: 4×6, 5×7, and 8×10 in.',
        fullDescription: 'Each frame is individually carved with floral border motifs and polished with natural beeswax. Set of 3 graduating sizes. Includes glass fronts and easel backs. Packaged in branded export box.',
        wholesalePriceInr: 2400, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 1800,
        categories: ['Home Decor', 'Gifts & Souvenirs'], tags: ['photo-frame', 'sheesham', 'carved', 'set'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1513201099705-a9746072228c?w=800', publicId: 'seed/rwf-pf-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', publicId: 'seed/rwf-pf-005-b', position: 1 },
        ],
        variants: [
          { sku: 'RWF-PF-005-DW', priceInr: 2400, stock: 80, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Dark Walnut' }] },
          { sku: 'RWF-PF-005-NW', priceInr: 2400, stock: 90, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Natural Wood' }] },
        ],
      },
    ],
  },

  {
    email: 'trade@delhileathercraft.com',
    password: 'Solomon@2025',
    brandName: 'Delhi Leather Craft',
    slug: 'delhi-leather-craft',
    city: 'Delhi',
    category: ['Leather Goods'],
    description: 'Premium vegetable-tanned leather goods — bags, wallets, and belts — handstitched in Old Delhi.',
    brandStory: 'For over 25 years Delhi Leather Craft has been supplying hand-stitched leather goods to boutiques in the UK, France, and the UAE.',
    yearFounded: 1999,
    logoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&h=400&fit=crop',
    pickupPincode: '110006',
    instagramHandle: 'delhileathercraft',
    achievementLevel: 'L3_TRUSTED',
    confirmedOrderCount: 290,
    avgRating: 4.7,
    products: [
      {
        name: 'Full-Grain Leather Tote Bag',
        shortDescription: 'Handstitched full-grain vegetable-tanned leather tote bag, 16×5×13 in., 2 interior pockets.',
        fullDescription: 'Cut and stitched by hand from full-grain vegetable-tanned leather. Saddle-stitched with waxed thread. Solid brass hardware. The leather develops a rich patina with use.',
        wholesalePriceInr: 4200, moq: 6, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 900,
        categories: ['Leather Goods'], tags: ['tote', 'leather', 'handstitched', 'vegetable-tanned'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', publicId: 'seed/dlc-tb-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', publicId: 'seed/dlc-tb-001-b', position: 1 },
          { url: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800', publicId: 'seed/dlc-tb-001-c', position: 2 },
        ],
        variants: [
          { sku: 'DLC-TB-001-CT', priceInr: 4200, stock: 60, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Cognac Tan' }] },
          { sku: 'DLC-TB-001-VB', priceInr: 4200, stock: 55, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Vintage Black' }] },
          { sku: 'DLC-TB-001-CB', priceInr: 4200, stock: 48, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Chestnut Brown' }] },
        ],
      },
      {
        name: 'Slim Bifold Leather Wallet',
        shortDescription: 'Minimalist vegetable-tanned leather bifold wallet, 8 card slots, cash compartment.',
        fullDescription: 'Slim profile with room for 8 cards and a folded cash section. Saddle-stitched with waxed linen thread. Unlined for minimal bulk. Comes in a recycled kraft gift box.',
        wholesalePriceInr: 950, moq: 24, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 60,
        categories: ['Leather Goods'], tags: ['wallet', 'bifold', 'slim', 'vegetable-tanned'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', publicId: 'seed/dlc-wl-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', publicId: 'seed/dlc-wl-002-b', position: 1 },
        ],
        variants: [
          { sku: 'DLC-WL-002-NT', priceInr: 950, stock: 300, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Natural Tan' }] },
          { sku: 'DLC-WL-002-MB', priceInr: 950, stock: 280, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Midnight Black' }] },
          { sku: 'DLC-WL-002-MH', priceInr: 950, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Mahogany Brown' }] },
        ],
      },
      {
        name: 'Hand-Stitched Leather Backpack',
        shortDescription: '20L hand-stitched vegetable-tanned leather backpack with laptop sleeve and brass buckles.',
        fullDescription: 'Made from 2 mm thick full-grain leather. Padded laptop sleeve (up to 15 in.), 3 exterior pockets, adjustable shoulder straps. Solid brass buckle hardware. Each pack takes 12 hours to hand-stitch.',
        wholesalePriceInr: 8500, moq: 4, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 1400,
        categories: ['Leather Goods'], tags: ['backpack', 'leather', 'laptop', 'brass-buckle'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800', publicId: 'seed/dlc-bp-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', publicId: 'seed/dlc-bp-003-b', position: 1 },
        ],
        variants: [
          { sku: 'DLC-BP-003-CG', priceInr: 8500, stock: 35, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Cognac' }] },
          { sku: 'DLC-BP-003-DB', priceInr: 8500, stock: 30, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Dark Brown' }] },
        ],
      },
      {
        name: 'Leather Passport Holder',
        shortDescription: 'Vegetable-tanned leather travel wallet: passport slot, 6 card slots, boarding-pass window.',
        fullDescription: 'Sized for all standard passports. Features a boarding-pass window, 6 card slots, and a zippered coin pocket. RFID-blocking inner lining. Presented in a muslin dust bag.',
        wholesalePriceInr: 1600, moq: 12, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 110,
        categories: ['Leather Goods', 'Gifts & Souvenirs'], tags: ['passport', 'travel-wallet', 'rfid', 'leather'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', publicId: 'seed/dlc-ph-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', publicId: 'seed/dlc-ph-004-b', position: 1 },
        ],
        variants: [
          { sku: 'DLC-PH-004-TN', priceInr: 1600, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Tan' }] },
          { sku: 'DLC-PH-004-BK', priceInr: 1600, stock: 180, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Black' }] },
        ],
      },
      {
        name: 'Leather Belt — Reversible',
        shortDescription: 'Hand-stitched 35 mm reversible leather belt, tan/black, solid brass pin-buckle.',
        fullDescription: 'Crafted from a single piece of 3.5 mm full-grain leather. Reversible to black or tan. Traditional pin-buckle in solid brass. Available in waist sizes 30–44 in.',
        wholesalePriceInr: 1400, moq: 24, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 200,
        categories: ['Leather Goods'], tags: ['belt', 'reversible', 'brass-buckle', 'leather'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', publicId: 'seed/dlc-bl-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800', publicId: 'seed/dlc-bl-005-b', position: 1 },
        ],
        variants: [
          { sku: 'DLC-BL-005-30', priceInr: 1400, stock: 80,  status: 'ACTIVE', attrs: [{ name: 'Size', value: '30"' }] },
          { sku: 'DLC-BL-005-32', priceInr: 1400, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Size', value: '32"' }] },
          { sku: 'DLC-BL-005-34', priceInr: 1400, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Size', value: '34"' }] },
          { sku: 'DLC-BL-005-36', priceInr: 1400, stock: 90,  status: 'ACTIVE', attrs: [{ name: 'Size', value: '36"' }] },
        ],
      },
    ],
  },

  {
    email: 'wholesale@mumbaitextilestudio.co',
    password: 'Solomon@2025',
    brandName: 'Mumbai Textile Studio',
    slug: 'mumbai-textile-studio',
    city: 'Mumbai',
    category: ['Handmade Textiles'],
    description: 'Contemporary block-print and resist-dye fabrics combining Mumbai\'s design sensibility with traditional craft.',
    brandStory: 'Mumbai Textile Studio bridges traditional Indian resist-dyeing with modern silhouettes, working with a network of 60+ artisans from Maharashtra and Gujarat.',
    yearFounded: 2014,
    logoUrl: 'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=1200&h=400&fit=crop',
    pickupPincode: '400001',
    instagramHandle: 'mumbaitextilestudio',
    achievementLevel: 'L3_TRUSTED',
    confirmedOrderCount: 210,
    avgRating: 4.5,
    products: [
      {
        name: 'Ajrakh Block-Print Stole',
        shortDescription: 'Hand-block-printed Ajrakh stole in natural dyes, 28×80 in., 100% cotton.',
        fullDescription: 'Ajrakh is a traditional resist-printing technique using natural dyes from indigo, pomegranate, and madder. Each stole takes 3–4 days to complete and features a double-sided print.',
        wholesalePriceInr: 1800, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 200,
        categories: ['Handmade Textiles'], tags: ['ajrakh', 'stole', 'block-print', 'natural-dye'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=800', publicId: 'seed/mts-st-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800', publicId: 'seed/mts-st-001-b', position: 1 },
        ],
        variants: [
          { sku: 'MTS-ST-001-IM', priceInr: 1800, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Indigo & Madder' }] },
          { sku: 'MTS-ST-001-DI', priceInr: 1800, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Deep Indigo' }] },
          { sku: 'MTS-ST-001-MR', priceInr: 1800, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Madder Red' }] },
        ],
      },
      {
        name: 'Shibori Tie-Dye Cotton Bedsheet',
        shortDescription: 'King-size shibori tie-dye cotton bedsheet (108×108 in.) with 2 matching pillowcases.',
        fullDescription: 'Indigo shibori dyed on 400-thread-count cotton. The three-piece set includes a king flat sheet and 2 pillowcases. Each piece is unique — no two sets are identical.',
        wholesalePriceInr: 3200, moq: 5, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 1800,
        categories: ['Handmade Textiles', 'Home Decor'], tags: ['shibori', 'bedsheet', 'indigo', 'tie-dye'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', publicId: 'seed/mts-bs-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=800', publicId: 'seed/mts-bs-002-b', position: 1 },
        ],
        variants: [
          { sku: 'MTS-BS-002-IB', priceInr: 3200, stock: 80, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Indigo Blue' }] },
          { sku: 'MTS-BS-002-SG', priceInr: 3200, stock: 65, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Slate Grey' }] },
        ],
      },
      {
        name: 'Kalamkari Printed Kurta Fabric',
        shortDescription: 'Hand-painted kalamkari cotton fabric, 2.5 m length, myth-inspired narrative print.',
        fullDescription: 'Each length is hand-painted by kalamkari artists using kalam (pen) and natural dyes. Features scenes from Indian mythology. Suitable for kurtas, tops, or home décor sewing projects.',
        wholesalePriceInr: 2400, moq: 10, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 350,
        categories: ['Handmade Textiles'], tags: ['kalamkari', 'fabric', 'hand-painted', 'cotton'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800', publicId: 'seed/mts-kf-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1600369671236-e74521d4b6ad?w=800', publicId: 'seed/mts-kf-003-b', position: 1 },
        ],
        variants: [
          { sku: 'MTS-KF-003-EO', priceInr: 2400, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Earthy Ochre' }] },
          { sku: 'MTS-KF-003-RB', priceInr: 2400, stock: 90,  status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Rust & Black' }] },
        ],
      },
      {
        name: 'Hand-Woven Ikat Cushion Covers',
        shortDescription: 'Set of 4 hand-woven ikat cotton cushion covers, 20×20 in., geometric chevron pattern.',
        fullDescription: 'Woven on traditional frame looms by weavers in Maharashtra. The ikat technique involves resist-dyeing the yarn before weaving to create the distinctive blurred geometric motif.',
        wholesalePriceInr: 2800, moq: 5, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 600,
        categories: ['Handmade Textiles', 'Home Decor'], tags: ['ikat', 'cushion', 'woven', 'chevron'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800', publicId: 'seed/mts-ic-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', publicId: 'seed/mts-ic-004-b', position: 1 },
        ],
        variants: [
          { sku: 'MTS-IC-004-CI', priceInr: 2800, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Cobalt & Ivory' }] },
          { sku: 'MTS-IC-004-TN', priceInr: 2800, stock: 80,  status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Terracotta & Natural' }] },
        ],
      },
      {
        name: 'Natural Dye Linen Table Napkins',
        shortDescription: 'Set of 8 plant-dyed linen dinner napkins, 20×20 in., assorted earthy tones.',
        fullDescription: 'Made from European linen, dyed with natural extracts: turmeric, madder, indigo, and onion skin. Each set of 8 includes 2 napkins in each of 4 shades. Presented in a reusable cotton bag.',
        wholesalePriceInr: 2200, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 500,
        categories: ['Handmade Textiles', 'Kitchen & Dining'], tags: ['napkins', 'linen', 'natural-dye', 'table-linen'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', publicId: 'seed/mts-np-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800', publicId: 'seed/mts-np-005-b', position: 1 },
        ],
        variants: [
          { sku: 'MTS-NP-005-EA', priceInr: 2200, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Earth Tones Assorted' }] },
          { sku: 'MTS-NP-005-IA', priceInr: 2200, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Indigo Assorted' }] },
        ],
      },
    ],
  },

  {
    email: 'b2b@pureearth.in',
    password: 'Solomon@2025',
    brandName: 'Pure Earth Organics',
    slug: 'pure-earth-organics',
    city: 'Bengaluru',
    category: ['Organic Foods', 'Wellness & Ayurveda'],
    description: 'USDA and FSSAI certified organic spices, superfoods, and Ayurvedic wellness products sourced direct from Karnataka farms.',
    brandStory: 'Pure Earth Organics was founded by Priya Nair in 2017 to give smallholder organic farmers in Karnataka a fair and direct route to global markets.',
    yearFounded: 2017,
    logoUrl: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=1200&h=400&fit=crop',
    pickupPincode: '560001',
    instagramHandle: 'pureearth_in',
    achievementLevel: 'L2_RISING',
    confirmedOrderCount: 95,
    avgRating: 4.6,
    products: [
      {
        name: 'Organic Spice Gift Box — 12 Jars',
        shortDescription: 'Set of 12 certified organic spices in 50 g glass jars: turmeric, cardamom, cumin, and more.',
        fullDescription: 'USDA Organic and India Organic certified. Spices are sourced from single-farm estates, stone-ground to order, and packed in airtight borosilicate glass jars.',
        wholesalePriceInr: 2800, moq: 6, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 1200,
        categories: ['Organic Foods', 'Gifts & Souvenirs'], tags: ['spices', 'organic', 'gift-set', 'glass-jars'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', publicId: 'seed/peo-sg-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800', publicId: 'seed/peo-sg-001-b', position: 1 },
        ],
        variants: [
          { sku: 'PEO-SG-001-CI', priceInr: 2800, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Pack', value: 'Classic Indian Spices' }] },
          { sku: 'PEO-SG-001-BS', priceInr: 2800, stock: 90,  status: 'ACTIVE', attrs: [{ name: 'Pack', value: 'Baking Spices' }] },
        ],
      },
      {
        name: 'Cold-Pressed Coconut Oil 500 ml',
        shortDescription: 'Raw, cold-pressed virgin coconut oil from Kerala estates, 500 ml glass bottle.',
        fullDescription: 'Wood-pressed in small batches from fresh mature coconuts. Unrefined, unbleached, and undeodorised. Suitable for cooking, skincare, and hair care. FSSAI certified.',
        wholesalePriceInr: 650, moq: 24, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 620,
        categories: ['Organic Foods', 'Wellness & Ayurveda'], tags: ['coconut-oil', 'cold-pressed', 'organic'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800', publicId: 'seed/peo-co-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', publicId: 'seed/peo-co-002-b', position: 1 },
        ],
        variants: [
          { sku: 'PEO-CO-002-SM', priceInr: 650,  stock: 500, status: 'ACTIVE', attrs: [{ name: 'Size', value: '500 ml' }] },
          { sku: 'PEO-CO-002-LG', priceInr: 1100, stock: 300, status: 'ACTIVE', attrs: [{ name: 'Size', value: '1 Litre' }] },
        ],
      },
      {
        name: 'Ashwagandha Root Powder 250 g',
        shortDescription: 'Certified organic ashwagandha root powder, 250 g kraft pouch.',
        fullDescription: 'Sun-dried and stone-ground from organically cultivated ashwagandha roots grown in Madhya Pradesh. Lab-tested for withanolide content, heavy metals, and microbial safety.',
        wholesalePriceInr: 480, moq: 48, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 280,
        categories: ['Wellness & Ayurveda', 'Organic Foods'], tags: ['ashwagandha', 'adaptogen', 'ayurveda', 'powder'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', publicId: 'seed/peo-aw-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', publicId: 'seed/peo-aw-003-b', position: 1 },
        ],
        variants: [
          { sku: 'PEO-AW-003-SM', priceInr: 480,  stock: 600, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '250 g' }] },
          { sku: 'PEO-AW-003-MD', priceInr: 880,  stock: 400, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '500 g' }] },
          { sku: 'PEO-AW-003-LG', priceInr: 1600, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '1 kg' }] },
        ],
      },
      {
        name: 'Moringa Leaf Powder 200 g',
        shortDescription: 'Organic moringa leaf powder, air-dried, 200 g resealable pouch.',
        fullDescription: 'Leaves are harvested in the morning and air-dried at low temperature to preserve nutrients. Rich in iron, calcium, and antioxidants. Ideal for health food brands and supplement manufacturers.',
        wholesalePriceInr: 380, moq: 48, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 220,
        categories: ['Wellness & Ayurveda', 'Organic Foods'], tags: ['moringa', 'superfood', 'powder', 'organic'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', publicId: 'seed/peo-mg-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800', publicId: 'seed/peo-mg-004-b', position: 1 },
        ],
        variants: [
          { sku: 'PEO-MG-004-SM', priceInr: 380, stock: 700, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '200 g' }] },
          { sku: 'PEO-MG-004-MD', priceInr: 850, stock: 500, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '500 g' }] },
        ],
      },
      {
        name: 'Turmeric Latte Blend 150 g',
        shortDescription: 'Golden milk spice blend: organic turmeric, ginger, black pepper, cinnamon, 150 g tin.',
        fullDescription: 'Small-batch blended from 100% organic single-origin ingredients. The black pepper activates curcumin absorption. Packaged in a reusable airtight tin.',
        wholesalePriceInr: 520, moq: 36, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 200,
        categories: ['Organic Foods', 'Wellness & Ayurveda'], tags: ['turmeric-latte', 'golden-milk', 'blend', 'organic'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', publicId: 'seed/peo-tl-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', publicId: 'seed/peo-tl-005-b', position: 1 },
        ],
        variants: [
          { sku: 'PEO-TL-005-SM', priceInr: 520, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Size', value: '150 g Tin' }] },
          { sku: 'PEO-TL-005-MD', priceInr: 950, stock: 250, status: 'ACTIVE', attrs: [{ name: 'Size', value: '300 g Tin' }] },
        ],
      },
    ],
  },

  {
    email: 'sales@ahmedabadsilver.com',
    password: 'Solomon@2025',
    brandName: 'Ahmedabad Silver Works',
    slug: 'ahmedabad-silver-works',
    city: 'Ahmedabad',
    category: ['Jewelry & Accessories'],
    description: 'Sterling silver tribal and contemporary jewellery made by master craftsmen in the heart of Gujarat.',
    brandStory: 'Ahmedabad Silver Works has been exporting hand-crafted sterling silver jewellery since 1985, combining Kutchi tribal motifs with modern jewellery design.',
    yearFounded: 1985,
    logoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=400&fit=crop',
    pickupPincode: '380001',
    instagramHandle: 'ahmedabadsilver',
    achievementLevel: 'L5_LEGEND',
    confirmedOrderCount: 780,
    avgRating: 4.9,
    products: [
      {
        name: 'Kutchi Tribal Silver Cuff Bracelet',
        shortDescription: 'Sterling silver Kutchi tribal cuff bracelet with embossed camel and mirror motifs, adjustable.',
        fullDescription: 'Handcrafted by Kutchi silversmiths using traditional embossing and chasing techniques. 92.5% sterling silver. Features classic camel motifs and mirror-inlay typical of Kutchi tribal jewellery.',
        wholesalePriceInr: 2400, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 60,
        categories: ['Jewelry & Accessories'], tags: ['silver', 'cuff', 'kutchi', 'tribal', 'bracelet'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', publicId: 'seed/asw-cb-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', publicId: 'seed/asw-cb-001-b', position: 1 },
        ],
        variants: [
          { sku: 'ASW-CB-001-OS', priceInr: 2400, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Oxidised Silver' }] },
          { sku: 'ASW-CB-001-BS', priceInr: 2400, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Bright Silver' }] },
        ],
      },
      {
        name: 'Sterling Silver Jhumka Earrings',
        shortDescription: 'Traditional silver jhumka earrings with turquoise stone drops, 5 cm drop, hook fastening.',
        fullDescription: 'Cast and finished by hand. Features a dome-shaped upper bell set with a turquoise cabochon, with a fringe of small silver drops. 92.5% sterling silver.',
        wholesalePriceInr: 1600, moq: 12, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 30,
        categories: ['Jewelry & Accessories'], tags: ['jhumka', 'earrings', 'silver', 'turquoise', 'traditional'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', publicId: 'seed/asw-je-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', publicId: 'seed/asw-je-002-b', position: 1 },
        ],
        variants: [
          { sku: 'ASW-JE-002-TQ', priceInr: 1600, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Stone', value: 'Turquoise' }] },
          { sku: 'ASW-JE-002-CR', priceInr: 1600, stock: 180, status: 'ACTIVE', attrs: [{ name: 'Stone', value: 'Coral Red' }] },
          { sku: 'ASW-JE-002-LB', priceInr: 1700, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Stone', value: 'Lapis Blue' }] },
        ],
      },
      {
        name: 'Filigree Silver Pendant Necklace',
        shortDescription: 'Handmade silver filigree pendant on sterling silver chain, 18 in., lotus motif.',
        fullDescription: 'Each pendant is built from fine silver wire twisted and soldered by hand — the ancient filigree art of Gujarat. Lotus motif, 3 cm diameter pendant. Paired with a 45 cm cable chain.',
        wholesalePriceInr: 2800, moq: 8, leadTime: 'TWO_TO_FOUR_WEEKS', weightGrams: 15,
        categories: ['Jewelry & Accessories'], tags: ['pendant', 'filigree', 'silver', 'lotus', 'necklace'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', publicId: 'seed/asw-pn-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', publicId: 'seed/asw-pn-003-b', position: 1 },
        ],
        variants: [
          { sku: 'ASW-PN-003-BS', priceInr: 2800, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Bright Silver' }] },
          { sku: 'ASW-PN-003-OS', priceInr: 2800, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Oxidised Silver' }] },
        ],
      },
      {
        name: 'Silver Nose Ring Set',
        shortDescription: '3-piece set of sterling silver nose rings: 1 stud, 1 hoop, 1 L-bend, all 20G.',
        fullDescription: 'All 20-gauge sterling silver. Set includes a beaded stud (2 mm ball), a plain seamless hoop (8 mm inner diameter), and an L-bend pin. Packed in a branded jewellery card.',
        wholesalePriceInr: 750, moq: 24, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 5,
        categories: ['Jewelry & Accessories'], tags: ['nose-ring', 'silver', 'stud', 'hoop', 'piercing'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', publicId: 'seed/asw-nr-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', publicId: 'seed/asw-nr-004-b', position: 1 },
        ],
        variants: [
          { sku: 'ASW-NR-004-PS', priceInr: 750, stock: 500, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Plain Silver' }] },
          { sku: 'ASW-NR-004-BD', priceInr: 800, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Beaded Silver' }] },
        ],
      },
      {
        name: 'Oxidised Silver Stackable Rings Set',
        shortDescription: 'Set of 3 oxidised silver stackable rings: plain band, twisted, and textured.',
        fullDescription: 'Three complementary stackable rings in oxidised sterling silver. Sold as a coordinated set. Each ring is individually hand-polished to achieve the oxidised patina. Available in sizes 5–10.',
        wholesalePriceInr: 1200, moq: 12, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 18,
        categories: ['Jewelry & Accessories'], tags: ['rings', 'stackable', 'oxidised', 'silver', 'set'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800', publicId: 'seed/asw-rs-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', publicId: 'seed/asw-rs-005-b', position: 1 },
        ],
        variants: [
          { sku: 'ASW-RS-005-S5', priceInr: 1200, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Size 5' }] },
          { sku: 'ASW-RS-005-S6', priceInr: 1200, stock: 180, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Size 6' }] },
          { sku: 'ASW-RS-005-S7', priceInr: 1200, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Size 7' }] },
          { sku: 'ASW-RS-005-S8', priceInr: 1200, stock: 160, status: 'ACTIVE', attrs: [{ name: 'Size', value: 'Size 8' }] },
        ],
      },
    ],
  },

  {
    email: 'export@suratecoweaves.com',
    password: 'Solomon@2025',
    brandName: 'Surat Eco Weaves',
    slug: 'surat-eco-weaves',
    city: 'Surat',
    category: ['Sustainable Products', 'Handmade Textiles'],
    description: 'Handwoven sustainable textiles using recycled yarn and natural fibres from Surat\'s artisan weaver collectives.',
    brandStory: 'Surat Eco Weaves works with a cooperative of 120 weavers to transform post-industrial fabric waste into premium sustainable textiles for global conscious retailers.',
    yearFounded: 2019,
    logoUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=400&fit=crop',
    pickupPincode: '395001',
    instagramHandle: 'surateco',
    achievementLevel: 'L2_RISING',
    confirmedOrderCount: 75,
    avgRating: 4.4,
    products: [
      {
        name: 'Recycled Cotton Yoga Mat Bag',
        shortDescription: 'Hand-woven yoga mat carrier bag from recycled cotton yarn, drawstring closure, 28×8 in.',
        fullDescription: 'Woven from post-industrial cotton mill waste. Fits standard 24 in. yoga mats. Drawstring closure with a wooden bead toggle. Certified by GRS (Global Recycled Standard).',
        wholesalePriceInr: 680, moq: 20, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 150,
        categories: ['Sustainable Products'], tags: ['yoga', 'recycled', 'cotton', 'bag', 'eco'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', publicId: 'seed/sew-yb-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800', publicId: 'seed/sew-yb-001-b', position: 1 },
        ],
        variants: [
          { sku: 'SEW-YB-001-NI', priceInr: 680, stock: 250, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Natural & Indigo' }] },
          { sku: 'SEW-YB-001-TS', priceInr: 680, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Terracotta Stripe' }] },
        ],
      },
      {
        name: 'Upcycled Fabric Storage Basket Set',
        shortDescription: 'Set of 3 nesting storage baskets hand-woven from upcycled cotton rope, sizes S/M/L.',
        fullDescription: 'Made from braided cotton rope reclaimed from textile mills. Coiled and hand-stitched. Each set nests inside the other for compact display. GOTS certified cotton.',
        wholesalePriceInr: 1600, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 800,
        categories: ['Sustainable Products', 'Home Decor'], tags: ['basket', 'storage', 'upcycled', 'cotton-rope'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800', publicId: 'seed/sew-sb-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800', publicId: 'seed/sew-sb-002-b', position: 1 },
        ],
        variants: [
          { sku: 'SEW-SB-002-NW', priceInr: 1600, stock: 180, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Natural White' }] },
          { sku: 'SEW-SB-002-GS', priceInr: 1600, stock: 140, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Grey Stripe' }] },
        ],
      },
      {
        name: 'Zero-Waste Cotton Produce Bags',
        shortDescription: 'Pack of 5 hand-woven mesh produce bags from organic cotton, assorted sizes.',
        fullDescription: 'A plastic-bag alternative for grocery and produce shopping. Woven mesh allows produce to breathe. Pack of 5 (2 small, 2 medium, 1 large). Tare weight tag included. GOTS certified.',
        wholesalePriceInr: 450, moq: 30, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 120,
        categories: ['Sustainable Products'], tags: ['produce-bags', 'mesh', 'zero-waste', 'organic-cotton'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', publicId: 'seed/sew-pb-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800', publicId: 'seed/sew-pb-003-b', position: 1 },
        ],
        variants: [
          { sku: 'SEW-PB-003-NT', priceInr: 450, stock: 600, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Natural' }] },
          { sku: 'SEW-PB-003-DA', priceInr: 480, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Dyed Assorted' }] },
        ],
      },
      {
        name: 'Handwoven Jute & Cotton Tote',
        shortDescription: 'Durable jute-and-cotton blend tote bag, hand-woven, 14×16 in., reinforced handles.',
        fullDescription: 'A sturdy market tote woven from a jute-cotton blend (60% jute, 40% recycled cotton). Reinforced cotton webbing handles. A low-carbon alternative to synthetic bags.',
        wholesalePriceInr: 580, moq: 24, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 220,
        categories: ['Sustainable Products'], tags: ['tote', 'jute', 'cotton', 'handwoven', 'market-bag'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', publicId: 'seed/sew-jt-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', publicId: 'seed/sew-jt-004-b', position: 1 },
        ],
        variants: [
          { sku: 'SEW-JT-004-NJ', priceInr: 580, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Natural Jute' }] },
          { sku: 'SEW-JT-004-BS', priceInr: 580, stock: 300, status: 'ACTIVE', attrs: [{ name: 'Color', value: 'Black Stripe' }] },
        ],
      },
      {
        name: 'Organic Cotton Beeswax Wrap Set',
        shortDescription: 'Set of 3 beeswax-infused organic cotton wraps (S/M/L) to replace cling film.',
        fullDescription: 'Organic cotton coated with a blend of beeswax, jojoba oil, and tree resin. Reusable up to 1 year. Washes clean with cold water. Set of 3 (25×25, 30×30, 35×35 cm). Assorted block-print patterns.',
        wholesalePriceInr: 780, moq: 20, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 100,
        categories: ['Sustainable Products', 'Kitchen & Dining'], tags: ['beeswax-wrap', 'zero-waste', 'organic'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', publicId: 'seed/sew-bw-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800', publicId: 'seed/sew-bw-005-b', position: 1 },
        ],
        variants: [
          { sku: 'SEW-BW-005-FM', priceInr: 780, stock: 350, status: 'ACTIVE', attrs: [{ name: 'Pattern', value: 'Floral Mix' }] },
          { sku: 'SEW-BW-005-GM', priceInr: 780, stock: 280, status: 'ACTIVE', attrs: [{ name: 'Pattern', value: 'Geometric Mix' }] },
        ],
      },
    ],
  },

  {
    email: 'trade@moradabadbrass.com',
    password: 'Solomon@2025',
    brandName: 'Moradabad Brass Emporium',
    slug: 'moradabad-brass-emporium',
    city: 'Moradabad',
    category: ['Home Decor', 'Kitchen & Dining', 'Gifts & Souvenirs'],
    description: 'Handcrafted brassware — vases, trays, candle holders, and tableware — from India\'s Brass City.',
    brandStory: 'With roots going back to 1978, Moradabad Brass Emporium is a family-owned export house that supplies handcrafted brassware to retailers across 35 countries.',
    yearFounded: 1978,
    logoUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&h=400&fit=crop',
    pickupPincode: '244001',
    instagramHandle: 'moradabadbrass',
    achievementLevel: 'L4_ELITE',
    confirmedOrderCount: 460,
    avgRating: 4.7,
    products: [
      {
        name: 'Handcrafted Brass Candle Holders',
        shortDescription: 'Set of 3 graduated hand-cast brass pillar candle holders, 3, 5, and 7 in. heights.',
        fullDescription: 'Cast in lost-wax and hand-finished with a satin brass polish. Weighted bases prevent tipping. Fits standard pillar candles. Ideal for hospitality, wedding retail, and home décor buyers.',
        wholesalePriceInr: 1800, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 1200,
        categories: ['Home Decor'], tags: ['brass', 'candle-holder', 'set', 'hand-cast'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', publicId: 'seed/mbe-ch-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800', publicId: 'seed/mbe-ch-001-b', position: 1 },
        ],
        variants: [
          { sku: 'MBE-CH-001-SB', priceInr: 1800, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Satin Brass' }] },
          { sku: 'MBE-CH-001-AB', priceInr: 1900, stock: 160, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Antique Brass' }] },
          { sku: 'MBE-CH-001-HB', priceInr: 2000, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Hammered Brass' }] },
        ],
      },
      {
        name: 'Engraved Brass Serving Tray',
        shortDescription: 'Hand-engraved round brass serving tray, 14 in. diameter, floral mandala pattern.',
        fullDescription: 'Each tray is individually engraved by craftsmen using traditional chisel tools. The mandala pattern is unique to each piece. Lacquered for easy cleaning. Two fixed handles for carrying.',
        wholesalePriceInr: 2200, moq: 8, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 800,
        categories: ['Kitchen & Dining', 'Home Decor'], tags: ['tray', 'brass', 'engraved', 'mandala', 'serving'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', publicId: 'seed/mbe-tr-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800', publicId: 'seed/mbe-tr-002-b', position: 1 },
        ],
        variants: [
          { sku: 'MBE-TR-002-PB', priceInr: 2200, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Polished Brass' }] },
          { sku: 'MBE-TR-002-AB', priceInr: 2300, stock: 100, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Antique Bronze' }] },
        ],
      },
      {
        name: 'Brass Oil Diffuser Burner',
        shortDescription: 'Traditional brass oil-burner with filigree cut-outs, 5 in. tall, includes a tea-light tray.',
        fullDescription: 'Hand-cast and filed. The filigree side panels create a lantern effect when lit. Upper bowl holds 10 ml of essential oil or wax melts. Tea-light tray at base.',
        wholesalePriceInr: 1100, moq: 12, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 400,
        categories: ['Home Decor', 'Wellness & Ayurveda'], tags: ['diffuser', 'brass', 'oil-burner', 'filigree'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800', publicId: 'seed/mbe-ob-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', publicId: 'seed/mbe-ob-003-b', position: 1 },
        ],
        variants: [
          { sku: 'MBE-OB-003-PB', priceInr: 1100, stock: 250, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Polished Brass' }] },
          { sku: 'MBE-OB-003-AB', priceInr: 1150, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Antique Brass' }] },
        ],
      },
      {
        name: 'Hammered Brass Flower Vase',
        shortDescription: 'Hand-hammered brass flower vase, 10 in. tall, narrow-neck tulip form, watertight.',
        fullDescription: 'Each vase is shaped over an iron mandrel and hammered by hand to create a uniform dimple pattern. Sealed inside with food-grade lacquer to hold water.',
        wholesalePriceInr: 1400, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 600,
        categories: ['Home Decor'], tags: ['vase', 'brass', 'hammered', 'flower'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800', publicId: 'seed/mbe-vs-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', publicId: 'seed/mbe-vs-004-b', position: 1 },
        ],
        variants: [
          { sku: 'MBE-VS-004-RB', priceInr: 1400, stock: 180, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Raw Brass' }] },
          { sku: 'MBE-VS-004-AB', priceInr: 1500, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Antique Brass' }] },
        ],
      },
      {
        name: 'Brass Diya Set — Festival Collection',
        shortDescription: 'Set of 6 hand-cast brass diyas (oil lamps) in graduated sizes, traditional lotus design.',
        fullDescription: 'A perennial best-seller during Diwali and festive seasons. Each diya is cast in brass, hand-polished, and lacquer-coated. Popular with Indian grocery, lifestyle, and gift-shop buyers worldwide.',
        wholesalePriceInr: 1200, moq: 20, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 700,
        categories: ['Home Decor', 'Gifts & Souvenirs'], tags: ['diya', 'brass', 'diwali', 'festival', 'lamp'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'SOUTHEAST_ASIA', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', publicId: 'seed/mbe-dy-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800', publicId: 'seed/mbe-dy-005-b', position: 1 },
        ],
        variants: [
          { sku: 'MBE-DY-005-PB', priceInr: 1200, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Polished Brass' }] },
          { sku: 'MBE-DY-005-AB', priceInr: 1300, stock: 300, status: 'ACTIVE', attrs: [{ name: 'Finish', value: 'Antique Brass' }] },
        ],
      },
    ],
  },

  {
    email: 'wholesale@kochiherbs.in',
    password: 'Solomon@2025',
    brandName: 'Kochi Herb & Spice Co.',
    slug: 'kochi-herb-spice-co',
    city: 'Kochi',
    category: ['Organic Foods', 'Wellness & Ayurveda'],
    description: 'Single-origin Kerala spices, herbal teas, and Ayurvedic herb blends sourced from estate farms in the Western Ghats.',
    brandStory: 'Rooted in Kerala\'s spice-trade heritage, Kochi Herb & Spice Co. sources directly from small estate farms in the Western Ghats to deliver the purest spices to world markets.',
    yearFounded: 2011,
    logoUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1200&h=400&fit=crop',
    pickupPincode: '682001',
    instagramHandle: 'kochiherbs',
    achievementLevel: 'L3_TRUSTED',
    confirmedOrderCount: 230,
    avgRating: 4.8,
    products: [
      {
        name: 'Single-Origin Kerala Black Pepper',
        shortDescription: 'Premium Malabar black pepper from single-estate Wayanad farm, 250 g glass jar.',
        fullDescription: 'Piper nigrum harvested at full maturity, sun-dried for 7 days. Bold heat, citrus top note. Tested for piperine content. Minimum 5.5% piperine. Resealable glass jar.',
        wholesalePriceInr: 580, moq: 24, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 320,
        categories: ['Organic Foods'], tags: ['black-pepper', 'malabar', 'single-origin', 'kerala'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', publicId: 'seed/khs-bp-001-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800', publicId: 'seed/khs-bp-001-b', position: 1 },
        ],
        variants: [
          { sku: 'KHS-BP-001-SM', priceInr: 580,  stock: 600, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '250 g' }] },
          { sku: 'KHS-BP-001-MD', priceInr: 1050, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '500 g' }] },
        ],
      },
      {
        name: 'Kerala Cardamom Pods 100 g',
        shortDescription: 'Large plump green cardamom pods (7 mm+) from Idukki district, 100 g resealable tin.',
        fullDescription: 'Hand-harvested from high-altitude (900 m) farms in Idukki. Dried slowly to retain the volatile oils. Bold, camphor-sweet aroma. GI-certified Alleppey Green Grade.',
        wholesalePriceInr: 1200, moq: 12, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 150,
        categories: ['Organic Foods'], tags: ['cardamom', 'kerala', 'gi-certified', 'idukki'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800', publicId: 'seed/khs-cd-002-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', publicId: 'seed/khs-cd-002-b', position: 1 },
        ],
        variants: [
          { sku: 'KHS-CD-002-SM', priceInr: 1200, stock: 400, status: 'ACTIVE', attrs: [{ name: 'Size', value: '100 g Tin' }] },
          { sku: 'KHS-CD-002-MD', priceInr: 2800, stock: 250, status: 'ACTIVE', attrs: [{ name: 'Size', value: '250 g Tin' }] },
        ],
      },
      {
        name: 'Kerala Herbal Tea Sampler — 8 Blends',
        shortDescription: 'Curated sampler of 8 Kerala herbal teas: tulsi, moringa, ginger-turmeric, and more, 25 bags each.',
        fullDescription: 'Eight certified organic herbal blends, each in a 25-bag kraft-paper inner box, all housed in a branded slide-out tin. Blends include Tulsi-Lemon, Moringa-Mint, Ginger-Turmeric, and Ashwagandha Night.',
        wholesalePriceInr: 2600, moq: 10, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 600,
        categories: ['Organic Foods', 'Wellness & Ayurveda'], tags: ['herbal-tea', 'sampler', 'tulsi', 'kerala'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800', publicId: 'seed/khs-ht-003-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800', publicId: 'seed/khs-ht-003-b', position: 1 },
        ],
        variants: [
          { sku: 'KHS-HT-003-SS', priceInr: 2600, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Pack', value: 'Standard Sampler' }] },
          { sku: 'KHS-HT-003-WF', priceInr: 2800, stock: 150, status: 'ACTIVE', attrs: [{ name: 'Pack', value: 'Wellness Focus Pack' }] },
        ],
      },
      {
        name: 'Lakadong Organic Turmeric Powder',
        shortDescription: 'Lakadong variety organic turmeric powder, 6%+ curcumin content, 500 g kraft pouch.',
        fullDescription: 'Sourced exclusively from Lakadong farmers in Meghalaya — the highest-curcumin turmeric variety available. Min. 6% curcumin by HPLC. Stone-ground, no fillers. USDA Organic certified.',
        wholesalePriceInr: 680, moq: 24, leadTime: 'ONE_TO_THREE_DAYS', weightGrams: 560,
        categories: ['Organic Foods', 'Wellness & Ayurveda'], tags: ['turmeric', 'lakadong', 'curcumin', 'organic'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA', 'REST_OF_WORLD'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', publicId: 'seed/khs-tm-004-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', publicId: 'seed/khs-tm-004-b', position: 1 },
        ],
        variants: [
          { sku: 'KHS-TM-004-MD', priceInr: 680,  stock: 500, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '500 g' }] },
          { sku: 'KHS-TM-004-LG', priceInr: 1250, stock: 300, status: 'ACTIVE', attrs: [{ name: 'Weight', value: '1 kg' }] },
        ],
      },
      {
        name: 'Kerala Vanilla Beans Grade A',
        shortDescription: '10–12 premium Grade A Kerala vanilla beans, 16–18 cm long, oily and supple, 50 g pack.',
        fullDescription: 'Grown in Idukki under the shade of spice trees. Hand-pollinated and slow-cured for 6 months. Vanilla planifolia, Grade A: 14 cm+ length, 35%+ moisture, rich floral bouquet.',
        wholesalePriceInr: 3200, moq: 6, leadTime: 'ONE_TO_TWO_WEEKS', weightGrams: 80,
        categories: ['Organic Foods'], tags: ['vanilla', 'grade-a', 'kerala', 'beans', 'baking'],
        enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST', 'OCEANIA'],
        photos: [
          { url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800', publicId: 'seed/khs-vb-005-a', position: 0 },
          { url: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=800', publicId: 'seed/khs-vb-005-b', position: 1 },
        ],
        variants: [
          { sku: 'KHS-VB-005-SM', priceInr: 3200, stock: 200, status: 'ACTIVE', attrs: [{ name: 'Pack', value: '50 g (10–12 beans)' }] },
          { sku: 'KHS-VB-005-MD', priceInr: 6000, stock: 120, status: 'ACTIVE', attrs: [{ name: 'Pack', value: '100 g (22–24 beans)' }] },
        ],
      },
    ],
  },
];

// ─── Extra photos for padding products to minimum 4 ──────────────────────────

const EXTRA_PHOTOS = {
  'Home Decor': [
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
  ],
  'Kitchen & Dining': [
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
    'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800',
  ],
  'Handmade Textiles': [
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
    'https://images.unsplash.com/photo-1594938298603-c8148c4b2afa?w=800',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  ],
  'Handcrafted Furniture': [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800',
  ],
  'Jewelry & Accessories': [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
    'https://images.unsplash.com/photo-1573408301185-9519f94697c2?w=800',
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
  ],
  'Leather Goods': [
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    'https://images.unsplash.com/photo-1611010344444-5f9e4d86a6e1?w=800',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',
  ],
  'Organic Foods': [
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',
    'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800',
    'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=800',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
  ],
  'Wellness & Ayurveda': [
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800',
    'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=800',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800',
    'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800',
  ],
  'Gifts & Souvenirs': [
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800',
    'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800',
    'https://images.unsplash.com/photo-1513201099705-a9746072228c?w=800',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800',
  ],
  'Sustainable Products': [
    'https://images.unsplash.com/photo-1542601906897-ecd68e87f3f0?w=800',
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800',
    'https://images.unsplash.com/photo-1567761609153-87e6b28ed700?w=800',
  ],
}

const FALLBACK_EXTRAS = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
  'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?w=800',
  'https://images.unsplash.com/photo-1467043198406-dc953a3defa0?w=800',
  'https://images.unsplash.com/photo-1535913989690-f90e1c2d4cfa?w=800',
]

function padPhotos(photos, categories = []) {
  if (photos.length >= 4) return photos
  const result = [...photos]
  const pool = categories.flatMap((cat) => EXTRA_PHOTOS[cat] ?? [])
  const finalPool = pool.length > 0 ? pool : FALLBACK_EXTRAS
  let i = 0
  while (result.length < 4) {
    const pos = result.length
    result.push({
      url: finalPool[i % finalPool.length],
      publicId: `auto-pad-${pos}-${i}`,
      position: pos,
    })
    i++
  }
  return result
}

// ─── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Starting seed...\n');

  // ── 0. Wipe all existing data ──────────────────────────────────────────────
  console.log('🗑  Truncating all tables...');
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "VariantAttribute", "ProductVariant", "ProductPhoto",
      "CartItem", "Cart",
      "OrderItem", "Return", "ProductReview", "Message",
      "CollectionProduct", "Promotion", "Collection",
      "PromotedListing", "SavedProduct", "SavedBrand",
      "BuyerReferral", "UserShareLinkAttribution", "ShareLink",
      "WalletCredit", "Wallet", "Payout",
      "Order", "ShippingRate", "CrmContact", "ShopifyStore",
      "TeamMember", "BrandProfile", "BuyerProfile",
      "FxRateSnapshot", "Product", "User", "Category"
    RESTART IDENTITY CASCADE
  `);
  console.log('   Done.\n');

  // ── 1. Categories ──────────────────────────────────────────────────────────
  console.log('Seeding categories...');
  for (const cat of CATEGORIES_DATA) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, imageUrl: cat.imageUrl, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`  ✔ ${CATEGORIES_DATA.length} categories`);

  // ── 2. Admin user ──────────────────────────────────────────────────────────
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
  console.log('  ✔ Admin user');

  // ── 3. Sample buyer ────────────────────────────────────────────────────────
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
          categoryInterests: ['Home Decor', 'Jewelry & Accessories', 'Handmade Textiles'],
        },
      },
      wallet: { create: {} },
      cart: { create: {} },
    },
  });
  console.log('  ✔ Sample buyer');

  // ── 4. Brands + Products + Variants ───────────────────────────────────────
  console.log('\nSeeding brands, products, and variants...');

  let totalProducts = 0;
  let totalVariants = 0;
  let totalPhotos = 0;

  for (const brandData of BRANDS) {
    const { email, password, brandName, slug, products, city, achievementLevel, confirmedOrderCount, avgRating, ...brandFields } = brandData;

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
            achievementLevel,
            confirmedOrderCount,
            avgRating,
            countryOfOrigin: 'IN',
            approvedAt: new Date(),
            socialLinks: { instagram: `https://instagram.com/${brandFields.instagramHandle}` },
            ...brandFields,
          },
        },
      },
      include: { brandProfile: true },
    });

    const brand = user.brandProfile ?? await prisma.brandProfile.findUnique({ where: { userId: user.id } });

    console.log(`  Brand: ${brandName} (${city})`);

    for (const productData of products) {
      const { variants: variantDefs, photos, ...productFields } = productData;

      const productSlug = `${toSlug(productData.name)}-${brand.id.slice(-6)}`;

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

      // Photos — pad to minimum 4, delete and recreate for idempotency
      const paddedPhotos = padPhotos(photos ?? [], productData.categories ?? []);
      await prisma.productPhoto.deleteMany({ where: { productId: product.id } });
      await prisma.productPhoto.createMany({
        data: paddedPhotos.map((p) => ({ productId: product.id, url: p.url, publicId: p.publicId, position: p.position })),
      });
      totalPhotos += paddedPhotos.length;

      // Variants + VariantAttributes
      if (variantDefs && variantDefs.length > 0) {
        for (const v of variantDefs) {
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

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log('✅ Seed complete!\n');
  console.log(`  Categories : ${CATEGORIES_DATA.length}`);
  console.log(`  Brands     : ${BRANDS.length}`);
  console.log(`  Products   : ${totalProducts}`);
  console.log(`  Photos     : ${totalPhotos}`);
  console.log(`  Variants   : ${totalVariants}`);
  console.log('─'.repeat(50) + '\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
