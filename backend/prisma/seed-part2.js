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
const W3 = 'TWO_TO_FOUR_WEEKS';
const ACT = 'ACTIVE';
const p = (kw, s, i) => ({ url: `https://picsum.photos/seed/${s}/800/600`, publicId: `seed/ph${s}`, position: i });
const pics = (kw, s) => [p(kw,s,0), p(kw,s+1,1), p(kw,s+2,2), p(kw,s+3,3)];

const BRANDS = [

  // ── Brand 8: Pure Earth Organics — Food & Wellness (Snacks + Wellness) ───────
  {
    email: 'contact@pureearthorganics.com', password: 'Solomon@2025',
    brandName: 'Pure Earth Organics', slug: 'pure-earth-organics', city: 'Bengaluru', state: 'Karnataka',
    category: ['Food & Wellness'], description: 'Certified organic artisan snacks, sweets, wellness foods and superfoods from Bengaluru.',
    brandStory: 'Founded by nutritionist Kavitha Rao, Pure Earth sources directly from organic farmers across South India, producing small-batch snacks and wellness superfoods with no preservatives or artificial additives.',
    yearFounded: 2014, logoUrl: 'https://picsum.photos/seed/908/200/200', bannerUrl: 'https://picsum.photos/seed/958/1200/400',
    pickupPincode: '560001', instagramHandle: 'pureearthorganics',
    achievementLevel: 'L2_RISING', confirmedOrderCount: 125, avgRating: 4.7, minimumOrderValue: 5000,
    products: [
      // Snacks & Sweets
      { name: 'Roasted Makhana Artisan Snack', description: 'Certified organic makhana roasted with cold-pressed oils. Flavours: Himalayan salt, turmeric-pepper, spiced masala. 100g per pack. Vegan, gluten-free, no preservatives. Shelf life 6 months.',
        wholesalePriceInr: 220, moq: 48, leadTime: W2, weightGrams: 120, categories: ['Food & Wellness', 'Snacks & Sweets', 'Artisan Snacks'], tags: ['makhana', 'snack', 'organic', 'lotus-seeds'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('makhana,snack,organic,food', 405), variants: [
          {sku: 'PEO-SNK-001-HS', priceInr: 220, stock: 500, status: ACT, attrs: [{name: 'Flavour', value: 'Himalayan Salt'}]},
          {sku: 'PEO-SNK-001-MS', priceInr: 220, stock: 500, status: ACT, attrs: [{name: 'Flavour', value: 'Spiced Masala'}]} ] },
      { name: 'Organic Besan Ladoo Mithai', description: 'Traditional recipe: organic chickpea flour (besan) roasted in pure desi ghee, sweetened with unrefined jaggery. No refined sugar, no preservatives. 250g tin, approximately 10 ladoos. Shelf life 3 weeks.',
        wholesalePriceInr: 380, moq: 24, leadTime: W2, weightGrams: 280, categories: ['Food & Wellness', 'Snacks & Sweets', 'Mithai'], tags: ['ladoo', 'mithai', 'besan', 'jaggery'], enabledZones: ['DOMESTIC'],
        photos: pics('ladoo,mithai,sweet,indian', 409), variants: [{sku: 'PEO-MIT-002', priceInr: 380, stock: 200, status: ACT, attrs: [{name: 'Weight', value: '250g tin'}]}] },
      { name: 'Stone-Ground Dark Chocolate Bar', description: 'Two-ingredient bar: single-origin Kerala Theobroma cacao and coconut sugar. Stone-ground 72 hours for smooth texture. 70% cacao. Vegan, dairy-free, soy-free. 50g bar.',
        wholesalePriceInr: 180, moq: 48, leadTime: W2, weightGrams: 60, categories: ['Food & Wellness', 'Snacks & Sweets', 'Chocolates'], tags: ['chocolate', 'dark', 'single-origin', 'vegan'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('chocolate,dark,bar,organic', 413), variants: [{sku: 'PEO-CHC-003', priceInr: 180, stock: 600, status: ACT, attrs: [{name: 'Cacao', value: '70%'}]}] },
      { name: 'Ragi & Jaggery Cookies', description: 'Organic ragi flour, cold-pressed sesame oil, unrefined jaggery. No maida, no refined sugar. 12 cookies per pack, 200g. Vegan, gluten-free option available. Shelf life 1 month.',
        wholesalePriceInr: 220, moq: 36, leadTime: W2, weightGrams: 230, categories: ['Food & Wellness', 'Snacks & Sweets', 'Cookies & Biscuits'], tags: ['cookie', 'ragi', 'jaggery', 'millet'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('cookie,biscuit,organic,healthy', 417), variants: [{sku: 'PEO-COK-004', priceInr: 220, stock: 400, status: ACT, attrs: [{name: 'Size', value: '200g, 12 pieces'}]}] },
      { name: 'Mixed Seeds & Nut Energy Bar', description: 'No added sugar — sweetened only with Medjool dates. Organic pumpkin seeds, sunflower seeds, almonds, flaxseed. 45g bar. Vegan, gluten-free. 5g protein per bar. Shelf life 3 months.',
        wholesalePriceInr: 120, moq: 60, leadTime: W2, weightGrams: 55, categories: ['Food & Wellness', 'Snacks & Sweets', 'Energy Bars'], tags: ['energy-bar', 'seeds', 'vegan', 'no-added-sugar'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('energy,bar,seeds,nuts,healthy', 421), variants: [{sku: 'PEO-ENB-005', priceInr: 120, stock: 800, status: ACT, attrs: [{name: 'Weight', value: '45g bar'}]}] },
      { name: 'Spiced Roasted Cashew Mix', description: 'Organic W-320 cashews dry-roasted with black pepper, cumin and curry leaf — no oil, no gluten. 200g resealable bag. Vegan. Shelf life 4 months. FSSAI certified.',
        wholesalePriceInr: 420, moq: 24, leadTime: W2, weightGrams: 220, categories: ['Food & Wellness', 'Snacks & Sweets', 'Roasted Nuts'], tags: ['cashew', 'roasted', 'spiced', 'organic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('cashew,roasted,nuts,organic', 425), variants: [{sku: 'PEO-NUT-006', priceInr: 420, stock: 300, status: ACT, attrs: [{name: 'Weight', value: '200g'}]}] },
      // Wellness & Superfoods
      { name: 'Raw Forest Honey', description: 'Harvested from wild Nilgiri honey bees foraging on shola forest flowers. Unfiltered, unpasteurised. Contains natural pollen and propolis. 500g glass jar. FSSAI certified. Shelf life 24 months.',
        wholesalePriceInr: 480, moq: 24, leadTime: W2, weightGrams: 700, categories: ['Food & Wellness', 'Wellness & Superfoods', 'Honey & Syrups'], tags: ['honey', 'raw', 'forest', 'nilgiri'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('honey,raw,jar,organic', 429), variants: [{sku: 'PEO-HON-007', priceInr: 480, stock: 200, status: ACT, attrs: [{name: 'Weight', value: '500g'}]}] },
      { name: 'Cold-Pressed Virgin Coconut Oil', description: 'First-press coconut oil extracted at below 40°C from fresh-grated Kerala coconuts. No refining, bleaching or deodorising. 500ml glass bottle. Certified organic. Suitable for cooking and beauty use.',
        wholesalePriceInr: 380, moq: 24, leadTime: W2, weightGrams: 600, categories: ['Food & Wellness', 'Wellness & Superfoods', 'Cold-pressed Oils'], tags: ['coconut-oil', 'cold-pressed', 'virgin', 'kerala'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('coconut,oil,cold,pressed,organic', 433), variants: [{sku: 'PEO-OIL-008', priceInr: 380, stock: 250, status: ACT, attrs: [{name: 'Volume', value: '500ml'}]}] },
      { name: 'Cultured Desi Cow Ghee', description: 'Traditional bilona method: curd set from A2 Gir cow milk, hand-churned, then slow-cooked on wood fire. 300g glass jar. No additives. FSSAI certified. Shelf life 12 months unrefrigerated.',
        wholesalePriceInr: 750, moq: 12, leadTime: W2, weightGrams: 400, categories: ['Food & Wellness', 'Wellness & Superfoods', 'Artisan Ghee'], tags: ['ghee', 'bilona', 'a2', 'desi-cow'], enabledZones: ['DOMESTIC'],
        photos: pics('ghee,jar,golden,clarified', 437), variants: [{sku: 'PEO-GHE-009', priceInr: 750, stock: 150, status: ACT, attrs: [{name: 'Weight', value: '300g'}]}] },
      { name: 'Mixed Dry Fruits & Seeds Gift Box', description: 'Organic Afghan almonds, Kashmiri walnuts, Turkish figs and pumpkin seeds. No added sugar or sulfites. 400g gift box with compartments. FSSAI certified. Shelf life 6 months.',
        wholesalePriceInr: 680, moq: 12, leadTime: W2, weightGrams: 500, categories: ['Food & Wellness', 'Wellness & Superfoods', 'Dry Fruits & Seeds'], tags: ['dry-fruits', 'seeds', 'organic', 'gift'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('dry,fruits,nuts,seeds,organic', 441), variants: [{sku: 'PEO-DRF-010', priceInr: 680, stock: 180, status: ACT, attrs: [{name: 'Weight', value: '400g mix'}]}] },
      { name: 'Ashwagandha & Shatavari Adaptogen Blend', description: 'KSM-66 full-spectrum ashwagandha root extract blended with certified organic shatavari root powder. 100g resealable pouch. USDA Organic, FSSAI. Add to milk, smoothies or golden milk.',
        wholesalePriceInr: 520, moq: 24, leadTime: W2, weightGrams: 120, categories: ['Food & Wellness', 'Wellness & Superfoods', 'Adaptogens'], tags: ['ashwagandha', 'adaptogen', 'ayurvedic', 'organic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('ashwagandha,herb,powder,adaptogen', 445), variants: [{sku: 'PEO-ADP-011', priceInr: 520, stock: 300, status: ACT, attrs: [{name: 'Weight', value: '100g'}]}] },
    ],
  },

  // ── Brand 9: Kochi Herb & Spice Co. — Food & Wellness (Teas + Spices) ────────
  {
    email: 'contact@kochiherbspice.com', password: 'Solomon@2025',
    brandName: 'Kochi Herb & Spice Co.', slug: 'kochi-herb-spice-co', city: 'Kochi', state: 'Kerala',
    category: ['Food & Wellness'], description: 'Kerala tea estate and spice farm offering premium teas, whole spices and artisan condiments.',
    brandStory: 'Rooted in Munnar tea gardens and Wayanad spice farms, the Menon family has been supplying wholesale buyers in 20+ countries since 1990. We own the farms, control the process and deal directly — no middlemen.',
    yearFounded: 1990, logoUrl: 'https://picsum.photos/seed/909/200/200', bannerUrl: 'https://picsum.photos/seed/959/1200/400',
    pickupPincode: '682001', instagramHandle: 'kochiherbspice',
    achievementLevel: 'L4_ELITE', confirmedOrderCount: 680, avgRating: 4.9, minimumOrderValue: 8000,
    products: [
      // Teas & Infusions
      { name: 'Munnar Nilgiri First Flush Loose Leaf Tea', description: 'Handpicked first flush from our Munnar estate at 1800m altitude. Bright amber liquor with muscatel and floral notes. 100g kraft pouch. Loose leaf, no staples. Rainforest Alliance certified.',
        wholesalePriceInr: 380, moq: 24, leadTime: W2, weightGrams: 120, categories: ['Food & Wellness', 'Teas & Infusions', 'Loose Leaf Tea'], tags: ['tea', 'nilgiri', 'first-flush', 'black-tea'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('tea,loose,leaf,black', 449), variants: [{sku: 'KHS-TEA-001', priceInr: 380, stock: 400, status: ACT, attrs: [{name: 'Weight', value: '100g'}]}] },
      { name: 'Kerala Masala Chai Blend', description: 'Family recipe: Assam CTC tea with freshly ground cardamom, cinnamon, ginger, black pepper, cloves, star anise and fennel. 200g resealable tin. Makes 80 cups. FSSAI certified.',
        wholesalePriceInr: 480, moq: 24, leadTime: W2, weightGrams: 230, categories: ['Food & Wellness', 'Teas & Infusions', 'Masala Chai'], tags: ['masala-chai', 'spice', 'tea', 'kerala'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('masala,chai,tea,spice,india', 453), variants: [{sku: 'KHS-CHA-002', priceInr: 480, stock: 350, status: ACT, attrs: [{name: 'Weight', value: '200g tin'}]}] },
      { name: 'Tulsi & Ginger Herbal Infusion', description: 'Certified organic holy basil (tulsi) leaf and dried ginger root. No black tea, caffeine-free. 20 pyramid biodegradable bags. USDA Organic, FSSAI. Steep 5–7 min in boiling water.',
        wholesalePriceInr: 280, moq: 48, leadTime: W2, weightGrams: 80, categories: ['Food & Wellness', 'Teas & Infusions', 'Herbal Infusions'], tags: ['herbal', 'tulsi', 'ginger', 'caffeine-free'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('herbal,tea,tulsi,ginger,organic', 457), variants: [{sku: 'KHS-HRB-003', priceInr: 280, stock: 500, status: ACT, attrs: [{name: 'Count', value: '20 bags'}]}] },
      { name: 'Organic Nilgiri Green Tea', description: 'Organic Nilgiri green tea leaves hand-rolled into tight pellets (gunpowder style). Sweet, grassy with nutty finish. 100g kraft pouch. USDA Organic, FSSAI. Steep at 75°C for 2–3 min.',
        wholesalePriceInr: 420, moq: 24, leadTime: W2, weightGrams: 120, categories: ['Food & Wellness', 'Teas & Infusions', 'Green Tea'], tags: ['green-tea', 'organic', 'nilgiri', 'gunpowder'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('green,tea,leaf,organic,cup', 461), variants: [{sku: 'KHS-GRN-004', priceInr: 420, stock: 350, status: ACT, attrs: [{name: 'Weight', value: '100g'}]}] },
      { name: 'Darjeeling White Tea Silver Needles', description: 'Handpicked single buds from Darjeeling gardens at 2000m. One of India\'s rarest white teas. Delicate floral and honey notes. 25g elegant glass jar. Steep at 70°C for 3–4 min.',
        wholesalePriceInr: 680, moq: 12, leadTime: W2, weightGrams: 50, categories: ['Food & Wellness', 'Teas & Infusions', 'White Tea'], tags: ['white-tea', 'silver-needles', 'darjeeling', 'premium'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('white,tea,silver,needle,delicate', 465), variants: [{sku: 'KHS-WHT-005', priceInr: 680, stock: 200, status: ACT, attrs: [{name: 'Weight', value: '25g'}]}] },
      { name: 'Cardamom & Rose Chai Blend', description: 'Assam CTC tea blended with whole green cardamom, dried rose petals, dried rose buds and a touch of saffron. 150g resealable kraft bag. Makes 60 cups. FSSAI certified.',
        wholesalePriceInr: 380, moq: 24, leadTime: W2, weightGrams: 170, categories: ['Food & Wellness', 'Teas & Infusions', 'Chai Blends'], tags: ['chai', 'cardamom', 'rose', 'saffron'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('chai,rose,cardamom,tea,blend', 469), variants: [{sku: 'KHS-CHB-006', priceInr: 380, stock: 400, status: ACT, attrs: [{name: 'Weight', value: '150g'}]}] },
      // Spices & Condiments
      { name: 'Kerala Whole Spice Gift Tin', description: 'Six resealable compartments: green cardamom (30g), Tellicherry black pepper (30g), Mysore cloves (30g), Ceylon cinnamon quills (30g), star anise (30g), fennel seeds (30g). Gift tin. FSSAI certified.',
        wholesalePriceInr: 650, moq: 12, leadTime: W2, weightGrams: 400, categories: ['Food & Wellness', 'Spices & Condiments', 'Whole Spices'], tags: ['whole-spice', 'kerala', 'gift-tin', 'cardamom'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('spice,whole,cardamom,pepper,india', 473), variants: [{sku: 'KHS-SPC-007', priceInr: 650, stock: 200, status: ACT, attrs: [{name: 'Contents', value: '6 spices × 30g'}]}] },
      { name: 'Organic Turmeric Powder', description: 'Lakadong variety from Meghalaya — among the world\'s highest curcumin content (>5%). Single-origin, cold-milled. 200g resealable glass jar. USDA Organic, FSSAI certified.',
        wholesalePriceInr: 320, moq: 36, leadTime: W2, weightGrams: 230, categories: ['Food & Wellness', 'Spices & Condiments', 'Ground Spices'], tags: ['turmeric', 'lakadong', 'organic', 'curcumin'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('turmeric,powder,spice,organic,yellow', 477), variants: [{sku: 'KHS-TUR-008', priceInr: 320, stock: 400, status: ACT, attrs: [{name: 'Weight', value: '200g'}]}] },
      { name: 'Chettinad Spice Blend', description: 'Traditional Chettinad recipe: 18 hand-ground spices including kalpasi, marathi mokku, star anise, kola podi and Tellicherry pepper. No salt, no fillers. 100g pouch. FSSAI certified.',
        wholesalePriceInr: 280, moq: 36, leadTime: W2, weightGrams: 120, categories: ['Food & Wellness', 'Spices & Condiments', 'Spice Blends'], tags: ['spice-blend', 'chettinad', 'masala', 'south-india'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('spice,blend,masala,india,aromatic', 481), variants: [{sku: 'KHS-MAS-009', priceInr: 280, stock: 350, status: ACT, attrs: [{name: 'Weight', value: '100g'}]}] },
      { name: 'Kerala Raw Mango Pickle', description: 'Raw Kerala Moovandan mangoes cut and pickled in cold-pressed sesame oil with mustard, chilli, fenugreek and turmeric. No preservatives, no artificial colour. 250g glass jar. Shelf life 12 months.',
        wholesalePriceInr: 220, moq: 36, leadTime: W2, weightGrams: 350, categories: ['Food & Wellness', 'Spices & Condiments', 'Pickles'], tags: ['pickle', 'mango', 'kerala', 'sesame-oil'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('pickle,mango,jar,india,spicy', 485), variants: [{sku: 'KHS-PCK-010', priceInr: 220, stock: 300, status: ACT, attrs: [{name: 'Weight', value: '250g'}]}] },
      { name: 'Green Coconut Chutney Paste', description: 'Fresh grated coconut, green chillies, coriander, ginger and mustard — blended and packed without preservatives. 200g glass jar. Refrigerate after opening; use within 30 days. FSSAI certified.',
        wholesalePriceInr: 180, moq: 48, leadTime: W2, weightGrams: 250, categories: ['Food & Wellness', 'Spices & Condiments', 'Chutneys & Sauces'], tags: ['chutney', 'coconut', 'fresh', 'green'], enabledZones: ['DOMESTIC'],
        photos: pics('chutney,coconut,green,sauce,india', 489), variants: [{sku: 'KHS-CHT-011', priceInr: 180, stock: 300, status: ACT, attrs: [{name: 'Weight', value: '200g'}]}] },
      { name: 'Kerala Coconut Curry Paste', description: 'Roasted coconut, Kerala red chillies, coriander, turmeric and tamarind blended into a paste. No water-based fillers. 200g glass jar, heat-sealed. Shelf life 6 months unrefrigerated. FSSAI certified.',
        wholesalePriceInr: 240, moq: 36, leadTime: W2, weightGrams: 280, categories: ['Food & Wellness', 'Spices & Condiments', 'Curry Pastes'], tags: ['curry-paste', 'coconut', 'kerala', 'masala'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('curry,paste,jar,indian,spice', 493), variants: [{sku: 'KHS-CRP-012', priceInr: 240, stock: 250, status: ACT, attrs: [{name: 'Weight', value: '200g'}]}] },
    ],
  },

  // ── Brand 10: Mithila Art Studio — Art & Craft Objects (all 14 L3s) ──────────
  {
    email: 'contact@mithilaartstudio.com', password: 'Solomon@2025',
    brandName: 'Mithila Art Studio', slug: 'mithila-art-studio', city: 'Patna', state: 'Bihar',
    category: ['Art & Craft Objects'], description: 'Patna studio producing original Madhubani, Warli and folk art, plus contemporary wall art and sculpture.',
    brandStory: 'Meera Devi and her collective of 25 women artists in Madhubani, Bihar, create museum-quality folk paintings. We also collaborate with contemporary Indian artists for limited-edition prints, photography and sculpture.',
    yearFounded: 2001, logoUrl: 'https://picsum.photos/seed/910/200/200', bannerUrl: 'https://picsum.photos/seed/960/1200/400',
    pickupPincode: '800001', instagramHandle: 'mithilaartstudio',
    achievementLevel: 'L3_TRUSTED', confirmedOrderCount: 195, avgRating: 4.8, minimumOrderValue: 10000,
    products: [
      // Wall Art
      { name: 'Gond Inspired Acrylic Painting — Original', description: 'Original work by Patna-based artist Priya Sahu. Acrylic on stretched canvas, Gond-inspired dot-work animals in vibrant primary colours. 24×36 in., signed and certificate of authenticity. Ready to hang.',
        wholesalePriceInr: 8500, moq: 1, leadTime: W3, weightGrams: 1200, categories: ['Art & Craft Objects', 'Wall Art', 'Original Paintings'], tags: ['original', 'painting', 'gond', 'acrylic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('gond,painting,art,acrylic', 497), variants: [{sku: 'MAS-OPT-001', priceInr: 8500, stock: 5, status: ACT, attrs: [{name: 'Size', value: '24×36 in'}]}] },
      { name: 'Madhubani Limited Edition Giclee Print', description: 'Museum-quality giclee archival print on 300gsm cotton rag paper. Reproduced from original Madhubani artwork by Meera Devi. Edition of 50, numbered and hand-signed. 12×18 in.',
        wholesalePriceInr: 2800, moq: 4, leadTime: W2, weightGrams: 200, categories: ['Art & Craft Objects', 'Wall Art', 'Limited Edition Prints'], tags: ['print', 'madhubani', 'limited-edition', 'giclee'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('madhubani,print,limited,edition', 501), variants: [{sku: 'MAS-LEP-002', priceInr: 2800, stock: 50, status: ACT, attrs: [{name: 'Edition', value: 'Ed. of 50, signed'}]}] },
      { name: 'Village Life Photography Print', description: 'Shot on film by photojournalist Arjun Mehta in rural Bihar. Archival inkjet on 300gsm cotton rag. Open edition. 16×20 in., printed to order. Unframed, ships rolled in tube.',
        wholesalePriceInr: 1800, moq: 3, leadTime: W2, weightGrams: 100, categories: ['Art & Craft Objects', 'Wall Art', 'Photography'], tags: ['photography', 'print', 'bihar', 'village'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('photography,print,village,india', 505), variants: [{sku: 'MAS-PHT-003', priceInr: 1800, stock: 30, status: ACT, attrs: [{name: 'Size', value: '16×20 in'}]}] },
      { name: 'Kantha & Ink Mixed Media Canvas', description: 'Original mixed media: India ink botanical drawing on cotton canvas with kantha-stitch embroidery overlay. One-of-a-kind piece. 18×24 in. Signed by artist. Ready to hang on wooden stretcher.',
        wholesalePriceInr: 6500, moq: 1, leadTime: W3, weightGrams: 800, categories: ['Art & Craft Objects', 'Wall Art', 'Mixed Media'], tags: ['mixed-media', 'kantha', 'ink', 'original'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('mixed,media,art,canvas,kantha', 509), variants: [{sku: 'MAS-MXM-004', priceInr: 6500, stock: 5, status: ACT, attrs: [{name: 'Size', value: '18×24 in, original'}]}] },
      // Folk & Tribal Art
      { name: 'Original Madhubani Painting — Fish Bride', description: 'Hand-painted by Meera Devi using natural pigments on handmade paper. Traditional fish-bride (machhli dulha) motif — a favourite Madhubani narrative. 12×18 in. Signed. Certificate of authenticity.',
        wholesalePriceInr: 4500, moq: 1, leadTime: W3, weightGrams: 100, categories: ['Art & Craft Objects', 'Folk & Tribal Art', 'Madhubani Paintings'], tags: ['madhubani', 'original', 'handmade-paper', 'folk-art'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('madhubani,painting,folk,india,original', 513), variants: [{sku: 'MAS-MDH-005', priceInr: 4500, stock: 10, status: ACT, attrs: [{name: 'Size', value: '12×18 in'}]}] },
      { name: 'Warli Village Scene on Handmade Paper', description: 'Authentic Warli tribal art from Palghar, Maharashtra. Painted in white pigment on hand-made brown khadi paper. Community dance (tarpa) scene. A3 size (29.7×42 cm). Signed. Rolled in protective tube.',
        wholesalePriceInr: 3200, moq: 2, leadTime: W3, weightGrams: 80, categories: ['Art & Craft Objects', 'Folk & Tribal Art', 'Warli Art'], tags: ['warli', 'tribal', 'folk-art', 'handmade-paper'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('warli,art,tribal,india,painting', 517), variants: [{sku: 'MAS-WAR-006', priceInr: 3200, stock: 15, status: ACT, attrs: [{name: 'Size', value: 'A3'}]}] },
      { name: 'Gond Tree of Life Painting', description: 'Gond art from Mandla, Madhya Pradesh. Acrylic on canvas using traditional dot-and-line technique. Tree of life with peacocks and parrots. 18×24 in. Signed by artist Rupa Bai.',
        wholesalePriceInr: 5500, moq: 1, leadTime: W3, weightGrams: 900, categories: ['Art & Craft Objects', 'Folk & Tribal Art', 'Gond Paintings'], tags: ['gond', 'tree-of-life', 'tribal', 'dot-work'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('gond,tree,life,painting,tribal', 521), variants: [{sku: 'MAS-GND-007', priceInr: 5500, stock: 8, status: ACT, attrs: [{name: 'Size', value: '18×24 in'}]}] },
      { name: 'Pattachitra Radha Krishna Scroll', description: 'Authentic Odisha pattachitra on specially prepared cloth (chitru) with chalk paste base. Radha-Krishna in forest scene. Natural pigments, mineral colours. 12×30 in. Signed. Shipped rolled.',
        wholesalePriceInr: 6500, moq: 1, leadTime: W3, weightGrams: 150, categories: ['Art & Craft Objects', 'Folk & Tribal Art', 'Pattachitra'], tags: ['pattachitra', 'odisha', 'radha-krishna', 'folk-art'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('pattachitra,painting,odisha,india', 525), variants: [{sku: 'MAS-PAT-008', priceInr: 6500, stock: 6, status: ACT, attrs: [{name: 'Size', value: '12×30 in'}]}] },
      { name: 'Pichwai Lord Krishna with Cows', description: 'Nathdwara-style Pichwai: intricate mineral colour painting on specially treated cotton cloth. Lord Krishna tending cows — a classic Pichwai subject. 18×24 in. Signed, authenticity certificate.',
        wholesalePriceInr: 9500, moq: 1, leadTime: W3, weightGrams: 300, categories: ['Art & Craft Objects', 'Folk & Tribal Art', 'Pichwai'], tags: ['pichwai', 'krishna', 'nathdwara', 'folk-art'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('pichwai,painting,krishna,india', 529), variants: [{sku: 'MAS-PIW-009', priceInr: 9500, stock: 4, status: ACT, attrs: [{name: 'Size', value: '18×24 in'}]}] },
      { name: 'Tanjore Lakshmi Gold-Leaf Panel', description: 'Tamil Nadu Tanjore technique: gesso relief, 24k gold leaf and crushed semi-precious stones. Goddess Lakshmi with lotuses. 12×18 in. Teak frame included. Certificate of authenticity.',
        wholesalePriceInr: 12000, moq: 1, leadTime: W3, weightGrams: 1500, categories: ['Art & Craft Objects', 'Folk & Tribal Art', 'Tanjore Paintings'], tags: ['tanjore', 'gold-leaf', 'lakshmi', 'traditional'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('tanjore,painting,gold,temple,india', 533), variants: [{sku: 'MAS-TAJ-010', priceInr: 12000, stock: 5, status: ACT, attrs: [{name: 'Size', value: '12×18 in, framed'}]}] },
      // Sculpture & Objects
      { name: 'Dokra Brass Tribal Figurine', description: 'Lost-wax (cire perdue) cast dokra brass figurine from Bastar, Chhattisgarh. Woman with water pot on head. 20 cm tall. Antique patina finish. Each piece is unique — slight variations are authentic.',
        wholesalePriceInr: 2800, moq: 4, leadTime: W3, weightGrams: 600, categories: ['Art & Craft Objects', 'Sculpture & Objects', 'Figurines & Statues'], tags: ['figurine', 'dokra', 'brass', 'tribal'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('dokra,figurine,brass,tribal,india', 537), variants: [{sku: 'MAS-FIG-011', priceInr: 2800, stock: 25, status: ACT, attrs: [{name: 'Height', value: '20 cm'}]}] },
      { name: 'Papier-Mâché Decorative Bowl', description: 'Kashmiri papier-mâché bowl hand-built from recycled paper pulp, then hand-painted with intricate floral chinar patterns. Lacquer-sealed finish. 25 cm diameter. Decorative use only.',
        wholesalePriceInr: 1400, moq: 8, leadTime: W3, weightGrams: 300, categories: ['Art & Craft Objects', 'Sculpture & Objects', 'Decorative Objects'], tags: ['papier-mache', 'kashmir', 'decorative', 'hand-painted'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('papier,mache,bowl,kashmir,painted', 541), variants: [{sku: 'MAS-DCO-012', priceInr: 1400, stock: 40, status: ACT, attrs: [{name: 'Diameter', value: '25 cm'}]}] },
      { name: 'Cast Aluminium Abstract Sculpture', description: 'Cast and hand-finished by contemporary sculptor from Bengaluru. Freeform organic shape in polished-and-brushed aluminium. 30 cm tall. 1kg. Felt base. Certificate of authenticity.',
        wholesalePriceInr: 4500, moq: 2, leadTime: W3, weightGrams: 1000, categories: ['Art & Craft Objects', 'Sculpture & Objects', 'Abstract Sculpture'], tags: ['sculpture', 'abstract', 'aluminium', 'contemporary'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('abstract,sculpture,metal,art', 545), variants: [{sku: 'MAS-ABS-013', priceInr: 4500, stock: 10, status: ACT, attrs: [{name: 'Height', value: '30 cm'}]}] },
      { name: 'Puja Bell & Incense Stand Set', description: 'Solid brass puja bell with hand-engraved floral band, wooden handle. Matching incense stand with five incense holes. Traditional Hindu puja set. Bell 15 cm tall, stand 10 cm. Velvet-lined gift box.',
        wholesalePriceInr: 1800, moq: 6, leadTime: W2, weightGrams: 600, categories: ['Art & Craft Objects', 'Sculpture & Objects', 'Ceremonial Objects'], tags: ['puja', 'brass', 'bell', 'incense'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('puja,brass,bell,ceremonial,india', 549), variants: [{sku: 'MAS-CER-014', priceInr: 1800, stock: 50, status: ACT, attrs: [{name: 'Metal', value: 'Solid Brass'}]}] },
    ],
  },

  // ── Brand 11: Jaipur Apparel House — Apparel & Clothing (all 23 L3s) ─────────
  {
    email: 'contact@jaipurapparelhouse.com', password: 'Solomon@2025',
    brandName: 'Jaipur Apparel House', slug: 'jaipur-apparel-house', city: 'Jaipur', state: 'Rajasthan',
    category: ['Apparel & Clothing'], description: 'Jaipur wholesale apparel brand covering tops, bottoms, suits, outerwear and loungewear in natural fabrics.',
    brandStory: 'Supplying boutiques in Europe and North America since 2005, we work with 60 tailors and block-printers in Jaipur to produce ready-to-retail women\'s and men\'s apparel in cotton, linen, khadi and silk.',
    yearFounded: 2005, logoUrl: 'https://picsum.photos/seed/911/200/200', bannerUrl: 'https://picsum.photos/seed/961/1200/400',
    pickupPincode: '302016', instagramHandle: 'jaipurapparelhouse',
    achievementLevel: 'L4_ELITE', confirmedOrderCount: 560, avgRating: 4.8, minimumOrderValue: 15000,
    products: [
      // Tops
      { name: 'Sanganeri Block-Print Cotton Kurti', description: 'Sanganeri block-print on 180TC cotton. A-line cut, round neck, three-quarter sleeves. Side pockets. Machine washable. Sizes XS–3XL. Sold individually.',
        wholesalePriceInr: 780, moq: 12, leadTime: W2, weightGrams: 280, categories: ['Apparel & Clothing', 'Tops', 'Kurtis'], tags: ['kurti', 'blockprint', 'cotton', 'women'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('kurti,blockprint,women,india', 553), variants: [
          {sku: 'JAH-KRT-001-S', priceInr: 780, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'S'}, {name: 'Color', value: 'Indigo Floral'}]},
          {sku: 'JAH-KRT-001-M', priceInr: 780, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'M'}, {name: 'Color', value: 'Indigo Floral'}]} ] },
      { name: 'Chikankari Embroidered Cotton Blouse', description: 'White-on-white chikankari embroidery on 100% cotton. Regular fit with hook-and-eye back closure. Suitable as standalone top or under sheer overlay. Dry clean recommended. Sizes XS–2XL.',
        wholesalePriceInr: 1200, moq: 8, leadTime: W3, weightGrams: 220, categories: ['Apparel & Clothing', 'Tops', 'Blouses'], tags: ['blouse', 'chikankari', 'embroidered', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('blouse,embroidered,white,women', 557), variants: [
          {sku: 'JAH-BLS-002-S', priceInr: 1200, stock: 80, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-BLS-002-M', priceInr: 1200, stock: 80, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Handwoven Khadi Men\'s Shirt', description: 'Handwoven KVIC-certified khadi cotton men\'s shirt, relaxed fit, sizes S–XXL.',
        wholesalePriceInr: 1400, moq: 8, leadTime: W2, weightGrams: 350, categories: ['Apparel & Clothing', 'Tops', 'Shirts'], tags: ['shirt', 'khadi', 'handwoven', 'men'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('shirt,khadi,handwoven,men,india', 561), variants: [
          {sku: 'JAH-SHT-003-S', priceInr: 1400, stock: 80, status: ACT, attrs: [{name: 'Size', value: 'S'}, {name: 'Color', value: 'Natural White'}]},
          {sku: 'JAH-SHT-003-M', priceInr: 1400, stock: 80, status: ACT, attrs: [{name: 'Size', value: 'M'}, {name: 'Color', value: 'Natural White'}]} ] },
      { name: 'Dabu-Print Linen Tunic', description: 'Dabu printing on 55% linen 45% cotton blend. Longline tunic (hip length), V-neck, half-sleeve, side slits. Machine wash cold. Unique crackled resist pattern on each piece. Sizes XS–2XL.',
        wholesalePriceInr: 1100, moq: 10, leadTime: W2, weightGrams: 300, categories: ['Apparel & Clothing', 'Tops', 'Tunics'], tags: ['tunic', 'dabu', 'linen', 'blockprint'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('tunic,linen,blockprint,women', 565), variants: [
          {sku: 'JAH-TUN-004-S', priceInr: 1100, stock: 80, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-TUN-004-M', priceInr: 1100, stock: 80, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Mirror-Work Embroidered Crop Top', description: 'Kutch mirror-work (shisha) embroidery on natural cotton. Boxy cropped fit, square neck, short sleeve. Pair with palazzos or skirts. Dry clean recommended. Sizes XS–XL.',
        wholesalePriceInr: 1600, moq: 8, leadTime: W3, weightGrams: 200, categories: ['Apparel & Clothing', 'Tops', 'Crop Tops'], tags: ['crop-top', 'mirror-work', 'kutch', 'embroidered'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('crop,top,embroidered,mirror,india', 569), variants: [
          {sku: 'JAH-CRP-005-S', priceInr: 1600, stock: 70, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-CRP-005-M', priceInr: 1600, stock: 70, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Kantha-Stitch Peplum Top', description: 'Peplum silhouette cut from kantha-stitched vintage cotton. Each top is unique — slight pattern variation is a feature. Scoop neck, short sleeve. Dry clean. Sizes XS–XL.',
        wholesalePriceInr: 1800, moq: 6, leadTime: W3, weightGrams: 250, categories: ['Apparel & Clothing', 'Tops', 'Peplum Tops'], tags: ['peplum', 'kantha', 'vintage-cotton', 'women'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('peplum,top,kantha,women,fashion', 573), variants: [
          {sku: 'JAH-PEP-006-S', priceInr: 1800, stock: 60, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-PEP-006-M', priceInr: 1800, stock: 60, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      // Bottoms
      { name: 'Block-Print Cotton Palazzo Pants', description: 'Sanganeri block-print on 160TC cotton. Wide-leg palazzo silhouette, elasticated waist, side pockets. Machine washable. Sizes XS–3XL. Sold individually.',
        wholesalePriceInr: 850, moq: 12, leadTime: W2, weightGrams: 320, categories: ['Apparel & Clothing', 'Bottoms', 'Palazzos'], tags: ['palazzo', 'blockprint', 'cotton', 'wide-leg'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('palazzo,pants,blockprint,women', 577), variants: [
          {sku: 'JAH-PAL-007-S', priceInr: 850, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-PAL-007-M', priceInr: 850, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Handwoven Cotton Salwar Pants', description: 'Traditional salwar cut in handwoven 100% cotton. Drawstring waist, full taper to ankle cuffs. Deep pockets. Machine washable. Natural undyed. Sizes XS–2XL.',
        wholesalePriceInr: 700, moq: 12, leadTime: W2, weightGrams: 300, categories: ['Apparel & Clothing', 'Bottoms', 'Salwars'], tags: ['salwar', 'handwoven', 'cotton', 'drawstring'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('salwar,pants,cotton,women,india', 581), variants: [
          {sku: 'JAH-SAL-008-S', priceInr: 700, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-SAL-008-M', priceInr: 700, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Wide-Leg Linen-Cotton Trousers', description: '55% linen 45% cotton blend. Wide-leg cut, smocked elasticated waist, side pockets. Ankle length. Machine wash cold. Sizes XS–2XL. Available in 4 neutral colours.',
        wholesalePriceInr: 980, moq: 10, leadTime: W2, weightGrams: 350, categories: ['Apparel & Clothing', 'Bottoms', 'Trousers'], tags: ['trousers', 'linen', 'wide-leg', 'smocked'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('trousers,linen,wide,leg,women', 585), variants: [
          {sku: 'JAH-TRS-009-S', priceInr: 980, stock: 90, status: ACT, attrs: [{name: 'Size', value: 'S'}, {name: 'Color', value: 'Natural'}]},
          {sku: 'JAH-TRS-009-M', priceInr: 980, stock: 90, status: ACT, attrs: [{name: 'Size', value: 'M'}, {name: 'Color', value: 'Natural'}]} ] },
      { name: 'Ajrakh-Print Cotton Midi Skirt', description: 'Traditional ajrakh print on 180TC cotton. A-line midi length (below knee), elasticated waistband, two deep pockets. Machine wash cold. Sizes XS–2XL.',
        wholesalePriceInr: 900, moq: 10, leadTime: W2, weightGrams: 350, categories: ['Apparel & Clothing', 'Bottoms', 'Skirts'], tags: ['skirt', 'ajrakh', 'midi', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('skirt,midi,blockprint,cotton,women', 589), variants: [
          {sku: 'JAH-SKT-010-S', priceInr: 900, stock: 90, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-SKT-010-M', priceInr: 900, stock: 90, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Cotton Churidar Leggings', description: '95% cotton 5% lycra churidar leggings. Ankle-length with traditional gathered calf. Elasticated waist. Machine washable. Available in 8 solid colours. Sizes XS–3XL.',
        wholesalePriceInr: 380, moq: 24, leadTime: W2, weightGrams: 200, categories: ['Apparel & Clothing', 'Bottoms', 'Leggings'], tags: ['leggings', 'churidar', 'cotton', 'stretch'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('leggings,churidar,cotton,women,india', 593), variants: [
          {sku: 'JAH-LEG-011-S-BK', priceInr: 380, stock: 200, status: ACT, attrs: [{name: 'Size', value: 'S'}, {name: 'Color', value: 'Black'}]},
          {sku: 'JAH-LEG-011-M-BK', priceInr: 380, stock: 200, status: ACT, attrs: [{name: 'Size', value: 'M'}, {name: 'Color', value: 'Black'}]} ] },
      // Sets & Suits
      { name: 'Chikankari Cotton Salwar Suit Set', description: 'White-on-white chikankari embroidery on muslin. 3-piece set: A-line kurta (knee-length) + straight salwar + sheer dupatta. Hook-and-eye closure. Dry clean. Sizes XS–2XL.',
        wholesalePriceInr: 3800, moq: 4, leadTime: W3, weightGrams: 700, categories: ['Apparel & Clothing', 'Sets & Suits', 'Salwar Suits'], tags: ['salwar-suit', 'chikankari', '3-piece', 'embroidered'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('salwar,suit,chikankari,women,india', 597), variants: [
          {sku: 'JAH-SLS-012-S', priceInr: 3800, stock: 50, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-SLS-012-M', priceInr: 3800, stock: 50, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Linen Kurta & Palazzo Co-ord Set', description: '55% linen 45% cotton blend. Longline kurta (calf length) with mandarin collar + wide-leg palazzo. Indigo stripe print. Machine wash cold. Sizes XS–2XL.',
        wholesalePriceInr: 2200, moq: 6, leadTime: W2, weightGrams: 650, categories: ['Apparel & Clothing', 'Sets & Suits', 'Kurta Sets'], tags: ['kurta-set', 'linen', 'palazzo', '2-piece'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('kurta,set,linen,palazzo,women', 601), variants: [
          {sku: 'JAH-KTS-013-S', priceInr: 2200, stock: 70, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-KTS-013-M', priceInr: 2200, stock: 70, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Block-Print Co-ord Set', description: 'Matching block-print crop top and high-waist wide-leg pants in Sanganeri floral print on cotton. Crop top with tie front. Pants with elasticated waist. Machine washable. Sizes XS–XL.',
        wholesalePriceInr: 2800, moq: 5, leadTime: W2, weightGrams: 500, categories: ['Apparel & Clothing', 'Sets & Suits', 'Co-ord Sets'], tags: ['co-ord', 'blockprint', 'crop', 'wide-leg'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('coord,set,blockprint,crop,women', 605), variants: [
          {sku: 'JAH-COS-014-S', priceInr: 2800, stock: 60, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-COS-014-M', priceInr: 2800, stock: 60, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Bandhani Lehenga Set (3-piece)', description: 'Traditional Rajasthani bandhani tie-dye on georgette. 3-piece: A-line lehenga + matching blouse with hook-and-eye + dupatta. Flared lehenga, fully lined. Sizes XS–L. Semi-stitched.',
        wholesalePriceInr: 4500, moq: 3, leadTime: W3, weightGrams: 1000, categories: ['Apparel & Clothing', 'Sets & Suits', 'Lehenga Sets'], tags: ['lehenga', 'bandhani', '3-piece', 'bridal'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('lehenga,bandhani,india,bridal,set', 609), variants: [
          {sku: 'JAH-LEH-015-S', priceInr: 4500, stock: 30, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-LEH-015-M', priceInr: 4500, stock: 30, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      // Outerwear
      { name: 'Reversible Kantha Quilted Jacket', description: 'Two-layer vintage sari cotton panels kantha-stitched together — one side floral, reverse side geometric. Zip front. Two pockets. Unisex fit. Machine wash cold. Sizes XS–XL.',
        wholesalePriceInr: 3200, moq: 4, leadTime: W3, weightGrams: 700, categories: ['Apparel & Clothing', 'Outerwear', 'Jackets'], tags: ['jacket', 'kantha', 'quilted', 'reversible'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('jacket,kantha,quilted,reversible', 613), variants: [
          {sku: 'JAH-JAK-016-S', priceInr: 3200, stock: 50, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-JAK-016-M', priceInr: 3200, stock: 50, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Merino-Pashmina Embroidered Shawl', description: '70% merino 30% pashmina blend, lightweight yet warm. Hand needle-embroidered paisley border in silk thread — sozni style. 28×80 in. Fringe ends. Dry clean. Comes in ivory, beige, blush.',
        wholesalePriceInr: 4800, moq: 4, leadTime: W3, weightGrams: 500, categories: ['Apparel & Clothing', 'Outerwear', 'Shawls & Wraps'], tags: ['shawl', 'pashmina', 'merino', 'embroidered'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('shawl,pashmina,embroidered,kashmir', 617), variants: [{sku: 'JAH-SHL-017', priceInr: 4800, stock: 40, status: ACT, attrs: [{name: 'Color', value: 'Ivory'}]}] },
      { name: 'Block-Print Cotton Cape', description: 'Poncho-style cape cut from ajrakh block-printed cotton. Hood with toggle. Open sides. One size fits XS–L. Machine washable. Deep teal and rust colourway.',
        wholesalePriceInr: 1800, moq: 8, leadTime: W2, weightGrams: 500, categories: ['Apparel & Clothing', 'Outerwear', 'Capes'], tags: ['cape', 'ajrakh', 'blockprint', 'hooded'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('cape,blockprint,hooded,women', 621), variants: [{sku: 'JAH-CPE-018', priceInr: 1800, stock: 60, status: ACT, attrs: [{name: 'Size', value: 'One Size (XS–L)'}]}] },
      { name: 'Handwoven Khadi Waistcoat', description: 'Handwoven khadi cotton 5-button waistcoat (vest), sizes S–XXL, men\'s and unisex.',
        wholesalePriceInr: 1600, moq: 8, leadTime: W2, weightGrams: 350, categories: ['Apparel & Clothing', 'Outerwear', 'Waistcoats'], tags: ['waistcoat', 'khadi', 'men', 'handwoven'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('waistcoat,vest,khadi,men,india', 625), variants: [
          {sku: 'JAH-WST-019-S', priceInr: 1600, stock: 70, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-WST-019-M', priceInr: 1600, stock: 70, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      // Loungewear
      { name: 'Block-Print Cotton Pyjama Set', description: 'Soft 160TC cotton pyjama set with Sanganeri block-print. Straight-cut top with button placket + drawstring pyjama bottoms. Machine washable. Sizes XS–2XL. Unisex.',
        wholesalePriceInr: 1200, moq: 10, leadTime: W2, weightGrams: 450, categories: ['Apparel & Clothing', 'Loungewear', 'Pyjama Sets'], tags: ['pyjama', 'blockprint', 'cotton', 'unisex'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('pyjama,set,cotton,blockprint,lounge', 629), variants: [
          {sku: 'JAH-PYJ-020-S', priceInr: 1200, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-PYJ-020-M', priceInr: 1200, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Soft Modal Cotton Nightdress', description: 'Soft modal-cotton nightdress, knee-length, sizes XS–2XL, women\'s.',
        wholesalePriceInr: 900, moq: 12, leadTime: W2, weightGrams: 250, categories: ['Apparel & Clothing', 'Loungewear', 'Nightwear'], tags: ['nightwear', 'modal', 'nightdress', 'women'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('nightwear,nightdress,women,soft,cotton', 633), variants: [
          {sku: 'JAH-NWT-021-S', priceInr: 900, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'S'}, {name: 'Color', value: 'Blush'}]},
          {sku: 'JAH-NWT-021-M', priceInr: 900, stock: 100, status: ACT, attrs: [{name: 'Size', value: 'M'}, {name: 'Color', value: 'Blush'}]} ] },
      { name: 'Organic Cotton Yoga Set', description: 'Organic cotton yoga top and flare pants set, sizes XS–XL, women\'s.',
        wholesalePriceInr: 1600, moq: 8, leadTime: W2, weightGrams: 350, categories: ['Apparel & Clothing', 'Loungewear', 'Yoga Wear'], tags: ['yoga', 'organic', 'cotton', 'flare'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('yoga,wear,organic,cotton,women', 637), variants: [
          {sku: 'JAH-YGA-022-S', priceInr: 1600, stock: 80, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-YGA-022-M', priceInr: 1600, stock: 80, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
      { name: 'Handloom Cotton Lounge Set', description: 'Soft handloom cotton in two-colour stripe. Boxy top with patch pocket + straight-leg drawstring pants. Machine washable. Unisex fit. Sizes XS–2XL.',
        wholesalePriceInr: 1400, moq: 8, leadTime: W2, weightGrams: 500, categories: ['Apparel & Clothing', 'Loungewear', 'Loungewear Sets'], tags: ['loungewear', 'handloom', 'cotton', 'stripe'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('loungewear,set,handloom,cotton,stripe', 641), variants: [
          {sku: 'JAH-LNG-023-S', priceInr: 1400, stock: 90, status: ACT, attrs: [{name: 'Size', value: 'S'}]},
          {sku: 'JAH-LNG-023-M', priceInr: 1400, stock: 90, status: ACT, attrs: [{name: 'Size', value: 'M'}]} ] },
    ],
  },

  // ── Brand 12: Delhi Paper Studio — Stationery & Paper Goods (all 19 L3s) ─────
  {
    email: 'contact@delhipaperstudio.com', password: 'Solomon@2025',
    brandName: 'Delhi Paper Studio', slug: 'delhi-paper-studio', city: 'Delhi', state: 'Delhi',
    category: ['Stationery & Paper Goods'], description: 'Delhi studio producing handmade paper notebooks, gifting stationery, desk accessories and art supply kits.',
    brandStory: 'Rajan Mehra launched Delhi Paper Studio in 2012 after restoring a 200-year-old paper mill in Sanganer. We produce hand-pressed paper products that combine traditional Indian papermaking with contemporary design.',
    yearFounded: 2012, logoUrl: 'https://picsum.photos/seed/912/200/200', bannerUrl: 'https://picsum.photos/seed/962/1200/400',
    pickupPincode: '110006', instagramHandle: 'delhipaperstudio',
    achievementLevel: 'L3_TRUSTED', confirmedOrderCount: 210, avgRating: 4.7, minimumOrderValue: 8000,
    products: [
      // Notebooks & Journals
      { name: 'Handmade Paper Ruled Notebook A5', description: '120 pages of 90gsm handmade cotton rag paper with light ruling. Full-grain leather cover. Elastic closure, ribbon bookmark, back pocket. A5 (14.8×21 cm). Acid-free archival paper.',
        wholesalePriceInr: 480, moq: 20, leadTime: W2, weightGrams: 280, categories: ['Stationery & Paper Goods', 'Notebooks & Journals', 'Ruled Notebooks'], tags: ['notebook', 'ruled', 'leather', 'handmade-paper'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('notebook,ruled,leather,stationery', 645), variants: [
          {sku: 'DPS-RNB-001-TN', priceInr: 480, stock: 200, status: ACT, attrs: [{name: 'Color', value: 'Tan Leather'}]},
          {sku: 'DPS-RNB-001-BK', priceInr: 480, stock: 200, status: ACT, attrs: [{name: 'Color', value: 'Black Leather'}]} ] },
      { name: 'Dot Grid Journal with Khadi Cover', description: '150 pages of 100gsm handmade cotton paper, dot grid (5mm). Khadi cloth hardcover with block-printed pattern. Lay-flat binding. Ribbon bookmark. A5 format.',
        wholesalePriceInr: 420, moq: 24, leadTime: W2, weightGrams: 320, categories: ['Stationery & Paper Goods', 'Notebooks & Journals', 'Dot Grid Journals'], tags: ['journal', 'dot-grid', 'khadi', 'handmade-paper'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('journal,dot,grid,khadi,notebook', 649), variants: [{sku: 'DPS-DGJ-002', priceInr: 420, stock: 200, status: ACT, attrs: [{name: 'Paper', value: 'Handmade Cotton, 150 pages'}]}] },
      { name: 'Block-Print Hardcover Journal A4', description: 'Blank 200-page journal on 80gsm offset paper. Hardcover wrapped in block-printed cotton cloth. Sewn binding lies flat. Elastic closure. A4 format (21×29.7 cm). Ideal for sketching and journaling.',
        wholesalePriceInr: 620, moq: 15, leadTime: W2, weightGrams: 580, categories: ['Stationery & Paper Goods', 'Notebooks & Journals', 'Hardcover Journals'], tags: ['journal', 'hardcover', 'a4', 'blockprint'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('journal,hardcover,blockprint,blank', 653), variants: [{sku: 'DPS-HCJ-003', priceInr: 620, stock: 150, status: ACT, attrs: [{name: 'Size', value: 'A4, 200 pages blank'}]}] },
      { name: 'Handmade Paper Sketchbook A4', description: 'Spiral-bound sketchbook with 90 sheets of 200gsm cold-press watercolour handmade cotton paper. Acid-free. A4 format. Cardboard cover with block-print wrap. Suitable for pencil, ink, watercolour.',
        wholesalePriceInr: 780, moq: 15, leadTime: W2, weightGrams: 700, categories: ['Stationery & Paper Goods', 'Notebooks & Journals', 'Sketchbooks'], tags: ['sketchbook', 'watercolour', 'handmade-paper', 'spiral'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('sketchbook,watercolor,paper,artist', 657), variants: [{sku: 'DPS-SKB-004', priceInr: 780, stock: 120, status: ACT, attrs: [{name: 'Size', value: 'A4, 90 pages 200gsm'}]}] },
      { name: 'Leather Travel Journal Passport Size', description: 'Distressed full-grain leather cover with elastic closure. Fits Midori-style traveller\'s notebook inserts. Ships with 2 inserts: 1 blank + 1 ruled, 64 pages each. Refillable. 3.5×5.5 in.',
        wholesalePriceInr: 680, moq: 15, leadTime: W2, weightGrams: 180, categories: ['Stationery & Paper Goods', 'Notebooks & Journals', 'Travel Journals'], tags: ['travel-journal', 'leather', 'passport', 'refillable'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('travel,journal,leather,passport,notebook', 661), variants: [{sku: 'DPS-TRJ-005', priceInr: 680, stock: 150, status: ACT, attrs: [{name: 'Color', value: 'Distressed Tan'}]}] },
      // Cards & Gifting
      { name: 'Handmade Paper Greeting Cards Set of 8', description: '8 blank-inside cards on 300gsm handmade cotton rag paper. Botanical illustrations hand-block-printed in two colours. Matching cotton envelopes. Cards 4×6 in. Cellophane-free packaging.',
        wholesalePriceInr: 480, moq: 20, leadTime: W2, weightGrams: 150, categories: ['Stationery & Paper Goods', 'Cards & Gifting', 'Greeting Cards'], tags: ['greeting-card', 'handmade-paper', 'botanical', 'set'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('greeting,card,handmade,paper,botanical', 665), variants: [{sku: 'DPS-GRC-006', priceInr: 480, stock: 300, status: ACT, attrs: [{name: 'Pack', value: 'Set of 8'}]}] },
      { name: 'Block-Print Kraft Gift Wrapping Pack', description: 'Three 70×50 cm sheets of 90gsm kraft paper hand block-printed in seasonal patterns. Three metres of natural jute twine (cut in thirds). Three handmade paper gift tags with jute strings.',
        wholesalePriceInr: 280, moq: 30, leadTime: W2, weightGrams: 200, categories: ['Stationery & Paper Goods', 'Cards & Gifting', 'Gift Wrapping'], tags: ['gift-wrapping', 'kraft', 'blockprint', 'eco'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('gift,wrapping,kraft,paper,eco', 669), variants: [{sku: 'DPS-GFW-007', priceInr: 280, stock: 400, status: ACT, attrs: [{name: 'Contents', value: '3 sheets + ribbons + tags'}]}] },
      { name: 'Block-Print Gift Box Set', description: 'Three nested rigid gift boxes: 25×20×10 cm, 20×15×8 cm, 15×10×6 cm. Cotton cloth exterior in indigo block-print. Tissue paper interior. Magnetic lid closure.',
        wholesalePriceInr: 650, moq: 12, leadTime: W2, weightGrams: 600, categories: ['Stationery & Paper Goods', 'Cards & Gifting', 'Gift Boxes'], tags: ['gift-box', 'blockprint', 'nesting', 'set'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('gift,box,blockprint,cloth,set', 673), variants: [{sku: 'DPS-GFB-008', priceInr: 650, stock: 200, status: ACT, attrs: [{name: 'Set', value: '3 nesting sizes'}]}] },
      { name: 'Handmade Paper Tags & Labels Set of 50', description: '50 assorted handmade cotton rag paper tags: 20 plain, 20 block-printed (botanical and geometric), 10 kraft-look. All pre-punched with 15 cm jute string. Suitable for gifts, retail, wholesale packaging.',
        wholesalePriceInr: 350, moq: 20, leadTime: W2, weightGrams: 120, categories: ['Stationery & Paper Goods', 'Cards & Gifting', 'Tags & Labels'], tags: ['gift-tag', 'handmade-paper', 'jute', 'set'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('gift,tag,label,handmade,paper', 677), variants: [{sku: 'DPS-TAG-009', priceInr: 350, stock: 500, status: ACT, attrs: [{name: 'Pack', value: '50 assorted'}]}] },
      { name: 'Handmade Cotton Rag Envelope Set of 25', description: '25 A6 envelopes (16×11 cm) in natural handmade cotton rag paper. Self-adhesive strip. Includes 1 sealing wax stick and brass wax seal with floral motif. Great for invitations and correspondence.',
        wholesalePriceInr: 480, moq: 20, leadTime: W2, weightGrams: 180, categories: ['Stationery & Paper Goods', 'Cards & Gifting', 'Envelopes'], tags: ['envelope', 'handmade-paper', 'wax-seal', 'cotton-rag'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('envelope,handmade,paper,wax,seal', 681), variants: [{sku: 'DPS-ENV-010', priceInr: 480, stock: 300, status: ACT, attrs: [{name: 'Pack', value: '25 envelopes + wax seal'}]}] },
      // Desk Accessories
      { name: 'Brass & Mango Wood Pen Holder', description: 'Solid mango wood base with hand-turned brass pen tubes. Three slots for pens/pencils. 10 cm tall, 15 cm wide. Felt base. Polished brass with natural wood grain contrast.',
        wholesalePriceInr: 650, moq: 12, leadTime: W2, weightGrams: 350, categories: ['Stationery & Paper Goods', 'Desk Accessories', 'Pen Holders'], tags: ['pen-holder', 'brass', 'mango-wood', 'desk'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('pen,holder,brass,wood,desk', 685), variants: [{sku: 'DPS-PNH-011', priceInr: 650, stock: 100, status: ACT, attrs: [{name: 'Slots', value: '3-slot'}]}] },
      { name: 'Rattan & Leather Desk Organiser', description: 'Natural rattan body with 4 compartments (2 small, 1 medium, 1 large for files). Leather label panel on each compartment. 25×15×10 cm. Felt base. Coordinates with pen holder and desk pad.',
        wholesalePriceInr: 1200, moq: 8, leadTime: W2, weightGrams: 500, categories: ['Stationery & Paper Goods', 'Desk Accessories', 'Desk Organisers'], tags: ['desk-organiser', 'rattan', 'leather', 'compartment'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('desk,organizer,rattan,leather,office', 689), variants: [{sku: 'DPS-DSO-012', priceInr: 1200, stock: 80, status: ACT, attrs: [{name: 'Compartments', value: '4'}]}] },
      { name: 'Block-Print Linen Desk Pad', description: '40×60 cm work-surface desk pad. Top layer: block-printed linen. Bottom layer: cork for grip. Edge binding in PU leather with burnished corners. Wipe-clean surface. Protects desk surface.',
        wholesalePriceInr: 850, moq: 10, leadTime: W2, weightGrams: 400, categories: ['Stationery & Paper Goods', 'Desk Accessories', 'Desk Pads'], tags: ['desk-pad', 'linen', 'blockprint', 'cork'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('desk,pad,linen,office,writing', 693), variants: [{sku: 'DPS-DSP-013', priceInr: 850, stock: 100, status: ACT, attrs: [{name: 'Size', value: '40×60 cm'}]}] },
      { name: 'Handmade Brass Letter Opener', description: 'Hand-forged and polished brass blade with turned mango wood handle. 22 cm total length, 12 cm blade. Engraved floral motif on blade. Comes in cotton pouch. Safe rounded blade tip.',
        wholesalePriceInr: 480, moq: 15, leadTime: W2, weightGrams: 120, categories: ['Stationery & Paper Goods', 'Desk Accessories', 'Letter Openers'], tags: ['letter-opener', 'brass', 'mango-wood', 'handforged'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('letter,opener,brass,wood,stationery', 697), variants: [{sku: 'DPS-LTO-014', priceInr: 480, stock: 150, status: ACT, attrs: [{name: 'Length', value: '22 cm'}]}] },
      { name: 'Hand-Painted Bookmark Set of 5', description: 'Five 5×18 cm bookmarks in 300gsm handmade cotton paper. Hand block-printed with botanical illustrations — each unique. Laminated for durability. Gold foil edge. Pre-punched with ribbon.',
        wholesalePriceInr: 280, moq: 30, leadTime: W2, weightGrams: 60, categories: ['Stationery & Paper Goods', 'Desk Accessories', 'Bookmarks'], tags: ['bookmark', 'handmade-paper', 'blockprint', 'botanical'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('bookmark,handmade,paper,botanical,stationery', 701), variants: [{sku: 'DPS-BKM-015', priceInr: 280, stock: 400, status: ACT, attrs: [{name: 'Pack', value: 'Set of 5'}]}] },
      // Art Supplies
      { name: 'Indian Botanical Watercolour Paint Set', description: '12 half-pans of professional-grade watercolours using Indian mineral and natural pigments (turmeric, indigo, madder, saffron etc.). Handmade paper palette. Tin case with lid. 2 brushes included.',
        wholesalePriceInr: 1200, moq: 10, leadTime: W2, weightGrams: 400, categories: ['Stationery & Paper Goods', 'Art Supplies', 'Watercolour Sets'], tags: ['watercolour', 'natural-pigments', 'set', 'art-supplies'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('watercolor,paint,set,art,natural', 705), variants: [{sku: 'DPS-WCS-016', priceInr: 1200, stock: 100, status: ACT, attrs: [{name: 'Colors', value: '12 half-pans'}]}] },
      { name: 'Copperplate Calligraphy Starter Kit', description: 'Copperplate calligraphy kit: walnut oblique pen holder, 5 Nikko G nibs, black carbon ink + gold metallic ink, 20 handmade paper practice sheets with guidelines. Instruction booklet included.',
        wholesalePriceInr: 950, moq: 12, leadTime: W2, weightGrams: 350, categories: ['Stationery & Paper Goods', 'Art Supplies', 'Calligraphy Kits'], tags: ['calligraphy', 'kit', 'copperplate', 'nib'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('calligraphy,kit,nib,ink,writing', 709), variants: [{sku: 'DPS-CAL-017', priceInr: 950, stock: 80, status: ACT, attrs: [{name: 'Contents', value: 'Pen + 5 nibs + 2 inks + sheets'}]}] },
      { name: 'Beginner Block Printing Kit', description: '4 handmade woodblock designs (flower, leaf, geometric, elephant) + 3 fabric inks (red, blue, green) + 10 pre-washed cotton squares 30×30 cm. Complete kit to print your own fabric at home.',
        wholesalePriceInr: 1400, moq: 8, leadTime: W2, weightGrams: 800, categories: ['Stationery & Paper Goods', 'Art Supplies', 'Block Printing Kits'], tags: ['block-printing', 'kit', 'fabric-ink', 'woodblock'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('block,print,kit,woodblock,craft', 713), variants: [{sku: 'DPS-BPK-018', priceInr: 1400, stock: 80, status: ACT, attrs: [{name: 'Contents', value: '4 blocks + 3 inks + 10 squares'}]}] },
      { name: 'Indian Motif Rubber Stamp Set with Ink', description: '8 hand-carved rubber stamps mounted on mango wood: paisley, lotus, elephant, peacock, mandala, leaf, fish, geometric. 4-compartment ink pad (red, blue, black, green). Archival ink.',
        wholesalePriceInr: 650, moq: 15, leadTime: W2, weightGrams: 300, categories: ['Stationery & Paper Goods', 'Art Supplies', 'Stamps & Ink'], tags: ['stamp', 'rubber-stamp', 'indian-motif', 'ink'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('stamp,rubber,ink,indian,motif', 717), variants: [{sku: 'DPS-STM-019', priceInr: 650, stock: 150, status: ACT, attrs: [{name: 'Set', value: '8 stamps + ink pad'}]}] },
    ],
  },

  // ── Brand 13: Chennai Beauty Lab — Beauty & Ritual (all 18 L3s) ──────────────
  {
    email: 'contact@chennaibeatuylab.com', password: 'Solomon@2025',
    brandName: 'Chennai Beauty Lab', slug: 'chennai-beauty-lab', city: 'Chennai', state: 'Tamil Nadu',
    category: ['Beauty & Ritual'], description: 'Ayurvedic beauty brand from Chennai offering skincare, hair care, aromatherapy and ritual wellness products.',
    brandStory: 'Founded by Ayurvedic practitioner Dr. Ananya Krishnan, Chennai Beauty Lab formulates using traditional South Indian recipes — neem, turmeric, kumkumadi, coconut — and sources herbs from certified organic farms in Tamil Nadu and Kerala.',
    yearFounded: 2016, logoUrl: 'https://picsum.photos/seed/913/200/200', bannerUrl: 'https://picsum.photos/seed/963/1200/400',
    pickupPincode: '600001', instagramHandle: 'chennaibeatuylab',
    achievementLevel: 'L2_RISING', confirmedOrderCount: 140, avgRating: 4.8, minimumOrderValue: 6000,
    products: [
      // Skincare
      { name: 'Kumkumadi Radiance Face Serum', description: 'Traditional Ayurvedic kumkumadi formulation: 27 herbs in sesame oil base including saffron, sandalwood, turmeric and lotus. 30ml dark glass dropper bottle. Paraben-free, fragrance-free. For all skin types.',
        wholesalePriceInr: 980, moq: 12, leadTime: W2, weightGrams: 80, categories: ['Beauty & Ritual', 'Skincare', 'Face Care'], tags: ['serum', 'kumkumadi', 'ayurvedic', 'saffron'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('skincare,serum,face,ayurvedic,oil', 721), variants: [{sku: 'CBL-FCS-001', priceInr: 980, stock: 150, status: ACT, attrs: [{name: 'Volume', value: '30ml'}]}] },
      { name: 'Neem & Turmeric Body Butter', description: 'Whipped shea butter base with cold-pressed neem oil, organic turmeric extract and sandalwood. 200ml glass jar. Vegan, paraben-free, sulphate-free. Absorbs without greasy residue.',
        wholesalePriceInr: 680, moq: 15, leadTime: W2, weightGrams: 250, categories: ['Beauty & Ritual', 'Skincare', 'Body Care'], tags: ['body-butter', 'neem', 'turmeric', 'vegan'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('body,butter,cream,natural,skincare', 725), variants: [{sku: 'CBL-BDC-002', priceInr: 680, stock: 180, status: ACT, attrs: [{name: 'Volume', value: '200ml'}]}] },
      { name: 'Rose & Beeswax Lip Balm Set of 3', description: 'Pure beeswax and shea butter lip balms with natural pigment tints. Rose flavour with rose oxide tint. Berry with red cochineal. Nude with raw cocoa. 10g push-up tube. SPF 15.',
        wholesalePriceInr: 420, moq: 20, leadTime: W2, weightGrams: 60, categories: ['Beauty & Ritual', 'Skincare', 'Lip Care'], tags: ['lip-balm', 'beeswax', 'tinted', 'spf'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('lip,balm,natural,rose,beauty', 729), variants: [{sku: 'CBL-LPC-003', priceInr: 420, stock: 250, status: ACT, attrs: [{name: 'Pack', value: 'Set of 3'}]}] },
      { name: 'Karishalangani Eye Gel', description: 'Karishalangani (Eclipta alba) is a traditional Siddha herb for eye health. Combined with pure aloe vera gel and cucumber extract. 15ml airless pump. Paraben-free, fragrance-free. For all skin types.',
        wholesalePriceInr: 580, moq: 15, leadTime: W2, weightGrams: 50, categories: ['Beauty & Ritual', 'Skincare', 'Eye Care'], tags: ['eye-gel', 'ayurvedic', 'dark-circles', 'aloe'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('eye,cream,gel,natural,skincare', 733), variants: [{sku: 'CBL-EYC-004', priceInr: 580, stock: 150, status: ACT, attrs: [{name: 'Volume', value: '15ml'}]}] },
      { name: 'Zinc & Sandalwood Suncare Lotion SPF 50', description: 'Nano-free 20% zinc oxide sunscreen with Mysore sandalwood extract for soothing. Water-resistant (40 min). SPF 50 PA+++. 50ml. No white cast, non-greasy. Reef-safe. FSSAI approved.',
        wholesalePriceInr: 680, moq: 15, leadTime: W2, weightGrams: 100, categories: ['Beauty & Ritual', 'Skincare', 'Suncare'], tags: ['sunscreen', 'spf50', 'zinc', 'mineral'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('sunscreen,spf,mineral,suncare,cream', 737), variants: [{sku: 'CBL-SNC-005', priceInr: 680, stock: 200, status: ACT, attrs: [{name: 'SPF', value: 'SPF 50, 50ml'}]}] },
      // Hair Care
      { name: 'Bhringraj & Amla Hair Oil', description: 'Cold-infused sesame oil with bhringraj leaf, amla, brahmi, hibiscus and curry leaf. 100ml dark glass bottle. Suitable for all hair types. Paraben-free. Pre-wash scalp massage.',
        wholesalePriceInr: 480, moq: 20, leadTime: W2, weightGrams: 150, categories: ['Beauty & Ritual', 'Hair Care', 'Hair Oils'], tags: ['hair-oil', 'bhringraj', 'amla', 'ayurvedic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('hair,oil,ayurvedic,coconut,bottle', 741), variants: [{sku: 'CBL-HOL-006', priceInr: 480, stock: 250, status: ACT, attrs: [{name: 'Volume', value: '100ml'}]}] },
      { name: 'Shikakai & Reetha Natural Shampoo Bar', description: 'Traditional Indian hair wash formulation: shikakai, reetha and amla in a cold-process soap base with coconut and castor oil. 100g bar replaces 300ml liquid shampoo. Sulphate-free, vegan, zero-waste.',
        wholesalePriceInr: 280, moq: 30, leadTime: W2, weightGrams: 120, categories: ['Beauty & Ritual', 'Hair Care', 'Shampoos'], tags: ['shampoo-bar', 'shikakai', 'reetha', 'zero-waste'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('shampoo,bar,natural,hair,care', 745), variants: [{sku: 'CBL-SHP-007', priceInr: 280, stock: 350, status: ACT, attrs: [{name: 'Weight', value: '100g bar'}]}] },
      { name: 'Hibiscus & Brahmi Conditioner', description: 'Hibiscus extract, brahmi leaf and argan oil in a lightweight conditioner base. For frizzy, dry and coloured hair. Silicone-free, paraben-free. 200ml pump bottle. Vegan certified.',
        wholesalePriceInr: 420, moq: 20, leadTime: W2, weightGrams: 250, categories: ['Beauty & Ritual', 'Hair Care', 'Conditioners'], tags: ['conditioner', 'hibiscus', 'brahmi', 'frizz-control'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('conditioner,hair,natural,ayurvedic,bottle', 749), variants: [{sku: 'CBL-CDT-008', priceInr: 420, stock: 200, status: ACT, attrs: [{name: 'Volume', value: '200ml'}]}] },
      { name: 'Methi & Coconut Deep Hair Mask', description: 'Fenugreek seed powder, cold-pressed coconut milk and castor oil in a creamy hair mask. 200g glass jar. Leave-in 20–30 min before wash. For dry, damaged and chemically treated hair.',
        wholesalePriceInr: 520, moq: 15, leadTime: W2, weightGrams: 260, categories: ['Beauty & Ritual', 'Hair Care', 'Hair Masks'], tags: ['hair-mask', 'fenugreek', 'coconut', 'deep-conditioning'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('hair,mask,natural,coconut,treatment', 753), variants: [{sku: 'CBL-HMK-009', priceInr: 520, stock: 180, status: ACT, attrs: [{name: 'Weight', value: '200g'}]}] },
      { name: 'Neem & Tea Tree Scalp Serum', description: 'Targets scalp buildup and dandruff: neem oil, tea tree essential oil, salicylic acid (1%) and panthenol. 50ml dark glass dropper. Apply to scalp between washes. Paraben-free.',
        wholesalePriceInr: 620, moq: 15, leadTime: W2, weightGrams: 90, categories: ['Beauty & Ritual', 'Hair Care', 'Scalp Treatments'], tags: ['scalp-serum', 'neem', 'tea-tree', 'anti-dandruff'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('scalp,serum,treatment,hair,natural', 757), variants: [{sku: 'CBL-SCS-010', priceInr: 620, stock: 150, status: ACT, attrs: [{name: 'Volume', value: '50ml'}]}] },
      // Aromatherapy
      { name: 'South Indian Essential Oils Discovery Set', description: 'Five 5ml dark glass bottles of GC-tested 100% pure essential oils: Mysore sandalwood, Tamil vetiver, jasmine absolute, Kerala lemongrass and Indonesian patchouli. Gift box. Shelf life 3 years.',
        wholesalePriceInr: 1800, moq: 8, leadTime: W2, weightGrams: 150, categories: ['Beauty & Ritual', 'Aromatherapy', 'Essential Oils'], tags: ['essential-oil', 'sandalwood', 'vetiver', 'jasmine'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('essential,oil,aromatherapy,bottle,natural', 761), variants: [{sku: 'CBL-ESO-011', priceInr: 1800, stock: 80, status: ACT, attrs: [{name: 'Set', value: '5 × 5ml'}]}] },
      { name: 'Sandalwood & Vetiver Incense Sticks Box', description: 'Handrolled on bamboo skewers with natural wood powder, sandalwood and vetiver essential oil. No charcoal, no synthetic fragrance, no DPG. 50 sticks per box. Each stick burns 60 minutes.',
        wholesalePriceInr: 280, moq: 30, leadTime: W2, weightGrams: 150, categories: ['Beauty & Ritual', 'Aromatherapy', 'Incense Sticks & Cones'], tags: ['incense', 'sandalwood', 'vetiver', 'natural'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('incense,stick,sandalwood,aromatherapy', 765), variants: [{sku: 'CBL-INC-012', priceInr: 280, stock: 400, status: ACT, attrs: [{name: 'Count', value: '50 sticks'}]}] },
      { name: 'Jasmine & Rose Ultrasonic Diffuser Blend', description: 'Pre-diluted jasmine absolute and rose otto in solubiliser for use in ultrasonic diffusers. Add 10–20 drops to 100ml water. 100ml dark glass bottle. No carrier oil — no diffuser residue.',
        wholesalePriceInr: 680, moq: 12, leadTime: W2, weightGrams: 150, categories: ['Beauty & Ritual', 'Aromatherapy', 'Diffuser Blends'], tags: ['diffuser', 'jasmine', 'rose', 'ultrasonic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('diffuser,blend,jasmine,rose,aromatherapy', 769), variants: [{sku: 'CBL-DFB-013', priceInr: 680, stock: 120, status: ACT, attrs: [{name: 'Volume', value: '100ml'}]}] },
      { name: 'Neem & Coconut Bath & Body Oil', description: 'Cold-pressed coconut oil and neem oil with turmeric extract and vitamin E. Absorbs quickly, non-greasy. 100ml glass spray bottle. Apply to damp skin after shower for all-day moisture.',
        wholesalePriceInr: 480, moq: 15, leadTime: W2, weightGrams: 180, categories: ['Beauty & Ritual', 'Aromatherapy', 'Bath & Body'], tags: ['body-oil', 'coconut', 'neem', 'turmeric'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('body,oil,natural,coconut,bath', 773), variants: [{sku: 'CBL-BTB-014', priceInr: 480, stock: 180, status: ACT, attrs: [{name: 'Volume', value: '100ml spray'}]}] },
      // Ritual & Wellness
      { name: 'Brass Puja Thali Set', description: 'Solid brass puja thali (28 cm plate) with matching: oil diya, ghanta (bell), incense stick holder and puja spoon. Hand-engraved floral motifs. Brass polish included. Gift box.',
        wholesalePriceInr: 2200, moq: 4, leadTime: W2, weightGrams: 1200, categories: ['Beauty & Ritual', 'Ritual & Wellness', 'Puja Accessories'], tags: ['puja', 'thali', 'brass', 'diya'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('puja,thali,brass,diya,india', 777), variants: [{sku: 'CBL-PJA-015', priceInr: 2200, stock: 60, status: ACT, attrs: [{name: 'Metal', value: 'Solid Brass, 5-piece'}]}] },
      { name: 'Singing Bowl Meditation Set', description: 'Traditional 7-metal hand-hammered Tibetan singing bowl from Bodhgaya craftsmen. 15 cm diameter. Produces a rich, sustained Om tone. Includes leather-wrapped wooden mallet and embroidered silk cushion.',
        wholesalePriceInr: 1800, moq: 4, leadTime: W3, weightGrams: 800, categories: ['Beauty & Ritual', 'Ritual & Wellness', 'Meditation Aids'], tags: ['singing-bowl', 'meditation', 'tibetan', '7-metal'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('singing,bowl,meditation,tibetan,india', 781), variants: [{sku: 'CBL-MED-016', priceInr: 1800, stock: 50, status: ACT, attrs: [{name: 'Diameter', value: '15 cm'}]}] },
      { name: 'Indian Crystal & Stone Healing Set', description: 'Seven ethically sourced and tumbled Indian crystals, each 2–4 cm. Includes printed info card with crystal meanings. Packaged in handmade cotton drawstring pouch. Stones vary slightly in shape and colour.',
        wholesalePriceInr: 950, moq: 10, leadTime: W2, weightGrams: 200, categories: ['Beauty & Ritual', 'Ritual & Wellness', 'Crystals & Stones'], tags: ['crystal', 'healing-stone', 'set', 'chakra'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('crystal,stone,healing,chakra,set', 785), variants: [{sku: 'CBL-CRS-017', priceInr: 950, stock: 120, status: ACT, attrs: [{name: 'Set', value: '7 stones'}]}] },
      { name: 'Sage & Neem Smudge Bundle Set of 3', description: 'Wild-harvested Indian sage (Salvia officinalis) and neem leaf bundles hand-tied with cotton twine. 15 cm each. Set of 3. Air-dry before use. Instructions for space-clearing ritual included.',
        wholesalePriceInr: 480, moq: 15, leadTime: W2, weightGrams: 100, categories: ['Beauty & Ritual', 'Ritual & Wellness', 'Smudge Bundles'], tags: ['smudge', 'sage', 'neem', 'ritual'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('smudge,bundle,sage,ritual,natural', 789), variants: [{sku: 'CBL-SMB-018', priceInr: 480, stock: 200, status: ACT, attrs: [{name: 'Pack', value: 'Set of 3, 15 cm each'}]}] },
    ],
  },

];

// ─── Main (no truncate — appends to existing seed) ────────────────────────────

async function main() {
  console.log('\n🌱 Starting seed part 2...\n');
  console.log('Seeding additional brands, products, and variants...');
  let totalProducts = 0, totalVariants = 0, totalPhotos = 0;

  for (const brandData of BRANDS) {
    const { email, password, brandName, slug, products, achievementLevel, confirmedOrderCount, avgRating, ...brandFields } = brandData;
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email, passwordHash: hash, name: brandName, role: 'BRAND', isEmailVerified: true,
        brandProfile: {
          create: {
            brandName, slug, status: 'APPROVED', achievementLevel, confirmedOrderCount, avgRating,
            countryOfOrigin: 'IN', approvedAt: new Date(),
            socialLinks: { instagram: `https://instagram.com/${brandFields.instagramHandle}` },
            ...brandFields,
          },
        },
      },
      include: { brandProfile: true },
    });

    const brand = user.brandProfile ?? await prisma.brandProfile.findUnique({ where: { userId: user.id } });
    console.log(`  Brand: ${brandName} (${brandFields.city ?? ''})`);

    for (const productData of products) {
      const { variants: variantDefs, photos, ...productFields } = productData;
      const productSlug = `${toSlug(productData.name)}-${brand.id.slice(-6)}`;
      const product = await prisma.product.upsert({
        where: { slug: productSlug },
        update: {},
        create: { ...productFields, slug: productSlug, brandProfileId: brand.id, availability: 'ACTIVE', countryOfOrigin: 'IN' },
      });
      totalProducts++;

      const productPhotos = photos ?? [];
      await prisma.productPhoto.deleteMany({ where: { productId: product.id } });
      await prisma.productPhoto.createMany({
        data: productPhotos.map((ph) => ({ productId: product.id, url: ph.url, publicId: ph.publicId, position: ph.position })),
      });
      totalPhotos += productPhotos.length;

      if (variantDefs && variantDefs.length > 0) {
        for (const v of variantDefs) {
          const exists = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
          if (exists) continue;
          await prisma.productVariant.create({
            data: { productId: product.id, sku: v.sku, priceInr: v.priceInr, stock: v.stock, status: v.status, attributes: { create: v.attrs.map((a) => ({ name: a.name, value: a.value })) } },
          });
          totalVariants++;
        }
      }
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✅ Seed part 2 complete!\n');
  console.log(`  Brands     : ${BRANDS.length}`);
  console.log(`  Products   : ${totalProducts}`);
  console.log(`  Photos     : ${totalPhotos}`);
  console.log(`  Variants   : ${totalVariants}`);
  console.log('─'.repeat(50) + '\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
