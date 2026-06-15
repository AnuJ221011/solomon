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

  // ── Brand 1: Jaipuri Candle Works — Home Décor > Candles & Holders ──────────
  {
    email: 'contact@jaipuricandle.com', password: 'Solomon@2025',
    brandName: 'Jaipuri Candle Works', slug: 'jaipuri-candle-works', city: 'Jaipur', state: 'Rajasthan',
    category: ['Home Décor & Living'], description: 'Artisan candle studio crafting hand-poured soy and beeswax candles in Jaipur.',
    brandStory: 'Founded in 2015, we blend traditional Indian fragrance notes — sandalwood, jasmine, vetiver — into eco-conscious candles using pure plant waxes and lead-free cotton wicks.',
    yearFounded: 2015, logoUrl: 'https://picsum.photos/seed/901/200/200', bannerUrl: 'https://picsum.photos/seed/951/1200/400',
    pickupPincode: '302001', instagramHandle: 'jaipuricandleworks',
    achievementLevel: 'L2_RISING', confirmedOrderCount: 85, avgRating: 4.6, minimumOrderValue: 5000,
    products: [
      { name: 'Rose & Sandalwood Soy Candle', shortDescription: 'Hand-poured 180ml soy wax candle, rose and sandalwood fragrance, 40-hour burn.', fullDescription: 'Pure soy wax, cotton wick, recycled glass jar. Rose absolute and Indian sandalwood fragrance. Burn time ≥ 40 hrs. No paraffin, no synthetic additives.',
        wholesalePriceInr: 380, moq: 24, leadTime: W2, weightGrams: 350, categories: ['Home Décor & Living', 'Candles & Holders', 'Soy Candles'], tags: ['soy', 'candle', 'rose', 'sandalwood'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('candle,soy,wax', 1), variants: [{sku: 'JCW-SOY-001', priceInr: 380, stock: 300, status: ACT, attrs: [{name: 'Scent', value: 'Rose & Sandalwood'}]}] },
      { name: 'Pure Beeswax Pillar Candle', shortDescription: 'Hand-rolled 100% beeswax pillar candle, jasmine-scented, 3×6 in., 60-hour burn.', fullDescription: 'Pure filtered beeswax scented with natural jasmine oil. Drip-resistant, slow-burning. Each candle is hand-rolled and hand-trimmed. No paraffin or synthetic waxes.',
        wholesalePriceInr: 520, moq: 12, leadTime: W2, weightGrams: 450, categories: ['Home Décor & Living', 'Candles & Holders', 'Beeswax Candles'], tags: ['beeswax', 'candle', 'jasmine', 'pillar'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('beeswax,candle,yellow', 5), variants: [{sku: 'JCW-BEE-002', priceInr: 520, stock: 200, status: ACT, attrs: [{name: 'Size', value: '3×6 in'}]}] },
      { name: 'Terracotta Candle Holder Set', shortDescription: 'Set of 3 hand-thrown terracotta candle holders for pillar and taper candles.', fullDescription: 'Wheel-thrown by Rajasthani potters, kiln-fired to a warm terracotta finish. Fits pillar candles 2–3 in. diameter. Three graduated sizes. Sold as a set.',
        wholesalePriceInr: 650, moq: 10, leadTime: W2, weightGrams: 900, categories: ['Home Décor & Living', 'Candles & Holders', 'Candle Holders'], tags: ['terracotta', 'candle-holder', 'handmade'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('terracotta,candle,holder', 9), variants: [{sku: 'JCW-HOL-003', priceInr: 650, stock: 150, status: ACT, attrs: [{name: 'Finish', value: 'Natural Terracotta'}]}] },
      { name: 'Mixed Soy Votives & Tealights Box', shortDescription: 'Box of 24 hand-poured soy votives and tealights in four fragrance blends.', fullDescription: '12 votives (30ml) + 12 tealights (15ml). Fragrances: lavender, geranium, vetiver, neroli. Cotton wicks, aluminium tealight cups. Shelf life 18 months.',
        wholesalePriceInr: 490, moq: 24, leadTime: W2, weightGrams: 600, categories: ['Home Décor & Living', 'Candles & Holders', 'Votives & Tealights'], tags: ['votives', 'tealights', 'soy', 'gift-set'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('tealight,votive,candle', 13), variants: [{sku: 'JCW-VOT-004', priceInr: 490, stock: 400, status: ACT, attrs: [{name: 'Pack', value: 'Mixed 24 pc'}]}] },
      { name: 'Vetiver & Amber Pillar Candle', shortDescription: 'Large soy-beeswax blend pillar candle, vetiver and amber fragrance, 4×8 in., 80-hour burn.', fullDescription: '70/30 soy-beeswax blend for a clean, long burn. Fragrance: Indian vetiver root and amber resin. No synthetic additives. Drip-resistant. Sold individually.',
        wholesalePriceInr: 750, moq: 12, leadTime: W2, weightGrams: 700, categories: ['Home Décor & Living', 'Candles & Holders', 'Pillar Candles'], tags: ['pillar', 'vetiver', 'amber', 'candle'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('pillar,candle,large,wax', 17), variants: [{sku: 'JCW-PIL-005', priceInr: 750, stock: 180, status: ACT, attrs: [{name: 'Scent', value: 'Vetiver & Amber'}]}] },
      { name: 'Sandalwood & Cedarwood Reed Diffuser', shortDescription: '100ml reed diffuser with Mysore sandalwood and cedarwood, 8 rattan reeds, 90-day fragrance life.', fullDescription: 'Sustainably sourced Mysore sandalwood and cedarwood essential oils in a dipropylene glycol base. Eight rattan reeds. Clear glass bottle with cork stopper. Fragrance lasts up to 90 days.',
        wholesalePriceInr: 420, moq: 24, leadTime: W2, weightGrams: 300, categories: ['Home Décor & Living', 'Candles & Holders', 'Reed Diffusers'], tags: ['reed-diffuser', 'sandalwood', 'aromatherapy'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('reed,diffuser,fragrance', 21), variants: [{sku: 'JCW-RDF-006', priceInr: 420, stock: 250, status: ACT, attrs: [{name: 'Scent', value: 'Sandalwood & Cedarwood'}]}] },
    ],
  },

  // ── Brand 2: Rajwada Furnishing — Home Décor (Wall, Storage, Tabletop, Soft Furnishings) ──
  {
    email: 'contact@rajwadafurnishing.com', password: 'Solomon@2025',
    brandName: 'Rajwada Furnishing', slug: 'rajwada-furnishing', city: 'Jodhpur', state: 'Rajasthan',
    category: ['Home Décor & Living'], description: 'Heritage home furnishing brand from Jodhpur offering wall décor, storage and soft furnishings.',
    brandStory: 'Four generations of Jodhpur craftsmen weave, print and assemble home furnishings that carry the colours and patterns of Rajasthan into contemporary interiors worldwide.',
    yearFounded: 1978, logoUrl: 'https://picsum.photos/seed/902/200/200', bannerUrl: 'https://picsum.photos/seed/952/1200/400',
    pickupPincode: '342001', instagramHandle: 'rajwadafurnishing',
    achievementLevel: 'L4_ELITE', confirmedOrderCount: 520, avgRating: 4.9, minimumOrderValue: 15000,
    products: [
      // Wall Décor
      { name: 'Phulkari Tapestry Wall Hanging', shortDescription: 'Hand-embroidered phulkari tapestry on cotton, 36×48 in., vibrant geometric florals.', fullDescription: 'Traditional phulkari embroidery from Punjab worked on natural cotton. Geometric floral patterns in vibrant silks. Wooden dowel included. Hand-wash only.',
        wholesalePriceInr: 2800, moq: 5, leadTime: W3, weightGrams: 800, categories: ['Home Décor & Living', 'Wall Décor', 'Tapestries'], tags: ['tapestry', 'phulkari', 'wall', 'embroidery'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('tapestry,wall,bohemian', 25), variants: [{sku: 'RFP-TAP-001', priceInr: 2800, stock: 80, status: ACT, attrs: [{name: 'Size', value: '36×48 in'}]}] },
      { name: 'Block-Print Framed Art Panel', shortDescription: 'Block-printed cotton art panel in teakwood frame, 18×24 in., indigo and natural motifs.', fullDescription: 'Hand block-printed on 200TC cotton using natural indigo dye. Mounted and framed in solid teak. Ready to hang. Each piece is unique due to the hand-printing process.',
        wholesalePriceInr: 1800, moq: 6, leadTime: W2, weightGrams: 1200, categories: ['Home Décor & Living', 'Wall Décor', 'Framed Art'], tags: ['framed-art', 'blockprint', 'indigo', 'teak'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('framed,art,wall,decor', 29), variants: [{sku: 'RFP-FRA-002', priceInr: 1800, stock: 60, status: ACT, attrs: [{name: 'Style', value: 'Indigo Floral'}]}] },
      { name: 'Rajasthani Textile Wall Hanging', shortDescription: 'Patchwork kantha-stitch wall hanging, cotton, 24×36 in., mirror-work accents.', fullDescription: 'Assembled from vintage sari cotton scraps stitched together in kantha style. Mirror-work accents catch the light. Brass ring for hanging. Sold individually.',
        wholesalePriceInr: 1400, moq: 8, leadTime: W2, weightGrams: 500, categories: ['Home Décor & Living', 'Wall Décor', 'Wall Hangings'], tags: ['wall-hanging', 'kantha', 'mirror-work', 'patchwork'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('wall,hanging,textile,india', 33), variants: [{sku: 'RFP-WHG-003', priceInr: 1400, stock: 100, status: ACT, attrs: [{name: 'Color', value: 'Multicolour'}]}] },
      { name: 'Carved Mango Wood Round Mirror', shortDescription: 'Handcarved mango wood frame round mirror, 24 in. diameter, antique gold finish.', fullDescription: 'Solid mango wood hand-carved with floral motifs, finished in antique gold. Mirror glass 18 in. Clear hanging hardware included. Wipe-clean wood finish.',
        wholesalePriceInr: 3200, moq: 4, leadTime: W3, weightGrams: 3000, categories: ['Home Décor & Living', 'Wall Décor', 'Mirrors'], tags: ['mirror', 'carved', 'mango-wood', 'gold'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('mirror,wall,decor,wood', 37), variants: [{sku: 'RFP-MIR-004', priceInr: 3200, stock: 40, status: ACT, attrs: [{name: 'Finish', value: 'Antique Gold'}]}] },
      { name: 'Boho Cotton Macramé Wall Art', shortDescription: 'Hand-knotted cotton macramé wall panel, 20×40 in., natural and terracotta tones.', fullDescription: 'Hand-knotted in Jaipur using 3mm recycled cotton rope. Dip-dyed in terracotta plant-based dye. Driftwood dowel included. Light and airy — perfect for gallery walls.',
        wholesalePriceInr: 1200, moq: 10, leadTime: W2, weightGrams: 600, categories: ['Home Décor & Living', 'Wall Décor', 'Macramé Wall Art'], tags: ['macrame', 'boho', 'wall-art', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('macrame,wall,art,boho', 41), variants: [{sku: 'RFP-MAC-005', priceInr: 1200, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Natural & Terracotta'}]}] },
      { name: 'Handwoven Wool Woven Panel', shortDescription: 'Handwoven wool woven panel wall art, 18×30 in., earthy geometric pattern.', fullDescription: 'Warp-and-weft woven by artisans in Kutch using undyed and naturally dyed wool. Geometric pattern in earthy browns, creams and ochre. Wooden dowel and jute hanging cord included.',
        wholesalePriceInr: 2200, moq: 6, leadTime: W3, weightGrams: 700, categories: ['Home Décor & Living', 'Wall Décor', 'Woven Panels'], tags: ['woven-panel', 'wool', 'geometric', 'kutch'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('woven,panel,wall,textile', 45), variants: [{sku: 'RFP-WPN-006', priceInr: 2200, stock: 70, status: ACT, attrs: [{name: 'Color', value: 'Earth Tones'}]}] },
      // Storage & Organisation
      { name: 'Seagrass Storage Baskets Set', shortDescription: 'Set of 3 hand-woven seagrass baskets with cotton rope handles, nested sizes.', fullDescription: 'Hand-woven from natural seagrass and finished with braided cotton rope handles. Three nested sizes: 30cm, 24cm, 18cm diameter. Eco-certified seagrass. Wipe-clean.',
        wholesalePriceInr: 1600, moq: 6, leadTime: W2, weightGrams: 1400, categories: ['Home Décor & Living', 'Storage & Organisation', 'Baskets'], tags: ['basket', 'seagrass', 'storage', 'eco'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('basket,seagrass,storage,wicker', 49), variants: [{sku: 'RFP-BSK-007', priceInr: 1600, stock: 90, status: ACT, attrs: [{name: 'Set', value: 'Set of 3'}]}] },
      { name: 'Block-Print Decorative Box & Tray Set', shortDescription: 'Mango wood box and tray set with block-printed lining, 3 pieces.', fullDescription: 'Solid mango wood with dove-tail joints. Interior lined with block-printed cotton in indigo and white. Felt base. Set: 1 lidded box (25×15 cm) + 2 nesting trays.',
        wholesalePriceInr: 2100, moq: 5, leadTime: W2, weightGrams: 1800, categories: ['Home Décor & Living', 'Storage & Organisation', 'Boxes & Trays'], tags: ['box', 'tray', 'mango-wood', 'blockprint'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('box,tray,wood,decor', 53), variants: [{sku: 'RFP-BOX-008', priceInr: 2100, stock: 60, status: ACT, attrs: [{name: 'Wood', value: 'Mango Wood'}]}] },
      { name: 'Rattan Shelf Basket Set', shortDescription: 'Set of 2 open rattan shelf baskets, 30×20×15 cm each, natural finish.', fullDescription: 'Hand-woven rattan baskets ideal for shelf organisation. Sturdy base, natural finish. Fit standard 30cm deep shelves. Sold as a pair. Can hold up to 3kg each.',
        wholesalePriceInr: 950, moq: 10, leadTime: W2, weightGrams: 600, categories: ['Home Décor & Living', 'Storage & Organisation', 'Shelving Accessories'], tags: ['rattan', 'shelf', 'basket', 'organizer'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('rattan,shelf,basket,organizer', 57), variants: [{sku: 'RFP-SHF-009', priceInr: 950, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Natural'}]}] },
      { name: 'Jute Wall Organiser with Pockets', shortDescription: 'Hand-stitched jute wall organiser, 5 pockets, 40×60 cm, with leather strap hanger.', fullDescription: 'Natural jute canvas with 5 varying-size pockets. Reinforced stitching. Leather strap hanger with brass buckle. Great for entryways, home offices and kids rooms.',
        wholesalePriceInr: 780, moq: 12, leadTime: W2, weightGrams: 450, categories: ['Home Décor & Living', 'Storage & Organisation', 'Wall Organisers'], tags: ['wall-organizer', 'jute', 'pockets', 'storage'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('wall,organizer,jute,pocket', 61), variants: [{sku: 'RFP-WOR-010', priceInr: 780, stock: 150, status: ACT, attrs: [{name: 'Color', value: 'Natural Jute'}]}] },
      { name: 'Cotton Rope Storage Bin', shortDescription: 'Hand-woven cotton rope storage bin, 35cm diameter × 25cm tall, natural white.', fullDescription: 'Coiled cotton rope construction, no glue or synthetic adhesives. Sturdy base holds shape when filled. Holds blankets, toys or laundry. Machine-washable. Natural undyed cotton.',
        wholesalePriceInr: 1100, moq: 10, leadTime: W2, weightGrams: 900, categories: ['Home Décor & Living', 'Storage & Organisation', 'Storage Bins'], tags: ['storage-bin', 'cotton-rope', 'laundry', 'handwoven'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('storage,bin,cotton,rope', 65), variants: [{sku: 'RFP-BIN-011', priceInr: 1100, stock: 100, status: ACT, attrs: [{name: 'Color', value: 'Natural White'}]}] },
      // Tabletop & Dining
      { name: 'Block-Print Linen Placemats Set of 6', shortDescription: 'Set of 6 block-printed linen placemats, 14×18 in., indigo botanical motifs.', fullDescription: 'Hand block-printed on 55% linen 45% cotton blend using AZO-free indigo dye. Machine washable at 30°C. Each placemat 14×18 in. Set of 6.',
        wholesalePriceInr: 1800, moq: 8, leadTime: W2, weightGrams: 600, categories: ['Home Décor & Living', 'Tabletop & Dining', 'Placemats'], tags: ['placemat', 'blockprint', 'linen', 'indigo'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('placemat,table,linen,dining', 69), variants: [{sku: 'RFP-PLM-012', priceInr: 1800, stock: 80, status: ACT, attrs: [{name: 'Color', value: 'Indigo on Natural'}]}] },
      { name: 'Kantha-Stitch Table Runner', shortDescription: 'Kantha-stitch cotton table runner, 14×72 in., multicolour running-stitch pattern.', fullDescription: 'Made from layered vintage sari cotton secured with traditional kantha running stitch. Each runner is unique — slight variations are hallmarks of handmade authenticity. 14×72 in.',
        wholesalePriceInr: 950, moq: 12, leadTime: W2, weightGrams: 350, categories: ['Home Décor & Living', 'Tabletop & Dining', 'Table Runners'], tags: ['table-runner', 'kantha', 'sari', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('table,runner,kantha,india', 73), variants: [{sku: 'RFP-TRN-013', priceInr: 950, stock: 150, status: ACT, attrs: [{name: 'Color', value: 'Multicolour'}]}] },
      { name: 'Embroidered Linen Napkin Set with Rings', shortDescription: 'Set of 6 embroidered linen napkins with matching silver-brass napkin rings.', fullDescription: '100% linen napkins with white-on-white satin-stitch botanical border. 6 matching silver-plated brass napkin rings with floral motif. 18×18 in. each.',
        wholesalePriceInr: 2400, moq: 6, leadTime: W2, weightGrams: 700, categories: ['Home Décor & Living', 'Tabletop & Dining', 'Napkins & Napkin Rings'], tags: ['napkin', 'napkin-ring', 'linen', 'embroidered'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('napkin,ring,linen,table', 77), variants: [{sku: 'RFP-NAP-014', priceInr: 2400, stock: 60, status: ACT, attrs: [{name: 'Color', value: 'White on Ivory'}]}] },
      { name: 'Blue Pottery Ceramic Coasters Set', shortDescription: 'Set of 6 hand-painted blue pottery coasters, 4 in. round, cork-backed.', fullDescription: 'Authentic Jaipur blue pottery coasters painted by hand using traditional blue and white pigments. Cork backing protects surfaces. Fade-resistant glaze. 4 in. diameter.',
        wholesalePriceInr: 900, moq: 12, leadTime: W2, weightGrams: 800, categories: ['Home Décor & Living', 'Tabletop & Dining', 'Coasters'], tags: ['coaster', 'blue-pottery', 'ceramic', 'jaipur'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('coaster,ceramic,blue,pottery', 81), variants: [{sku: 'RFP-CST-015', priceInr: 900, stock: 120, status: ACT, attrs: [{name: 'Pattern', value: 'Blue Floral'}]}] },
      { name: 'Ajrakh Block-Print Tablecloth', shortDescription: 'Ajrakh block-printed cotton tablecloth, 60×90 in., deep teal and rust.', fullDescription: 'Printed using the traditional ajrakh resist-print method with natural dyes — deep teal (indigo) and rust (madder). 100% cotton, 180TC. Seats 6. Hand or machine wash cold.',
        wholesalePriceInr: 2200, moq: 6, leadTime: W2, weightGrams: 1000, categories: ['Home Décor & Living', 'Tabletop & Dining', 'Table Cloths'], tags: ['tablecloth', 'ajrakh', 'blockprint', 'natural-dye'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('tablecloth,blockprint,dining', 85), variants: [{sku: 'RFP-TCL-016', priceInr: 2200, stock: 70, status: ACT, attrs: [{name: 'Size', value: '60×90 in'}]}] },
      // Soft Furnishings
      { name: 'Sanganeri Block-Print Cushion Covers Set of 5', shortDescription: 'Set of 5 hand block-printed cotton cushion covers, 18×18 in., traditional floral.', fullDescription: 'Stamped individually using heritage sheesham-wood blocks, AZO-free dyes on 200TC cotton. Set of 5 assorted floral motifs in coordinating indigo, terracotta and sage.',
        wholesalePriceInr: 1200, moq: 10, leadTime: W2, weightGrams: 400, categories: ['Home Décor & Living', 'Soft Furnishings', 'Cushion Covers'], tags: ['cushion', 'blockprint', 'cotton', 'floral'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('cushion,cover,blockprint,india', 89), variants: [{sku: 'RFP-CUC-017', priceInr: 1200, stock: 200, status: ACT, attrs: [{name: 'Color', value: 'Indigo Mix'}]}] },
      { name: 'Tufted Cotton Throw Pillow', shortDescription: 'Handmade tufted cotton throw pillow, 20×20 in., with insert, geometric pattern.', fullDescription: 'Cover woven on handlooms with raised tuft pattern in undyed and terracotta cotton. Insert: 100% cotton fill. Zipper closure. 20×20 in. Cover removable for washing.',
        wholesalePriceInr: 950, moq: 12, leadTime: W2, weightGrams: 600, categories: ['Home Décor & Living', 'Soft Furnishings', 'Throw Pillows'], tags: ['throw-pillow', 'tufted', 'cotton', 'geometric'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('throw,pillow,tufted,sofa', 93), variants: [{sku: 'RFP-THP-018', priceInr: 950, stock: 150, status: ACT, attrs: [{name: 'Color', value: 'Terracotta & Natural'}]}] },
      { name: 'Dabu-Print Cotton Throw Blanket', shortDescription: 'Lightweight 100% cotton dabu-print throw, 50×60 in., crackled resist pattern.', fullDescription: 'Dabu mud-resist printing creates a distinctive crackled texture unique to each piece. 100% cotton, 180gsm. Machine wash cold. Each throw has slight variations — authentically handmade.',
        wholesalePriceInr: 1800, moq: 8, leadTime: W2, weightGrams: 700, categories: ['Home Décor & Living', 'Soft Furnishings', 'Throws & Blankets'], tags: ['throw', 'dabu', 'blockprint', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('throw,blanket,cotton,india', 97), variants: [{sku: 'RFP-THB-019', priceInr: 1800, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Charcoal on Beige'}]}] },
      { name: 'Hand-Woven Wool Dhurrie Rug', shortDescription: 'Hand-woven flat-weave wool dhurrie rug, 4×6 ft., geometric stripes, reversible.', fullDescription: 'Warp cotton, weft natural-dyed wool. Flat-weave dhurrie technique from Rajasthan. Geometric stripe pattern. Reversible. 4×6 ft. Spot-clean or professional wash.',
        wholesalePriceInr: 4500, moq: 3, leadTime: W3, weightGrams: 3000, categories: ['Home Décor & Living', 'Soft Furnishings', 'Rugs & Dhurries'], tags: ['dhurrie', 'rug', 'wool', 'flatweave'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('rug,dhurrie,flatweave,india', 101), variants: [{sku: 'RFP-RUG-020', priceInr: 4500, stock: 50, status: ACT, attrs: [{name: 'Size', value: '4×6 ft'}]}] },
      { name: 'Patchwork Kantha Floor Cushion', shortDescription: 'Round patchwork floor cushion, 24 in. diameter, vintage sari cotton, kantha-stitched, with insert.', fullDescription: 'Cover assembled from hand-selected vintage sari cotton patches, hand-stitched with kantha running stitch. Cotton-fill insert included. Zipper closure. 24 in. diameter, 6 in. thick.',
        wholesalePriceInr: 1400, moq: 8, leadTime: W2, weightGrams: 1200, categories: ['Home Décor & Living', 'Soft Furnishings', 'Floor Cushions'], tags: ['floor-cushion', 'kantha', 'patchwork', 'boho'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('floor,cushion,pouf,kantha', 105), variants: [{sku: 'RFP-FLC-021', priceInr: 1400, stock: 90, status: ACT, attrs: [{name: 'Color', value: 'Multicolour Patchwork'}]}] },
    ],
  },

  // ── Brand 3: Blue Pottery House — Ceramics & Pottery ────────────────────────
  {
    email: 'contact@bluepotteryhouse.com', password: 'Solomon@2025',
    brandName: 'Blue Pottery House', slug: 'blue-pottery-house', city: 'Jaipur', state: 'Rajasthan',
    category: ['Ceramics & Pottery'], description: 'Traditional Jaipur blue pottery studio producing tableware, vases and decorative ceramics.',
    brandStory: 'A family studio in the walled city of Jaipur preserving the 400-year-old art of blue pottery — a unique technique using quartz paste fired at low temperatures and hand-painted in cobalt blue and turquoise.',
    yearFounded: 1963, logoUrl: 'https://picsum.photos/seed/903/200/200', bannerUrl: 'https://picsum.photos/seed/953/1200/400',
    pickupPincode: '302002', instagramHandle: 'bluepotteryhouse',
    achievementLevel: 'L3_TRUSTED', confirmedOrderCount: 210, avgRating: 4.7, minimumOrderValue: 8000,
    products: [
      // Tableware
      { name: 'Blue Pottery Chai Mugs Set of 4', shortDescription: 'Set of 4 hand-painted blue pottery chai mugs, 200ml, cobalt blue floral motifs.', fullDescription: 'Authentic Jaipur blue pottery: quartz paste body, lead-free cobalt oxide paint, low-fire glaze. Food safe and microwave safe. 200ml capacity. Each mug is handmade so slight variations occur.',
        wholesalePriceInr: 1200, moq: 6, leadTime: W2, weightGrams: 900, categories: ['Ceramics & Pottery', 'Tableware', 'Mugs & Cups'], tags: ['mug', 'blue-pottery', 'chai', 'handpainted'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('blue,pottery,mug,ceramic', 109), variants: [{sku: 'BPH-MUG-001', priceInr: 1200, stock: 150, status: ACT, attrs: [{name: 'Capacity', value: '200ml'}]}] },
      { name: 'Blue Pottery Serving Bowls Set of 3', shortDescription: 'Set of 3 nesting blue pottery bowls, 15/20/25 cm, hand-painted with peacock motifs.', fullDescription: 'Hand-painted blue pottery in three graduated sizes. Peacock and lotus motifs. Food safe, dishwasher safe (top rack). Sold as a set. Makes a complete table centrepiece.',
        wholesalePriceInr: 1800, moq: 4, leadTime: W2, weightGrams: 1400, categories: ['Ceramics & Pottery', 'Tableware', 'Bowls'], tags: ['bowl', 'blue-pottery', 'peacock', 'set'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('ceramic,bowl,blue,handpainted', 113), variants: [{sku: 'BPH-BWL-002', priceInr: 1800, stock: 100, status: ACT, attrs: [{name: 'Motif', value: 'Peacock'}]}] },
      { name: 'Blue Pottery Dinner Plates Set of 6', shortDescription: 'Set of 6 handmade blue pottery dinner plates, 10 in., geometric blue-on-white patterns.', fullDescription: 'Classic blue pottery dinner plates with geometric floral border. Food safe, low-fire glaze. Hand wash recommended for longevity. 10 in. diameter. Set of 6.',
        wholesalePriceInr: 2800, moq: 3, leadTime: W2, weightGrams: 3000, categories: ['Ceramics & Pottery', 'Tableware', 'Plates'], tags: ['plate', 'blue-pottery', 'dinner', 'geometric'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('pottery,plate,blue,ceramic', 117), variants: [{sku: 'BPH-PLT-003', priceInr: 2800, stock: 60, status: ACT, attrs: [{name: 'Size', value: '10 in'}]}] },
      { name: 'Blue Pottery Oval Serving Platter', shortDescription: 'Handmade blue pottery oval platter, 14×9 in., floral and bird motifs.', fullDescription: 'Large oval serving platter hand-painted with intricate floral and bird motifs. Food safe. Ideal for mezze, charcuterie or dessert. 14×9 in. Wipe-clean or hand wash.',
        wholesalePriceInr: 1400, moq: 6, leadTime: W2, weightGrams: 900, categories: ['Ceramics & Pottery', 'Tableware', 'Serving Platters'], tags: ['platter', 'blue-pottery', 'serving', 'oval'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('platter,ceramic,blue,serving', 121), variants: [{sku: 'BPH-PLR-004', priceInr: 1400, stock: 90, status: ACT, attrs: [{name: 'Size', value: '14×9 in'}]}] },
      { name: 'Blue Pottery Teapot & Cup Set', shortDescription: 'Blue pottery teapot (700ml) with 4 matching cups (150ml), lotus motif.', fullDescription: 'Classic Jaipur blue pottery tea service: 700ml teapot with stainless steel infuser basket + 4 matching 150ml cups. Lotus and vine motif in cobalt and turquoise. Sold as set of 5 pieces.',
        wholesalePriceInr: 3500, moq: 3, leadTime: W2, weightGrams: 2000, categories: ['Ceramics & Pottery', 'Tableware', 'Teapots & Tea Sets'], tags: ['teapot', 'tea-set', 'blue-pottery', 'lotus'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('teapot,ceramic,blue,tea', 125), variants: [{sku: 'BPH-TEA-005', priceInr: 3500, stock: 40, status: ACT, attrs: [{name: 'Pieces', value: '5-piece set'}]}] },
      { name: 'Blue Pottery Side Plates Set of 6', shortDescription: 'Set of 6 blue pottery side plates, 7 in., classic blue-on-white fish-scale border.', fullDescription: 'Handmade 7 in. side plates with traditional fish-scale border in cobalt blue on white. Food safe. Perfect as bread plates, dessert plates or appetiser plates. Set of 6.',
        wholesalePriceInr: 1800, moq: 4, leadTime: W2, weightGrams: 1800, categories: ['Ceramics & Pottery', 'Tableware', 'Side Plates'], tags: ['side-plate', 'blue-pottery', 'fish-scale'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('side,plate,ceramic,blue', 129), variants: [{sku: 'BPH-SID-006', priceInr: 1800, stock: 80, status: ACT, attrs: [{name: 'Size', value: '7 in'}]}] },
      // Storage & Vases
      { name: 'Blue Pottery Flower Vase', shortDescription: 'Hand-painted blue pottery vase, 25 cm tall, flared neck, peacock feather motif.', fullDescription: 'Wheel-thrown blue pottery vase with flared neck. Hand-painted peacock feather motif in cobalt and turquoise. Waterproof glaze interior. 25 cm tall, 12 cm base diameter.',
        wholesalePriceInr: 1100, moq: 8, leadTime: W2, weightGrams: 800, categories: ['Ceramics & Pottery', 'Storage & Vases', 'Vases'], tags: ['vase', 'blue-pottery', 'peacock', 'flower'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('vase,ceramic,blue,flower', 133), variants: [{sku: 'BPH-VAS-007', priceInr: 1100, stock: 120, status: ACT, attrs: [{name: 'Height', value: '25 cm'}]}] },
      { name: 'Blue Pottery Hanging Planter', shortDescription: 'Hand-painted blue pottery hanging planter, 15 cm diameter, with jute hanger.', fullDescription: 'Blue pottery planter with drainage hole and matching saucer. Jute hanger with three-point suspension included. 15 cm diameter. For indoor plants up to 12 cm pot.',
        wholesalePriceInr: 850, moq: 12, leadTime: W2, weightGrams: 500, categories: ['Ceramics & Pottery', 'Storage & Vases', 'Planters'], tags: ['planter', 'blue-pottery', 'hanging', 'indoor'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('planter,pottery,ceramic,hanging', 137), variants: [{sku: 'BPH-PLN-008', priceInr: 850, stock: 100, status: ACT, attrs: [{name: 'Size', value: '15 cm'}]}] },
      { name: 'Blue Pottery Kitchen Canister Set', shortDescription: 'Set of 3 blue pottery kitchen canisters with lids, 600/400/250ml, floral motif.', fullDescription: 'Airtight rubber-gasketed lids in three graduated sizes: 600ml, 400ml, 250ml. Hand-painted with blue floral motifs. Food safe. Perfect for tea, coffee, spices. Set of 3.',
        wholesalePriceInr: 2200, moq: 4, leadTime: W2, weightGrams: 1500, categories: ['Ceramics & Pottery', 'Storage & Vases', 'Jars & Canisters'], tags: ['canister', 'jar', 'blue-pottery', 'kitchen'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('jar,canister,ceramic,kitchen', 141), variants: [{sku: 'BPH-CAN-009', priceInr: 2200, stock: 70, status: ACT, attrs: [{name: 'Set', value: '3-piece set'}]}] },
      { name: 'Blue Pottery Bread Bin', shortDescription: 'Hand-painted blue pottery bread bin, 30×18×18 cm, with bamboo lid.', fullDescription: 'Large blue pottery bread bin with hand-painted floral vine motif. Fitted bamboo lid with ceramic handle. 30×18×18 cm. Food safe interior. Keeps bread fresh for 2–3 days.',
        wholesalePriceInr: 2800, moq: 4, leadTime: W2, weightGrams: 2500, categories: ['Ceramics & Pottery', 'Storage & Vases', 'Bread Bins'], tags: ['bread-bin', 'blue-pottery', 'bamboo', 'kitchen'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('bread,bin,ceramic,kitchen', 145), variants: [{sku: 'BPH-BRD-010', priceInr: 2800, stock: 40, status: ACT, attrs: [{name: 'Lid', value: 'Bamboo'}]}] },
      // Decorative Ceramics
      { name: 'Blue Pottery Ganesha Figurine', shortDescription: 'Hand-painted blue pottery seated Ganesha figurine, 15 cm, cobalt and gold.', fullDescription: 'Wheel-thrown and hand-sculpted seated Ganesha. Painted in classic cobalt blue with 22k gold lustre accents. 15 cm tall. Display or gifting. Velvet base.',
        wholesalePriceInr: 1400, moq: 8, leadTime: W2, weightGrams: 600, categories: ['Ceramics & Pottery', 'Decorative Ceramics', 'Figurines'], tags: ['figurine', 'ganesha', 'blue-pottery', 'decorative'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('figurine,ceramic,blue,handpainted', 149), variants: [{sku: 'BPH-FIG-011', priceInr: 1400, stock: 80, status: ACT, attrs: [{name: 'Height', value: '15 cm'}]}] },
      { name: 'Blue Pottery Decorative Wall Plate', shortDescription: 'Hand-painted decorative wall plate, 30 cm diameter, peacock in garden motif.', fullDescription: 'Show-stopping blue pottery wall plate with intricate peacock-in-garden hand painting. 30 cm diameter. Hanging wire attached at back. Not for food use — decorative only.',
        wholesalePriceInr: 1800, moq: 6, leadTime: W2, weightGrams: 900, categories: ['Ceramics & Pottery', 'Decorative Ceramics', 'Wall Plates'], tags: ['wall-plate', 'decorative', 'blue-pottery', 'peacock'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('wall,plate,decorative,pottery', 153), variants: [{sku: 'BPH-WPL-012', priceInr: 1800, stock: 60, status: ACT, attrs: [{name: 'Diameter', value: '30 cm'}]}] },
      { name: 'Blue Pottery Pillar Candle Holder', shortDescription: 'Hand-painted blue pottery candle holder for 3 in. pillar candles, 12 cm tall.', fullDescription: 'Solid blue pottery base with deep recessed well for 3 in. pillar candles. Cobalt vine motif. 12 cm tall, 10 cm base. Decorative piece — not a hanging fixture.',
        wholesalePriceInr: 650, moq: 12, leadTime: W2, weightGrams: 500, categories: ['Ceramics & Pottery', 'Decorative Ceramics', 'Candle Holders'], tags: ['candle-holder', 'blue-pottery', 'pillar', 'ceramic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('ceramic,candle,holder,blue', 157), variants: [{sku: 'BPH-CDH-013', priceInr: 650, stock: 140, status: ACT, attrs: [{name: 'Fit', value: '3 in pillar'}]}] },
      { name: 'Blue Pottery Incense Holder', shortDescription: 'Hand-painted blue pottery incense stick and cone holder, 15 cm long, with ash tray.', fullDescription: 'Elongated blue pottery incense holder with three incense holes and integrated ash tray. Painted with floral motif. 15 cm long. Works with standard incense sticks and cones.',
        wholesalePriceInr: 350, moq: 24, leadTime: W2, weightGrams: 200, categories: ['Ceramics & Pottery', 'Decorative Ceramics', 'Incense Holders'], tags: ['incense', 'holder', 'blue-pottery', 'ceramic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('incense,holder,ceramic,blue', 161), variants: [{sku: 'BPH-INC-014', priceInr: 350, stock: 200, status: ACT, attrs: [{name: 'Color', value: 'Classic Blue'}]}] },
      { name: 'Blue Pottery Decorative Tile Set of 4', shortDescription: 'Set of 4 hand-painted blue pottery tiles, 10×10 cm, for display or installation.', fullDescription: 'Each tile hand-painted with a unique motif (fish, lotus, elephant, peacock). 10×10 cm, 8mm thick. Can be mounted on wall or displayed on easels. Sold as set of 4.',
        wholesalePriceInr: 800, moq: 10, leadTime: W2, weightGrams: 600, categories: ['Ceramics & Pottery', 'Decorative Ceramics', 'Decorative Tiles'], tags: ['tile', 'decorative', 'blue-pottery', 'handpainted'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('tile,decorative,blue,ceramic', 165), variants: [{sku: 'BPH-TIL-015', priceInr: 800, stock: 100, status: ACT, attrs: [{name: 'Motif', value: 'Assorted 4-pack'}]}] },
    ],
  },

  // ── Brand 4: Delhi Leather Craft — Leather & Bags ────────────────────────────
  {
    email: 'contact@delhileathercraft.com', password: 'Solomon@2025',
    brandName: 'Delhi Leather Craft', slug: 'delhi-leather-craft', city: 'Delhi', state: 'Delhi',
    category: ['Leather & Bags'], description: 'Full-grain leather bags, accessories and footwear hand-crafted in Delhi since 1985.',
    brandStory: 'Third-generation leather artisans working from a single workshop in Jhandewalan. We source full-grain buffalo and vegetable-tanned leather from certified tanneries and construct every piece by hand — no assembly lines.',
    yearFounded: 1985, logoUrl: 'https://picsum.photos/seed/904/200/200', bannerUrl: 'https://picsum.photos/seed/954/1200/400',
    pickupPincode: '110055', instagramHandle: 'delhileathercraft',
    achievementLevel: 'L3_TRUSTED', confirmedOrderCount: 178, avgRating: 4.7, minimumOrderValue: 10000,
    products: [
      // Bags
      { name: 'Full-Grain Leather Tote Bag', shortDescription: 'Structured full-grain buffalo leather tote, 38×30×12 cm, tan, with interior pockets.', fullDescription: 'Vegetable-tanned full-grain buffalo leather. Two open interior pockets + one zip pocket. Solid brass hardware. 50 cm drop handles. Natural tan patinas beautifully with use.',
        wholesalePriceInr: 3800, moq: 5, leadTime: W2, weightGrams: 1200, categories: ['Leather & Bags', 'Bags', 'Tote Bags'], tags: ['leather', 'tote', 'full-grain', 'tan'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,tote,bag,tan', 169), variants: [{sku: 'DLC-TOT-001', priceInr: 3800, stock: 60, status: ACT, attrs: [{name: 'Color', value: 'Natural Tan'}]}] },
      { name: 'Waxed Canvas & Leather Backpack', shortDescription: 'Waxed canvas and leather-trim backpack, 22L, antique brass zips, padded laptop sleeve.', fullDescription: 'Body: waxed cotton canvas. Trim, base and straps: full-grain leather. 22-litre capacity. 15-inch laptop sleeve. Antique brass YKK zips. Roll-top closure. Lifetime hardware warranty.',
        wholesalePriceInr: 5200, moq: 4, leadTime: W3, weightGrams: 900, categories: ['Leather & Bags', 'Bags', 'Backpacks'], tags: ['backpack', 'leather', 'canvas', 'laptop'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,backpack,canvas,bag', 173), variants: [{sku: 'DLC-BPK-002', priceInr: 5200, stock: 40, status: ACT, attrs: [{name: 'Color', value: 'Olive Canvas / Tan Leather'}]}] },
      { name: 'Classic Leather Shoulder Bag', shortDescription: 'Classic full-grain leather shoulder bag with flap, 28×20×8 cm, cognac, adjustable strap.', fullDescription: 'Single main compartment with press-stud flap. Adjustable 120 cm strap. Inside slip pocket. Full-grain leather in cognac. Solid brass hardware. Weighs 550g empty.',
        wholesalePriceInr: 3200, moq: 5, leadTime: W2, weightGrams: 700, categories: ['Leather & Bags', 'Bags', 'Shoulder Bags'], tags: ['shoulder-bag', 'leather', 'cognac', 'flap'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('leather,shoulder,bag,women', 177), variants: [{sku: 'DLC-SHB-003', priceInr: 3200, stock: 60, status: ACT, attrs: [{name: 'Color', value: 'Cognac'}]}] },
      { name: 'Full-Grain Leather Messenger Bag', shortDescription: 'Hand-stitched leather messenger bag, 38×28×10 cm, black, with buckle strap closure.', fullDescription: 'Saddle-stitched full-grain black leather. Front organiser pocket, main compartment fits 14-inch laptop. Adjustable padded shoulder strap. Brass buckle closure. Unisex.',
        wholesalePriceInr: 4200, moq: 4, leadTime: W2, weightGrams: 1000, categories: ['Leather & Bags', 'Bags', 'Messenger Bags'], tags: ['messenger', 'leather', 'black', 'laptop'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,messenger,bag,men', 181), variants: [{sku: 'DLC-MSG-004', priceInr: 4200, stock: 45, status: ACT, attrs: [{name: 'Color', value: 'Black'}]}] },
      { name: 'Vegetable-Tanned Leather Duffel Bag', shortDescription: 'Large vegetable-tanned leather duffel, 50×28×28 cm, tan, weekend bag.', fullDescription: 'Full-size weekend duffel in heavy vegetable-tanned leather. Main zip compartment + end zip pocket. Removable padded shoulder strap + carry handles. 50×28×28 cm, 40-litre capacity.',
        wholesalePriceInr: 6800, moq: 3, leadTime: W3, weightGrams: 2000, categories: ['Leather & Bags', 'Bags', 'Duffel Bags'], tags: ['duffel', 'leather', 'weekend', 'travel'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,duffel,travel,bag', 185), variants: [{sku: 'DLC-DUF-005', priceInr: 6800, stock: 25, status: ACT, attrs: [{name: 'Color', value: 'Natural Tan'}]}] },
      // Small Accessories
      { name: 'Hand-Stitched Bifold Leather Wallet', shortDescription: 'Saddle-stitched full-grain leather bifold wallet, 8 card slots, note and coin pockets.', fullDescription: 'Full-grain vegetable-tanned leather. 8 card slots, 2 note compartments, 1 coin pocket with press stud. Saddle-stitched with waxed linen thread. Slim profile: 10mm when loaded.',
        wholesalePriceInr: 1200, moq: 10, leadTime: W2, weightGrams: 120, categories: ['Leather & Bags', 'Small Accessories', 'Wallets'], tags: ['wallet', 'leather', 'bifold', 'handstitched'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,wallet,bifold,brown', 189), variants: [{sku: 'DLC-WAL-006', priceInr: 1200, stock: 150, status: ACT, attrs: [{name: 'Color', value: 'Tan'}]}] },
      { name: 'Minimalist Leather Card Holder', shortDescription: 'Ultra-slim 4-slot leather card holder with RFID blocking, 9×6 cm, 3mm thin.', fullDescription: 'Full-grain leather card holder with RFID-blocking aluminium inner layer. 4 card slots. 9×6 cm, only 3mm thick when loaded with 4 cards. Available in tan, black and cognac.',
        wholesalePriceInr: 650, moq: 20, leadTime: W2, weightGrams: 40, categories: ['Leather & Bags', 'Small Accessories', 'Card Holders'], tags: ['card-holder', 'leather', 'rfid', 'minimalist'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,card,holder,slim', 193), variants: [
          {sku: 'DLC-CDH-007-TN', priceInr: 650, stock: 200, status: ACT, attrs: [{name: 'Color', value: 'Tan'}]},
          {sku: 'DLC-CDH-007-BK', priceInr: 650, stock: 200, status: ACT, attrs: [{name: 'Color', value: 'Black'}]} ] },
      { name: 'Handmade Leather Belt', shortDescription: 'Hand-cut 3.5cm wide full-grain leather belt with solid brass roller buckle, 90–115 cm.', fullDescription: 'Single-piece full-grain leather strap, hand-burnished edges, solid brass roller buckle. Width 3.5 cm. Sizes: 90, 95, 100, 105, 110, 115 cm (waist measurement). Unisex.',
        wholesalePriceInr: 1400, moq: 10, leadTime: W2, weightGrams: 250, categories: ['Leather & Bags', 'Small Accessories', 'Belts'], tags: ['belt', 'leather', 'brass', 'handmade'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,belt,brown,fashion', 197), variants: [
          {sku: 'DLC-BLT-008-TN', priceInr: 1400, stock: 100, status: ACT, attrs: [{name: 'Color', value: 'Tan'}, {name: 'Size', value: '95 cm'}]},
          {sku: 'DLC-BLT-008-BK', priceInr: 1400, stock: 100, status: ACT, attrs: [{name: 'Color', value: 'Black'}, {name: 'Size', value: '95 cm'}]} ] },
      { name: 'Vegetable-Tanned Key Fob Set of 2', shortDescription: 'Set of 2 hand-stamped leather key fobs with brass D-rings, personalisation available.', fullDescription: 'Two key fobs from thick vegetable-tanned leather, 10×3 cm. Solid brass D-ring and split ring. Hand-stamped with geometric motif. Personalisable (initials, text) on request at no extra cost.',
        wholesalePriceInr: 420, moq: 24, leadTime: W2, weightGrams: 80, categories: ['Leather & Bags', 'Small Accessories', 'Key Fobs'], tags: ['key-fob', 'leather', 'personalised', 'gift'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,keychain,key,fob', 201), variants: [{sku: 'DLC-KFB-009', priceInr: 420, stock: 300, status: ACT, attrs: [{name: 'Color', value: 'Natural Tan'}]}] },
      { name: 'Snap-Closure Leather Phone Case', shortDescription: 'Full-grain leather phone case with card slot and magnetic snap, fits most 6–6.7 in. phones.', fullDescription: 'Full-grain leather folio case with press-stud magnetic snap. 1 card slot, 1 cash pocket. Fits phones 6–6.7 in. (iPhone 15 Plus, Samsung S24+, etc.). Available in tan and black.',
        wholesalePriceInr: 950, moq: 12, leadTime: W2, weightGrams: 90, categories: ['Leather & Bags', 'Small Accessories', 'Phone Cases'], tags: ['phone-case', 'leather', 'folio', 'card-slot'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,phone,case,tan', 205), variants: [
          {sku: 'DLC-PHC-010-TN', priceInr: 950, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Tan'}]},
          {sku: 'DLC-PHC-010-BK', priceInr: 950, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Black'}]} ] },
      // Footwear
      { name: 'Hand-Embroidered Mojari Shoes', shortDescription: 'Men\'s hand-embroidered leather mojari shoes, pointed toe, US 7–11.', fullDescription: 'Genuine leather upper embroidered by hand with silk thread in floral motifs. Leather sole with rubber heel patch. Traditional Rajasthani mojari construction. Sizes US 7–11.',
        wholesalePriceInr: 1800, moq: 6, leadTime: W3, weightGrams: 600, categories: ['Leather & Bags', 'Footwear', 'Mojaris'], tags: ['mojari', 'embroidered', 'leather', 'traditional'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('mojari,shoe,indian,embroidered', 209), variants: [
          {sku: 'DLC-MOJ-011-8', priceInr: 1800, stock: 50, status: ACT, attrs: [{name: 'Size US', value: '8'}]},
          {sku: 'DLC-MOJ-011-9', priceInr: 1800, stock: 50, status: ACT, attrs: [{name: 'Size US', value: '9'}]} ] },
      { name: 'Handmade Kolhapuri Leather Sandals', shortDescription: 'Women\'s handmade Kolhapuri leather sandals with ankle strap, US 5–9.', fullDescription: 'Authentic Kolhapuri chappal: full-grain buffalo leather upper, leather sole with carved heel. Braided ankle strap with brass buckle. Traditional double-layered construction. Sizes US 5–9.',
        wholesalePriceInr: 1400, moq: 6, leadTime: W3, weightGrams: 500, categories: ['Leather & Bags', 'Footwear', 'Kolhapuri Sandals'], tags: ['kolhapuri', 'sandal', 'leather', 'traditional'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('kolhapuri,sandal,leather,india', 213), variants: [
          {sku: 'DLC-KOL-012-6', priceInr: 1400, stock: 50, status: ACT, attrs: [{name: 'Size US', value: '6'}]},
          {sku: 'DLC-KOL-012-7', priceInr: 1400, stock: 50, status: ACT, attrs: [{name: 'Size US', value: '7'}]} ] },
      { name: 'Vegetable-Tanned Leather Ballet Flats', shortDescription: 'Women\'s vegetable-tanned leather ballet flats, round toe, US 5–9.', fullDescription: 'Full-grain vegetable-tanned leather upper, leather lining and sole. Classic round-toe ballet flat silhouette. Elastic gore at instep for secure fit. Sizes US 5–9.',
        wholesalePriceInr: 1600, moq: 6, leadTime: W2, weightGrams: 400, categories: ['Leather & Bags', 'Footwear', 'Flats'], tags: ['flats', 'leather', 'ballet', 'women'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,flat,ballet,shoe,women', 217), variants: [
          {sku: 'DLC-FLT-013-6', priceInr: 1600, stock: 60, status: ACT, attrs: [{name: 'Size US', value: '6'}]},
          {sku: 'DLC-FLT-013-7', priceInr: 1600, stock: 60, status: ACT, attrs: [{name: 'Size US', value: '7'}]} ] },
      { name: 'Hand-Stitched Leather Loafers', shortDescription: 'Men\'s and women\'s hand-stitched moccasin-style leather loafers, US 6–11.', fullDescription: 'Full-grain leather moccasin construction: one-piece upper wrapping into sole. Hand saddle-stitched with waxed thread. Rubber-soled for durability. Unisex sizing, US 6–11.',
        wholesalePriceInr: 2200, moq: 5, leadTime: W3, weightGrams: 650, categories: ['Leather & Bags', 'Footwear', 'Loafers'], tags: ['loafer', 'leather', 'moccasin', 'handstitched'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('leather,loafer,shoe,handmade', 221), variants: [
          {sku: 'DLC-LOA-014-7', priceInr: 2200, stock: 40, status: ACT, attrs: [{name: 'Size US', value: '7'}]},
          {sku: 'DLC-LOA-014-8', priceInr: 2200, stock: 40, status: ACT, attrs: [{name: 'Size US', value: '8'}]} ] },
    ],
  },

  // ── Brand 5: Mumbai Textile Studio — Textiles & Fabric (Block Print + Handwoven) ──
  {
    email: 'contact@mumbaitextilestudio.com', password: 'Solomon@2025',
    brandName: 'Mumbai Textile Studio', slug: 'mumbai-textile-studio', city: 'Mumbai', state: 'Maharashtra',
    category: ['Textiles & Fabric'], description: 'Block-print and handwoven textile studio supplying wholesale fabric and home textiles from Maharashtra.',
    brandStory: 'Founded by textile designer Priya Nair in 2010, we collaborate directly with block-printers in Bagru and weavers in Yeola to create fabrics that are both export-quality and fairly traded.',
    yearFounded: 2010, logoUrl: 'https://picsum.photos/seed/905/200/200', bannerUrl: 'https://picsum.photos/seed/955/1200/400',
    pickupPincode: '400013', instagramHandle: 'mumbaitextilestudio',
    achievementLevel: 'L3_TRUSTED', confirmedOrderCount: 290, avgRating: 4.8, minimumOrderValue: 8000,
    products: [
      // Block Print Textiles
      { name: 'Indigo Block-Print Cushion Covers Set of 5', shortDescription: 'Set of 5 hand block-printed cotton cushion covers, 18×18 in., indigo resist-print.', fullDescription: 'Bagru resist block-print on 200TC cotton. Five coordinating indigo-on-natural motifs. Zip closure. Machine-washable. Covers only, no insert.',
        wholesalePriceInr: 1100, moq: 10, leadTime: W2, weightGrams: 350, categories: ['Textiles & Fabric', 'Block Print Textiles', 'Cushion Covers'], tags: ['cushion', 'blockprint', 'indigo', 'bagru'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('blockprint,cushion,fabric,indigo', 225), variants: [{sku: 'MTS-CUS-001', priceInr: 1100, stock: 200, status: ACT, attrs: [{name: 'Color', value: 'Indigo'}]}] },
      { name: 'Floral Block-Print Table Linen Set', shortDescription: 'Block-printed cotton table linen set: 1 tablecloth (60×90 in.) + 6 napkins.', fullDescription: 'AZO-free natural dyes on 160TC cotton. Matching tablecloth (60×90 in.) and 6 napkins (18×18 in.). Sold as a 7-piece set. Machine wash at 30°C. Hem-stitched edges.',
        wholesalePriceInr: 3200, moq: 6, leadTime: W2, weightGrams: 1400, categories: ['Textiles & Fabric', 'Block Print Textiles', 'Table Linen'], tags: ['table-linen', 'blockprint', 'floral', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('blockprint,table,linen,fabric', 229), variants: [{sku: 'MTS-TBL-002', priceInr: 3200, stock: 80, status: ACT, attrs: [{name: 'Color', value: 'Terracotta Floral'}]}] },
      { name: 'Geometric Block-Print Bed Linen Set', shortDescription: 'Block-printed cotton bed linen set for king bed: duvet cover + 2 pillowcases.', fullDescription: 'Hand block-printed geometric pattern in slate blue and white. 220TC cotton. King duvet cover 220×230 cm + two king pillowcases 50×75 cm. Button closure. Machine-washable.',
        wholesalePriceInr: 4500, moq: 4, leadTime: W2, weightGrams: 2200, categories: ['Textiles & Fabric', 'Block Print Textiles', 'Bed Linen'], tags: ['bed-linen', 'blockprint', 'geometric', 'king'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('blockprint,bedding,bed,linen', 233), variants: [
          {sku: 'MTS-BED-003-KG', priceInr: 4500, stock: 60, status: ACT, attrs: [{name: 'Size', value: 'King'}]},
          {sku: 'MTS-BED-003-QN', priceInr: 3800, stock: 60, status: ACT, attrs: [{name: 'Size', value: 'Queen'}]} ] },
      { name: 'Sanganeri Block-Print Dress Material', shortDescription: 'Sanganeri block-printed dress material, 2.5m unstitched cotton fabric, floral motifs.', fullDescription: '2.5m unstitched 100% cotton fabric, 44 in. wide. Traditional Sanganeri floral block-print in rose pink on natural. AZO-free dyes. Suitable for kurtas, dresses and blouses.',
        wholesalePriceInr: 850, moq: 20, leadTime: W2, weightGrams: 350, categories: ['Textiles & Fabric', 'Block Print Textiles', 'Dress Material'], tags: ['dress-material', 'sanganeri', 'blockprint', 'floral'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('blockprint,fabric,dress,india', 237), variants: [{sku: 'MTS-DRS-004', priceInr: 850, stock: 300, status: ACT, attrs: [{name: 'Color', value: 'Rose on Natural'}]}] },
      { name: 'Ajrakh Block-Print Apparel Fabric', shortDescription: 'Ajrakh resist block-print apparel fabric, per metre, 44 in. wide, deep teal and rust.', fullDescription: 'Traditional ajrakh two-pass resist printing on 100% cotton. Deep teal (indigo) background with rust (madder) motifs. 44 in. wide, sold per metre. Minimum 5 metres per order.',
        wholesalePriceInr: 480, moq: 50, leadTime: W2, weightGrams: 180, categories: ['Textiles & Fabric', 'Block Print Textiles', 'Apparel Fabric'], tags: ['apparel-fabric', 'ajrakh', 'blockprint', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('ajrakh,fabric,blockprint,textile', 241), variants: [{sku: 'MTS-APP-005', priceInr: 480, stock: 500, status: ACT, attrs: [{name: 'Width', value: '44 in, per metre'}]}] },
      { name: 'Bagru Running Fabric by the Bolt', shortDescription: 'Bagru mud-resist block-print cotton running fabric, 30m bolt, 44 in. wide.', fullDescription: 'Full 30m bolt of Bagru mud-resist printed cotton. Classic charcoal-on-natural geometric repeat. 44 in. wide. Wholesale pricing for apparel manufacturers and home textile makers.',
        wholesalePriceInr: 280, moq: 100, leadTime: W2, weightGrams: 140, categories: ['Textiles & Fabric', 'Block Print Textiles', 'Running Fabric'], tags: ['running-fabric', 'bagru', 'bolt', 'wholesale'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('fabric,yardage,bolt,textile', 245), variants: [{sku: 'MTS-RUN-006', priceInr: 280, stock: 200, status: ACT, attrs: [{name: 'Length', value: '30m bolt, per metre price'}]}] },
      // Handwoven Textiles
      { name: 'Handwoven Cotton Silk Stole', shortDescription: 'Handwoven cotton-silk stole, 28×80 in., Yeola loom, iridescent shimmer.', fullDescription: 'Woven on pit looms in Yeola, Maharashtra, using 70% cotton 30% silk blend. Plain tabby weave catches light for a subtle shimmer. 28×80 in. Fringe-finished ends.',
        wholesalePriceInr: 1400, moq: 10, leadTime: W2, weightGrams: 200, categories: ['Textiles & Fabric', 'Handwoven Textiles', 'Stoles & Scarves'], tags: ['stole', 'handwoven', 'cotton-silk', 'yeola'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('stole,scarf,handwoven,silk', 249), variants: [{sku: 'MTS-STL-007', priceInr: 1400, stock: 150, status: ACT, attrs: [{name: 'Fiber', value: 'Cotton-Silk'}]}] },
      { name: 'Handwoven Wool-Cotton Shawl', shortDescription: 'Handwoven wool-cotton shawl, 28×80 in., herringbone twill, earthy tones.', fullDescription: '60% wool 40% cotton, woven in twill weave creating a classic herringbone pattern. Warm but lightweight at 280gsm. 28×80 in. Fringe-finished. Dry clean only.',
        wholesalePriceInr: 2200, moq: 8, leadTime: W2, weightGrams: 400, categories: ['Textiles & Fabric', 'Handwoven Textiles', 'Shawls'], tags: ['shawl', 'handwoven', 'herringbone', 'wool'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('shawl,handwoven,wool,wrap', 253), variants: [{sku: 'MTS-SHW-008', priceInr: 2200, stock: 100, status: ACT, attrs: [{name: 'Color', value: 'Earth Tones'}]}] },
      { name: 'Handwoven Cotton Throw & Blanket', shortDescription: 'Handwoven 100% cotton throw, 50×65 in., open-weave lattice pattern, reversible.', fullDescription: 'Woven on frame looms by Maharashtra weavers. Open lattice weave in undyed and naturally dyed cotton stripes. 50×65 in., 220gsm. Reversible. Machine wash cold.',
        wholesalePriceInr: 1800, moq: 10, leadTime: W2, weightGrams: 800, categories: ['Textiles & Fabric', 'Handwoven Textiles', 'Throws & Blankets'], tags: ['throw', 'handwoven', 'cotton', 'lattice'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('throw,blanket,handwoven,cotton', 257), variants: [{sku: 'MTS-THW-009', priceInr: 1800, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Stripes, Natural'}]}] },
      { name: 'Handwoven Khadi by the Metre', shortDescription: 'Handspun handwoven khadi cotton fabric, per metre, 36 in. wide, natural undyed.', fullDescription: '100% handspun handwoven khadi cotton. Natural undyed. 36 in. wide, approximately 120gsm. Suitable for kurtas, shirts, casual trousers. KVIC certified. Sold per metre, minimum 10m.',
        wholesalePriceInr: 320, moq: 100, leadTime: W2, weightGrams: 130, categories: ['Textiles & Fabric', 'Handwoven Textiles', 'Yardage / By Metre'], tags: ['khadi', 'handwoven', 'yardage', 'kvic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('khadi,fabric,handloom,yardage', 261), variants: [{sku: 'MTS-YRD-010', priceInr: 320, stock: 500, status: ACT, attrs: [{name: 'Width', value: '36 in, per metre'}]}] },
      { name: 'Ikat Handwoven Table Runner', shortDescription: 'Ikat-pattern handwoven cotton table runner, 14×72 in., deep blue and ivory.', fullDescription: 'Woven using pre-dyed ikat yarns on handlooms in Maharashtra. Each runner has distinctive ikat blur at pattern edges — a hallmark of authenticity. 14×72 in. Machine wash cold.',
        wholesalePriceInr: 1100, moq: 12, leadTime: W2, weightGrams: 300, categories: ['Textiles & Fabric', 'Handwoven Textiles', 'Table Runners'], tags: ['table-runner', 'ikat', 'handwoven', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('table,runner,ikat,handwoven', 265), variants: [{sku: 'MTS-TRN-011', priceInr: 1100, stock: 150, status: ACT, attrs: [{name: 'Color', value: 'Indigo & Ivory'}]}] },
      { name: 'Jute & Cotton Handwoven Floor Mat', shortDescription: 'Handwoven jute-cotton floor mat, 24×36 in., natural stripe, non-slip backing.', fullDescription: 'Warp: cotton. Weft: natural jute. Flat-weave with 3-stripe pattern. 24×36 in. Non-slip latex backing. For indoor use. Wipe or spot-clean. Eco-certified jute.',
        wholesalePriceInr: 680, moq: 15, leadTime: W2, weightGrams: 700, categories: ['Textiles & Fabric', 'Handwoven Textiles', 'Floor Mats'], tags: ['floor-mat', 'jute', 'handwoven', 'non-slip'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('floor,mat,jute,woven', 269), variants: [{sku: 'MTS-FLM-012', priceInr: 680, stock: 200, status: ACT, attrs: [{name: 'Size', value: '24×36 in'}]}] },
    ],
  },

  // ── Brand 6: Surat Eco Weaves — Textiles (Embroidered + Specialty) ──────────
  {
    email: 'contact@suratecoweaves.com', password: 'Solomon@2025',
    brandName: 'Surat Eco Weaves', slug: 'surat-eco-weaves', city: 'Surat', state: 'Gujarat',
    category: ['Textiles & Fabric'], description: 'Surat studio specialising in embroidered and specialty textiles — ajrakh, ikat, batik and kalamkari.',
    brandStory: 'Born from a collective of 40 weavers and embroiderers in Surat, we bridge traditional craft techniques with contemporary wholesale buyers. Every fabric is GOTS-certified organic and fairly traded.',
    yearFounded: 2008, logoUrl: 'https://picsum.photos/seed/906/200/200', bannerUrl: 'https://picsum.photos/seed/956/1200/400',
    pickupPincode: '395003', instagramHandle: 'suratecoweaves',
    achievementLevel: 'L3_TRUSTED', confirmedOrderCount: 240, avgRating: 4.7, minimumOrderValue: 10000,
    products: [
      // Embroidered Textiles
      { name: 'Kantha Embroidered Tablecloth', shortDescription: 'Hand-kantha-stitched cotton tablecloth, 60×90 in., multicolour running stitch.', fullDescription: 'Layered vintage cotton secured with traditional kantha running stitch in multicolour threads. Each cloth is unique. 60×90 in., seats 6. Hand wash recommended.',
        wholesalePriceInr: 2400, moq: 6, leadTime: W2, weightGrams: 1100, categories: ['Textiles & Fabric', 'Embroidered Textiles', 'Tablecloths'], tags: ['tablecloth', 'kantha', 'embroidered', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('embroidered,tablecloth,kantha', 273), variants: [{sku: 'SEW-TCL-001', priceInr: 2400, stock: 80, status: ACT, attrs: [{name: 'Color', value: 'Multicolour'}]}] },
      { name: 'Phulkari Embroidered Cushion Covers Set of 3', shortDescription: 'Set of 3 phulkari-embroidered cotton cushion covers, 18×18 in., vibrant silk thread.', fullDescription: 'Traditional phulkari embroidery worked in silk thread on cotton base. Three coordinating geometric floral designs. Zip closure. 18×18 in. Dry clean recommended.',
        wholesalePriceInr: 1800, moq: 8, leadTime: W3, weightGrams: 450, categories: ['Textiles & Fabric', 'Embroidered Textiles', 'Cushion Covers'], tags: ['cushion', 'phulkari', 'embroidered', 'silk'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('phulkari,embroidered,cushion', 277), variants: [{sku: 'SEW-CUS-002', priceInr: 1800, stock: 100, status: ACT, attrs: [{name: 'Color', value: 'Vibrant Mix'}]}] },
      { name: 'Chikankari Embroidered Kurta Fabric', shortDescription: 'Chikankari embroidered muslin kurta fabric, 2.5m, white-on-white floral.', fullDescription: 'Traditional Lucknowi chikankari embroidery on 70-count muslin. White-on-white shadow-work floral pattern. 2.5m × 44 in. wide. Suitable for women\'s kurtas and men\'s kurtas.',
        wholesalePriceInr: 1200, moq: 15, leadTime: W3, weightGrams: 300, categories: ['Textiles & Fabric', 'Embroidered Textiles', 'Kurta Fabric'], tags: ['kurta-fabric', 'chikankari', 'muslin', 'embroidered'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('chikankari,embroidered,fabric,kurta', 281), variants: [{sku: 'SEW-KRT-003', priceInr: 1200, stock: 200, status: ACT, attrs: [{name: 'Color', value: 'White on White'}]}] },
      { name: 'Mirror-Work Embroidered Wall Hanging', shortDescription: 'Kutch mirror-work embroidered cotton wall hanging, 24×36 in., geometric pattern.', fullDescription: 'Kutch embroidery with hand-set circular mirrors (shisha) and coloured cotton thread on natural cotton. Geometric patterns. 24×36 in. Wooden dowel and jute cord included.',
        wholesalePriceInr: 2200, moq: 5, leadTime: W3, weightGrams: 550, categories: ['Textiles & Fabric', 'Embroidered Textiles', 'Wall Hangings'], tags: ['wall-hanging', 'mirror-work', 'kutch', 'embroidered'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('mirror,work,embroidered,kutch', 285), variants: [{sku: 'SEW-WHG-004', priceInr: 2200, stock: 70, status: ACT, attrs: [{name: 'Color', value: 'Multicolour'}]}] },
      { name: 'Suzani Embroidered Canvas Tote Bag', shortDescription: 'Hand-embroidered suzani-style cotton tote bag, 35×40 cm, colourful floral on natural.', fullDescription: 'Heavy-duty 400gsm cotton canvas with suzani-inspired chain-stitch embroidery in red, orange and turquoise. Reinforced handles, 50 cm drop. Flat base, 35×40×10 cm.',
        wholesalePriceInr: 1100, moq: 10, leadTime: W2, weightGrams: 450, categories: ['Textiles & Fabric', 'Embroidered Textiles', 'Tote Bags'], tags: ['tote', 'embroidered', 'suzani', 'canvas'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('embroidered,tote,bag,canvas', 289), variants: [{sku: 'SEW-TOT-005', priceInr: 1100, stock: 150, status: ACT, attrs: [{name: 'Color', value: 'Natural with Floral'}]}] },
      { name: 'Zari-Embroidered Dupatta', shortDescription: 'Sheer georgette dupatta with zari (gold thread) border embroidery, 28×90 in.', fullDescription: 'Georgette base fabric with hand-stitched zari thread running border. Light and airy for draping. 28×90 in. Dry clean. Suitable for salwar suits and lehenga sets.',
        wholesalePriceInr: 1600, moq: 12, leadTime: W2, weightGrams: 200, categories: ['Textiles & Fabric', 'Embroidered Textiles', 'Dupatta'], tags: ['dupatta', 'zari', 'georgette', 'embroidered'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('dupatta,zari,embroidered,sheer', 293), variants: [{sku: 'SEW-DUP-006', priceInr: 1600, stock: 180, status: ACT, attrs: [{name: 'Color', value: 'Gold on Ivory'}]}] },
      // Specialty Textiles
      { name: 'Ikat Woven Fabric Yardage', shortDescription: 'Double ikat woven cotton yardage, per metre, 44 in. wide, geometric pattern.', fullDescription: 'True double ikat: both warp and weft yarns resist-dyed before weaving. Geometric pattern in deep indigo and rust. 44 in. wide, 180gsm. Sold per metre, minimum 10 metres.',
        wholesalePriceInr: 620, moq: 100, leadTime: W2, weightGrams: 200, categories: ['Textiles & Fabric', 'Specialty Textiles', 'Yardage'], tags: ['ikat', 'yardage', 'double-ikat', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('ikat,fabric,yardage,weave', 297), variants: [{sku: 'SEW-YRD-007', priceInr: 620, stock: 400, status: ACT, attrs: [{name: 'Width', value: '44 in, per metre'}]}] },
      { name: 'Ajrakh Block-Print Modal Stole', shortDescription: 'Ajrakh resist block-printed modal stole, 28×80 in., deep indigo and madder rust.', fullDescription: 'Two-pass ajrakh resist printing on soft 100% modal. Deep indigo and madder rust geometric tile pattern. 28×80 in. Fringe ends. Modal drapes beautifully and is machine washable.',
        wholesalePriceInr: 1800, moq: 10, leadTime: W2, weightGrams: 280, categories: ['Textiles & Fabric', 'Specialty Textiles', 'Stoles'], tags: ['stole', 'ajrakh', 'modal', 'resist-print'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('ajrakh,stole,modal,fabric', 301), variants: [{sku: 'SEW-STL-008', priceInr: 1800, stock: 120, status: ACT, attrs: [{name: 'Fiber', value: 'Modal'}]}] },
      { name: 'Shibori-Dyed Silk Dupatta', shortDescription: 'Hand-folded and resist-dyed shibori silk dupatta, 28×90 in., indigo on ivory.', fullDescription: 'Pure silk dupatta hand-resist-dyed using Japanese-inspired shibori fold-and-dye technique. Indigo blue on ivory base. Unique pattern on each piece. 28×90 in. Dry clean.',
        wholesalePriceInr: 2200, moq: 8, leadTime: W3, weightGrams: 180, categories: ['Textiles & Fabric', 'Specialty Textiles', 'Dupatta'], tags: ['dupatta', 'shibori', 'silk', 'indigo'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA'],
        photos: pics('shibori,silk,dupatta,indigo', 305), variants: [{sku: 'SEW-DPS-009', priceInr: 2200, stock: 100, status: ACT, attrs: [{name: 'Fiber', value: 'Pure Silk'}]}] },
      { name: 'Kalamkari Hand-Painted Silk Saree', shortDescription: 'Kalamkari hand-painted pure silk saree, 6m, mythological motifs, Machilipatnam style.', fullDescription: 'Machilipatnam kalamkari: vegetable-dyed hand-painting on pure mulberry silk. Mythological panel narrative. 6m length, 44 in. width. Unstitched blouse piece included. Dry clean only.',
        wholesalePriceInr: 7500, moq: 2, leadTime: W3, weightGrams: 700, categories: ['Textiles & Fabric', 'Specialty Textiles', 'Sarees'], tags: ['saree', 'kalamkari', 'silk', 'handpainted'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('saree,kalamkari,silk,india', 309), variants: [{sku: 'SEW-SAR-010', priceInr: 7500, stock: 30, status: ACT, attrs: [{name: 'Fabric', value: 'Pure Silk'}]}] },
      { name: 'Batik Cotton Running Fabric', shortDescription: 'Batik wax-resist printed cotton running fabric, 30m bolt, 44 in. wide.', fullDescription: 'Traditional batik wax-resist printing on 100% cotton using natural and synthetic dyes. Classic floral crackle pattern in indigo, rust and cream. 30m bolt, 44 in. wide, 140gsm.',
        wholesalePriceInr: 320, moq: 120, leadTime: W2, weightGrams: 140, categories: ['Textiles & Fabric', 'Specialty Textiles', 'Running Fabric'], tags: ['batik', 'running-fabric', 'cotton', 'wax-resist'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('batik,fabric,cotton,print', 313), variants: [{sku: 'SEW-RUN-011', priceInr: 320, stock: 200, status: ACT, attrs: [{name: 'Length', value: '30m bolt, per metre price'}]}] },
    ],
  },

  // ── Brand 7: Ahmedabad Silver Works — Jewellery & Accessories ────────────────
  {
    email: 'contact@ahmedabadsilver.com', password: 'Solomon@2025',
    brandName: 'Ahmedabad Silver Works', slug: 'ahmedabad-silver-works', city: 'Ahmedabad', state: 'Gujarat',
    category: ['Jewellery & Accessories'], description: 'Ahmedabad silversmith collective crafting fine, fashion and accessory jewellery using traditional Gujarati techniques.',
    brandStory: 'Three generations of Gujarati silver-smiths working from a collective workshop in Ahmedabad. We produce hallmarked sterling silver fine jewellery, oxidised fashion jewellery, and fabric accessories for boutiques worldwide.',
    yearFounded: 1972, logoUrl: 'https://picsum.photos/seed/907/200/200', bannerUrl: 'https://picsum.photos/seed/957/1200/400',
    pickupPincode: '380001', instagramHandle: 'ahmedabadsilverworks',
    achievementLevel: 'L4_ELITE', confirmedOrderCount: 480, avgRating: 4.9, minimumOrderValue: 12000,
    products: [
      // Fine Jewellery
      { name: 'Sterling Silver Kundan Necklace', shortDescription: 'Handcrafted sterling silver kundan-set necklace with uncut diamonds, 18 in. chain.', fullDescription: 'Sterling silver with 22k gold plating. Kundan setting with uncut polki diamonds and semi-precious stones. BIS hallmarked. 18 in. chain with lobster clasp. Velvet box included.',
        wholesalePriceInr: 8500, moq: 2, leadTime: W3, weightGrams: 45, categories: ['Jewellery & Accessories', 'Fine Jewellery', 'Necklaces'], tags: ['necklace', 'kundan', 'sterling-silver', 'fine-jewellery'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('gold,necklace,jewellery,kundan', 317), variants: [{sku: 'ASW-FNK-001', priceInr: 8500, stock: 20, status: ACT, attrs: [{name: 'Metal', value: 'Sterling Silver, Gold Plated'}]}] },
      { name: 'Silver Jhumka Drop Earrings', shortDescription: 'Handcrafted sterling silver jhumka drop earrings with pearl drops, hallmarked.', fullDescription: 'Traditional jhumka (bell-drop) earrings in sterling silver with granulation detail. Two freshwater pearl drops per earring. BIS hallmarked. Push-back fitting. Weight approx 12g per pair.',
        wholesalePriceInr: 2800, moq: 6, leadTime: W2, weightGrams: 24, categories: ['Jewellery & Accessories', 'Fine Jewellery', 'Earrings'], tags: ['earrings', 'jhumka', 'silver', 'pearl'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('jhumka,earrings,silver,india', 321), variants: [{sku: 'ASW-FEJ-002', priceInr: 2800, stock: 60, status: ACT, attrs: [{name: 'Stone', value: 'Freshwater Pearl'}]}] },
      { name: 'Silver Filigree Bangle Set', shortDescription: 'Set of 3 sterling silver filigree bangles, 2.6 in. inner diameter.', fullDescription: 'Hand-twisted silver wire worked into traditional Odisha filigree patterns. 92.5 sterling silver, BIS hallmarked. Inner diameter 2.6 in. (fits wrist 6–7 in.). Set of 3 graduated widths.',
        wholesalePriceInr: 3500, moq: 4, leadTime: W3, weightGrams: 40, categories: ['Jewellery & Accessories', 'Fine Jewellery', 'Bracelets & Bangles'], tags: ['bangle', 'filigree', 'silver', 'sterling'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('silver,bangle,filigree,bracelet', 325), variants: [{sku: 'ASW-FBG-003', priceInr: 3500, stock: 40, status: ACT, attrs: [{name: 'Diameter', value: '2.6 in, set of 3'}]}] },
      { name: 'Silver Turquoise Statement Ring', shortDescription: 'Handcrafted sterling silver ring with genuine turquoise, adjustable size 6–9.', fullDescription: 'Bezel-set genuine Persian turquoise in hand-hammered sterling silver band. Adjustable size 6–9. BIS hallmarked. Each stone is unique in colour and pattern.',
        wholesalePriceInr: 1800, moq: 8, leadTime: W2, weightGrams: 15, categories: ['Jewellery & Accessories', 'Fine Jewellery', 'Rings'], tags: ['ring', 'turquoise', 'silver', 'adjustable'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('silver,ring,turquoise,gemstone', 329), variants: [{sku: 'ASW-FRG-004', priceInr: 1800, stock: 80, status: ACT, attrs: [{name: 'Stone', value: 'Persian Turquoise'}]}] },
      { name: 'Silver Lotus Pendant with Chain', shortDescription: 'Sterling silver hand-engraved lotus pendant, 2 cm, with 18 in. box chain.', fullDescription: 'Hand-engraved sterling silver lotus motif pendant, 2 cm diameter. Paired with an 18 in. sterling silver box chain, spring ring clasp. BIS hallmarked. Organza gift pouch included.',
        wholesalePriceInr: 1400, moq: 10, leadTime: W2, weightGrams: 10, categories: ['Jewellery & Accessories', 'Fine Jewellery', 'Pendants'], tags: ['pendant', 'lotus', 'silver', 'chain'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('silver,pendant,lotus,necklace', 333), variants: [{sku: 'ASW-FPD-005', priceInr: 1400, stock: 120, status: ACT, attrs: [{name: 'Metal', value: 'Sterling Silver'}]}] },
      { name: 'Silver Ghungroo Anklet Pair', shortDescription: 'Traditional sterling silver ghungroo anklet pair, adjustable 9–10 in.', fullDescription: 'Sterling silver chain anklets with hand-set ghungroo (silver bells). BIS hallmarked. Adjustable length 9–10 in. Lobster clasp. Set of 2 matching anklets. Traditional Indian bridal style.',
        wholesalePriceInr: 2200, moq: 6, leadTime: W2, weightGrams: 35, categories: ['Jewellery & Accessories', 'Fine Jewellery', 'Anklets'], tags: ['anklet', 'ghungroo', 'silver', 'traditional'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('anklet,silver,ghungroo,india', 337), variants: [{sku: 'ASW-FAK-006', priceInr: 2200, stock: 70, status: ACT, attrs: [{name: 'Size', value: '9–10 in, pair'}]}] },
      // Fashion Jewellery
      { name: 'Oxidised Brass Layered Necklace', shortDescription: 'Oxidised brass layered statement necklace with tribal motifs, 16–20 in.', fullDescription: 'Three-layer oxidised brass necklace with tribal geometric pendants. Adjustable chain 16–20 in. Nickel-free. Antique silver finish. Lightweight at 80g. Hypoallergenic coating.',
        wholesalePriceInr: 850, moq: 12, leadTime: W2, weightGrams: 80, categories: ['Jewellery & Accessories', 'Fashion Jewellery', 'Necklaces'], tags: ['necklace', 'oxidised', 'brass', 'tribal'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('oxidised,brass,necklace,tribal', 341), variants: [{sku: 'ASW-FJN-007', priceInr: 850, stock: 150, status: ACT, attrs: [{name: 'Finish', value: 'Antique Silver'}]}] },
      { name: 'Enamel & Brass Jhumka Earrings', shortDescription: 'Hand-painted enamel jhumka earrings in brass, meenakari style, hook fitting.', fullDescription: 'Brass jhumka earrings with hand-applied meenakari enamel in royal blue and green. Hook fitting. Nickel-free. Weight 15g per pair. Available in 3 colourways.',
        wholesalePriceInr: 650, moq: 15, leadTime: W2, weightGrams: 30, categories: ['Jewellery & Accessories', 'Fashion Jewellery', 'Earrings'], tags: ['earrings', 'meenakari', 'enamel', 'jhumka'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('meenakari,jhumka,enamel,earrings', 345), variants: [
          {sku: 'ASW-FJE-008-BL', priceInr: 650, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Royal Blue'}]},
          {sku: 'ASW-FJE-008-GR', priceInr: 650, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Emerald Green'}]} ] },
      { name: 'German Silver Bead Bracelet', shortDescription: 'Hand-strung German silver and semi-precious bead bracelet, adjustable.', fullDescription: 'German silver spacer beads alternating with faceted amethyst, turquoise or onyx. Adjustable macramé closure. One size fits most. Nickel-free silver plate.',
        wholesalePriceInr: 480, moq: 20, leadTime: W2, weightGrams: 25, categories: ['Jewellery & Accessories', 'Fashion Jewellery', 'Bracelets'], tags: ['bracelet', 'german-silver', 'beads', 'semi-precious'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('bracelet,silver,beads,gemstone', 349), variants: [
          {sku: 'ASW-FJB-009-AM', priceInr: 480, stock: 150, status: ACT, attrs: [{name: 'Stone', value: 'Amethyst'}]},
          {sku: 'ASW-FJB-009-TQ', priceInr: 480, stock: 150, status: ACT, attrs: [{name: 'Stone', value: 'Turquoise'}]} ] },
      { name: 'Oxidised Brass Kada Bangles Set of 2', shortDescription: 'Set of 2 oxidised brass kadas (thick bangles), tribal motif engraving, 2.6 in.', fullDescription: 'Heavy cast brass kadas with hand-engraved tribal motifs. Oxidised finish with highlight polishing. 2.6 in. inner diameter. Set of 2 matching kadas. Nickel-free.',
        wholesalePriceInr: 750, moq: 10, leadTime: W2, weightGrams: 120, categories: ['Jewellery & Accessories', 'Fashion Jewellery', 'Bangles & Kadas'], tags: ['kada', 'bangle', 'brass', 'oxidised'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('bangle,kada,brass,oxidised', 353), variants: [{sku: 'ASW-FJK-010', priceInr: 750, stock: 100, status: ACT, attrs: [{name: 'Diameter', value: '2.6 in, set of 2'}]}] },
      { name: 'Kundan Maang Tikka', shortDescription: 'Kundan-set brass maang tikka with pearl drop, adjustable chain.', fullDescription: 'Central kundan-set stone with pearl drop pendant. Adjustable silk-cord chain for placement at hair parting. Brass with gold-tone plating. Nickel-free. Gift box included.',
        wholesalePriceInr: 950, moq: 10, leadTime: W2, weightGrams: 20, categories: ['Jewellery & Accessories', 'Fashion Jewellery', 'Maang Tikkas'], tags: ['maang-tikka', 'kundan', 'pearl', 'bridal'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('maang,tikka,kundan,bridal', 357), variants: [{sku: 'ASW-FMT-011', priceInr: 950, stock: 80, status: ACT, attrs: [{name: 'Stone', value: 'Kundan with Pearl'}]}] },
      { name: 'Tribal Oxidised Nose Ring (Nath)', shortDescription: 'Oxidised brass tribal nath (nose ring) with hook, 2 cm diameter, no piercing needed.', fullDescription: 'Traditional Rajasthani nath with clip-on hook (no piercing required). Oxidised brass with hand-stamped floral motif. 2 cm outer diameter. Available with and without side chains.',
        wholesalePriceInr: 350, moq: 24, leadTime: W2, weightGrams: 8, categories: ['Jewellery & Accessories', 'Fashion Jewellery', 'Nose Rings'], tags: ['nose-ring', 'nath', 'tribal', 'oxidised'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('nose,ring,nath,tribal,india', 361), variants: [{sku: 'ASW-FNR-012', priceInr: 350, stock: 200, status: ACT, attrs: [{name: 'Fitting', value: 'Clip-on, no piercing'}]}] },
      // Hair Accessories
      { name: 'Brass Floral Hair Pins Set of 6', shortDescription: 'Set of 6 antique brass floral hair pins, bobby-pin style, assorted motifs.', fullDescription: 'Hand-stamped brass hair pins with floral, leaf and bird motifs. Gold-tone antique finish. Bobby-pin grip. 7 cm long. Set of 6 assorted designs. Hair-safe coating.',
        wholesalePriceInr: 420, moq: 20, leadTime: W2, weightGrams: 40, categories: ['Jewellery & Accessories', 'Hair Accessories', 'Hair Pins & Clips'], tags: ['hair-pin', 'brass', 'floral', 'set'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('hair,pin,clip,brass,floral', 365), variants: [{sku: 'ASW-HPN-013', priceInr: 420, stock: 200, status: ACT, attrs: [{name: 'Pack', value: 'Set of 6'}]}] },
      { name: 'Embroidered Fabric Headband', shortDescription: 'Embroidered cotton fabric headband, 2 cm wide, adjustable elastic back.', fullDescription: 'Cotton canvas headband with hand chain-stitch embroidery in multicolour. 2 cm width at front. Adjustable elastic at back fits head circumference 52–60 cm.',
        wholesalePriceInr: 280, moq: 30, leadTime: W2, weightGrams: 30, categories: ['Jewellery & Accessories', 'Hair Accessories', 'Headbands'], tags: ['headband', 'embroidered', 'cotton', 'elastic'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('headband,fabric,embroidered,hair', 369), variants: [{sku: 'ASW-HDB-014', priceInr: 280, stock: 250, status: ACT, attrs: [{name: 'Color', value: 'Multicolour'}]}] },
      { name: 'Block-Print Satin Scrunchie Set of 5', shortDescription: 'Set of 5 block-printed satin scrunchies, assorted prints, ponytail-size.', fullDescription: 'Satin scrunchies with block-printed cotton overlay in indigo, terracotta, sage and mustard prints. Covered elastic, ponytail-size. Set of 5 assorted colours. Machine washable.',
        wholesalePriceInr: 350, moq: 25, leadTime: W2, weightGrams: 50, categories: ['Jewellery & Accessories', 'Hair Accessories', 'Scrunchies'], tags: ['scrunchie', 'blockprint', 'satin', 'set'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('scrunchie,hair,fabric,blockprint', 373), variants: [{sku: 'ASW-SCR-015', priceInr: 350, stock: 300, status: ACT, attrs: [{name: 'Pack', value: 'Set of 5'}]}] },
      { name: 'Carved Sandalwood Hair Comb', shortDescription: 'Hand-carved sandalwood hair comb, 12 cm, floral motif, wide tooth.', fullDescription: 'Solid Mysore sandalwood carved into a wide-tooth comb with floral edge motif. 12 cm length, 5 cm height. Gentle on hair, naturally fragrant. Anti-static. Packaged in cotton pouch.',
        wholesalePriceInr: 550, moq: 15, leadTime: W2, weightGrams: 35, categories: ['Jewellery & Accessories', 'Hair Accessories', 'Hair Combs'], tags: ['hair-comb', 'sandalwood', 'carved', 'wide-tooth'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('hair,comb,wood,carved,sandalwood', 377), variants: [{sku: 'ASW-HCM-016', priceInr: 550, stock: 150, status: ACT, attrs: [{name: 'Wood', value: 'Sandalwood'}]}] },
      { name: 'Silk Ribbon Hair Ties Set of 10', shortDescription: 'Set of 10 silk ribbon hair ties in block-printed cotton, assorted prints.', fullDescription: 'Covered elastic hair ties wrapped in block-printed cotton-silk ribbon. Gentle on hair. 10 cm ribbon tail for tying. Set of 10 assorted prints. Suitable for all hair types.',
        wholesalePriceInr: 380, moq: 25, leadTime: W2, weightGrams: 40, categories: ['Jewellery & Accessories', 'Hair Accessories', 'Hair Ties'], tags: ['hair-tie', 'silk', 'blockprint', 'set'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('hair,tie,ribbon,silk,fabric', 381), variants: [{sku: 'ASW-HTI-017', priceInr: 380, stock: 350, status: ACT, attrs: [{name: 'Pack', value: 'Set of 10'}]}] },
      // Bags & Clutches
      { name: 'Embroidered Potli Bag', shortDescription: 'Hand-embroidered silk potli bag with drawstring, 20×20 cm, kundan-embellished.', fullDescription: 'Pure silk base with hand-done zardozi embroidery and kundan stone embellishments. Drawstring closure with tassel. 20×20 cm. Interior silk lining. Perfect as bridal bag or festival gift.',
        wholesalePriceInr: 1800, moq: 8, leadTime: W3, weightGrams: 150, categories: ['Jewellery & Accessories', 'Bags & Clutches', 'Potli Bags'], tags: ['potli', 'embroidered', 'silk', 'kundan'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('potli,bag,embroidered,silk,india', 385), variants: [{sku: 'ASW-POT-018', priceInr: 1800, stock: 80, status: ACT, attrs: [{name: 'Color', value: 'Gold on Red'}]}] },
      { name: 'Beaded Evening Clutch', shortDescription: 'Hand-beaded evening clutch, 22×12 cm, geometric pattern, satin interior.', fullDescription: 'Hand-applied seed beads in geometric diamond pattern on canvas base. Satin interior with mirror pocket. Kisslock frame closure. 22×12 cm. Wrist chain strap.',
        wholesalePriceInr: 2200, moq: 6, leadTime: W3, weightGrams: 350, categories: ['Jewellery & Accessories', 'Bags & Clutches', 'Clutches'], tags: ['clutch', 'beaded', 'evening', 'geometric'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA', 'MIDDLE_EAST'],
        photos: pics('clutch,beaded,evening,bag', 389), variants: [{sku: 'ASW-CLT-019', priceInr: 2200, stock: 50, status: ACT, attrs: [{name: 'Color', value: 'Multicolour Geometric'}]}] },
      { name: 'Kantha Patchwork Tote Bag', shortDescription: 'Kantha patchwork cotton tote bag, 35×40 cm, with interior zip pocket.', fullDescription: 'Assembled from kantha-stitched sari cotton patches. Interior zip pocket, cotton lining. Two 50 cm cotton handles. 35×40×8 cm. Machine washable. Each bag is unique.',
        wholesalePriceInr: 950, moq: 12, leadTime: W2, weightGrams: 400, categories: ['Jewellery & Accessories', 'Bags & Clutches', 'Tote Bags'], tags: ['tote', 'kantha', 'patchwork', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('tote,bag,kantha,patchwork,cotton', 393), variants: [{sku: 'ASW-TOT-020', priceInr: 950, stock: 120, status: ACT, attrs: [{name: 'Color', value: 'Multicolour Patchwork'}]}] },
      { name: 'Block-Print Canvas Crossbody Bag', shortDescription: 'Block-printed canvas crossbody bag with leather strap, 25×20 cm.', fullDescription: 'Heavy canvas body with indigo block-print motif. Adjustable leather crossbody strap, 90–140 cm. Single main compartment with zip, exterior slip pocket. 25×20×6 cm.',
        wholesalePriceInr: 1400, moq: 8, leadTime: W2, weightGrams: 450, categories: ['Jewellery & Accessories', 'Bags & Clutches', 'Crossbody Bags'], tags: ['crossbody', 'blockprint', 'canvas', 'leather-strap'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('crossbody,bag,canvas,blockprint', 397), variants: [{sku: 'ASW-CRB-021', priceInr: 1400, stock: 80, status: ACT, attrs: [{name: 'Color', value: 'Indigo Print'}]}] },
      { name: 'Embroidered Fabric Backpack', shortDescription: 'Hand-embroidered cotton backpack, 30×40 cm, drawstring with flap, 18L.', fullDescription: 'Cotton canvas backpack with hand-done chain-stitch embroidery on front panel. Drawstring top with embroidered flap cover. Two padded shoulder straps. 18 litre capacity. 30×40 cm.',
        wholesalePriceInr: 1800, moq: 6, leadTime: W3, weightGrams: 700, categories: ['Jewellery & Accessories', 'Bags & Clutches', 'Backpacks'], tags: ['backpack', 'embroidered', 'canvas', 'cotton'], enabledZones: ['DOMESTIC', 'EUROPE', 'NORTH_AMERICA'],
        photos: pics('backpack,embroidered,fabric,canvas', 401), variants: [{sku: 'ASW-BPK-022', priceInr: 1800, stock: 60, status: ACT, attrs: [{name: 'Color', value: 'Natural with Multicolour Embroidery'}]}] },
    ],
  },

];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Starting seed...\n');

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
      "FxRateSnapshot", "Product", "User"
    RESTART IDENTITY CASCADE
  `);
  console.log('   Done.\n');

  const adminHash = await bcrypt.hash('Admin@12345', 12);
  await prisma.user.upsert({
    where: { email: 'admin@solomonbharat.com' },
    update: {},
    create: { email: 'admin@solomonbharat.com', passwordHash: adminHash, name: 'Platform Admin', role: 'ADMIN', isEmailVerified: true },
  });
  console.log('  ✔ Admin user');

  const buyerHash = await bcrypt.hash('Buyer@12345', 12);
  await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com', passwordHash: buyerHash, name: 'Jane Smith', role: 'BUYER', isEmailVerified: true,
      buyerProfile: { create: { businessName: 'Little Boutique NYC', countryCode: 'US', preferredCurrency: 'USD', storeType: 'boutique', aesthetic: 'artisan', categoryInterests: ['Home Décor & Living', 'Jewellery & Accessories', 'Textiles & Fabric'] } },
      wallet: { create: {} }, cart: { create: {} },
    },
  });
  console.log('  ✔ Sample buyer');

  console.log('\nSeeding brands, products, and variants...');
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
  console.log('✅ Seed complete!\n');
  console.log(`  Categories : seeded via seed-taxonomy.js`);
  console.log(`  Brands     : ${BRANDS.length}`);
  console.log(`  Products   : ${totalProducts}`);
  console.log(`  Photos     : ${totalPhotos}`);
  console.log(`  Variants   : ${totalVariants}`);
  console.log('─'.repeat(50) + '\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
