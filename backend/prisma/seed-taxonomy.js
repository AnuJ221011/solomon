/**
 * Solomon Bharat — Category Taxonomy Seed
 * Run: node prisma/seed-taxonomy.js
 *
 * Populates L1 → L2 → L3 categories and CategoryAttribute schemas.
 * Safe to re-run: uses upsert on slug so it won't duplicate.
 */

import prismaClientPkg from '@prisma/client'
const { PrismaClient } = prismaClientPkg
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const slug = (name) =>
  name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// ─── Taxonomy definition ──────────────────────────────────────────────────────
// Each L1 has L2s, each L2 has L3s and attributes.

const TAXONOMY = [
  {
    name: 'Textiles & Fabric', sortOrder: 1,
    imageUrl: 'https://picsum.photos/seed/1001/400/300',
    subcategories: [
      {
        name: 'Block Print Textiles', sortOrder: 1,
        attributes: [
          { name: 'Fabric', inputType: 'SELECT', options: ['Cotton', 'Linen', 'Silk', 'Rayon', 'Viscose', 'Chanderi'], required: true },
          { name: 'Dye type', inputType: 'SELECT', options: ['Natural dyes', 'Azo-free synthetic', 'Indigo', 'Vegetable dyes', 'Reactive dyes'] },
          { name: 'Technique', inputType: 'SELECT', options: ['Hand block print', 'Screen print', 'Resist print', 'Digital print'] },
          { name: 'Care', inputType: 'SELECT', options: ['Hand wash only', 'Machine wash cold', 'Dry clean only'] },
        ],
        productTypes: ['Cushion Covers', 'Table Linen', 'Bed Linen', 'Dress Material', 'Apparel Fabric', 'Running Fabric'],
      },
      {
        name: 'Handwoven Textiles', sortOrder: 2,
        attributes: [
          { name: 'Fibre', inputType: 'SELECT', options: ['Cotton', 'Silk', 'Wool', 'Jute', 'Bamboo', 'Linen', 'Khadi'], required: true },
          { name: 'Weave type', inputType: 'SELECT', options: ['Plain weave', 'Twill', 'Satin', 'Dobby', 'Jacquard', 'Tapestry'] },
          { name: 'Region of origin', inputType: 'SELECT', options: ['Rajasthan', 'Gujarat', 'West Bengal', 'Odisha', 'Andhra Pradesh', 'Tamil Nadu', 'Uttar Pradesh', 'Manipur', 'Assam'] },
          { name: 'GSM', inputType: 'SELECT', options: ['Under 100gsm', '100–150gsm', '150–250gsm', '250gsm+'] },
        ],
        productTypes: ['Stoles & Scarves', 'Shawls', 'Throws & Blankets', 'Yardage / By Metre', 'Table Runners', 'Floor Mats'],
      },
      {
        name: 'Embroidered Textiles', sortOrder: 3,
        attributes: [
          { name: 'Embroidery style', inputType: 'SELECT', options: ['Kantha', 'Chikankari', 'Phulkari', 'Zari', 'Mirror work', 'Crewel', 'Kutch embroidery'], required: true },
          { name: 'Base fabric', inputType: 'SELECT', options: ['Cotton', 'Silk', 'Muslin', 'Georgette', 'Chanderi'] },
          { name: 'Thread type', inputType: 'SELECT', options: ['Cotton thread', 'Silk thread', 'Metallic thread', 'Wool thread'] },
        ],
        productTypes: ['Tablecloths', 'Cushion Covers', 'Kurta Fabric', 'Wall Hangings', 'Tote Bags', 'Dupatta'],
      },
      {
        name: 'Specialty Textiles', sortOrder: 4,
        attributes: [
          { name: 'Craft tradition', inputType: 'SELECT', options: ['Ikat', 'Ajrakh', 'Kalamkari', 'Dabu print', 'Batik', 'Shibori', 'Bagh print'], required: true },
          { name: 'Fibre', inputType: 'SELECT', options: ['Cotton', 'Silk', 'Modal', 'Viscose'] },
        ],
        productTypes: ['Yardage', 'Stoles', 'Dupatta', 'Sarees', 'Running Fabric'],
      },
    ],
  },
  {
    name: 'Home Décor & Living', sortOrder: 2,
    imageUrl: 'https://picsum.photos/seed/1002/400/300',
    subcategories: [
      {
        name: 'Candles & Holders', sortOrder: 1,
        attributes: [
          { name: 'Wax type', inputType: 'SELECT', options: ['Soy wax', 'Beeswax', 'Coconut wax', 'Palm wax', 'Paraffin blend'], required: true },
          { name: 'Scent', inputType: 'MULTI_SELECT', options: ['Unscented', 'Floral', 'Woody', 'Citrus', 'Earthy', 'Spiced', 'Fresh', 'Amber & Musk'] },
          { name: 'Vessel material', inputType: 'SELECT', options: ['Glass', 'Ceramic', 'Metal tin', 'Clay / Terracotta', 'Bamboo', 'Concrete'] },
          { name: 'Burn time', inputType: 'SELECT', options: ['Under 20 hrs', '20–40 hrs', '40–60 hrs', '60–80 hrs', '80 hrs+'] },
        ],
        productTypes: ['Soy Candles', 'Beeswax Candles', 'Candle Holders', 'Votives & Tealights', 'Pillar Candles', 'Reed Diffusers'],
      },
      {
        name: 'Wall Décor', sortOrder: 2,
        attributes: [
          { name: 'Style', inputType: 'MULTI_SELECT', options: ['Bohemian', 'Minimal', 'Traditional', 'Contemporary', 'Coastal', 'Maximalist'] },
          { name: 'Material', inputType: 'SELECT', options: ['Fabric', 'Wood', 'Metal', 'Paper', 'Ceramic', 'Macramé', 'Mixed media'] },
          { name: 'Room', inputType: 'MULTI_SELECT', options: ['Living room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Kids room'] },
        ],
        productTypes: ['Tapestries', 'Framed Art', 'Wall Hangings', 'Mirrors', 'Macramé Wall Art', 'Woven Panels'],
      },
      {
        name: 'Storage & Organisation', sortOrder: 3,
        attributes: [
          { name: 'Material', inputType: 'SELECT', options: ['Seagrass', 'Jute', 'Bamboo', 'Cane', 'Cotton rope', 'Wood', 'Leather'] },
          { name: 'Eco-friendly', inputType: 'BOOLEAN', options: [] },
        ],
        productTypes: ['Baskets', 'Boxes & Trays', 'Shelving Accessories', 'Wall Organisers', 'Storage Bins'],
      },
      {
        name: 'Tabletop & Dining', sortOrder: 4,
        attributes: [
          { name: 'Material', inputType: 'SELECT', options: ['Cotton', 'Linen', 'Jute', 'Bamboo', 'Cork', 'Leather'] },
          { name: 'Style', inputType: 'SELECT', options: ['Block print', 'Embroidered', 'Plain', 'Woven', 'Printed'] },
          { name: 'Set size', inputType: 'SELECT', options: ['Single', 'Set of 2', 'Set of 4', 'Set of 6', 'Set of 8'] },
        ],
        productTypes: ['Placemats', 'Table Runners', 'Napkins & Napkin Rings', 'Coasters', 'Table Cloths'],
      },
      {
        name: 'Soft Furnishings', sortOrder: 5,
        attributes: [
          { name: 'Fill type', inputType: 'SELECT', options: ['Cotton fill', 'Polyester fill', 'Cover only (no fill)'] },
          { name: 'Material', inputType: 'SELECT', options: ['Cotton', 'Linen', 'Wool', 'Velvet', 'Silk', 'Jute'] },
          { name: 'Style', inputType: 'MULTI_SELECT', options: ['Bohemian', 'Minimal', 'Printed', 'Embroidered', 'Woven'] },
        ],
        productTypes: ['Cushion Covers', 'Throw Pillows', 'Throws & Blankets', 'Rugs & Dhurries', 'Floor Cushions'],
      },
    ],
  },
  {
    name: 'Jewellery & Accessories', sortOrder: 3,
    imageUrl: 'https://picsum.photos/seed/1003/400/300',
    subcategories: [
      {
        name: 'Fine Jewellery', sortOrder: 1,
        attributes: [
          { name: 'Metal', inputType: 'SELECT', options: ['Sterling silver', '18k gold', '22k gold', 'Gold-filled', 'Rose gold', 'Platinum'], required: true },
          { name: 'Gemstone', inputType: 'MULTI_SELECT', options: ['No stone', 'Diamond', 'Ruby', 'Emerald', 'Sapphire', 'Pearl', 'Opal', 'Turquoise'] },
          { name: 'Making technique', inputType: 'SELECT', options: ['Handcrafted', 'Cast', 'Filigree', 'Kundan', 'Meenakari', 'Jadau'] },
          { name: 'Certification', inputType: 'SELECT', options: ['Hallmarked', 'BIS certified', 'Uncertified'] },
        ],
        productTypes: ['Necklaces', 'Earrings', 'Bracelets & Bangles', 'Rings', 'Pendants', 'Anklets'],
      },
      {
        name: 'Fashion Jewellery', sortOrder: 2,
        attributes: [
          { name: 'Base material', inputType: 'SELECT', options: ['Brass', 'German silver', 'Copper', 'Terracotta', 'Wood', 'Bone & Horn', 'Fabric'] },
          { name: 'Finish', inputType: 'SELECT', options: ['Antique gold', 'Antique silver', 'Oxidised', 'Enamel', 'Painted', 'Natural'] },
          { name: 'Style', inputType: 'MULTI_SELECT', options: ['Tribal', 'Boho', 'Contemporary', 'Traditional', 'Minimal'] },
        ],
        productTypes: ['Necklaces', 'Earrings', 'Bracelets', 'Bangles & Kadas', 'Maang Tikkas', 'Nose Rings'],
      },
      {
        name: 'Hair Accessories', sortOrder: 3,
        attributes: [
          { name: 'Material', inputType: 'SELECT', options: ['Metal', 'Fabric', 'Wood', 'Resin', 'Cane'] },
        ],
        productTypes: ['Hair Pins & Clips', 'Headbands', 'Scrunchies', 'Hair Combs', 'Hair Ties'],
      },
      {
        name: 'Bags & Clutches', sortOrder: 4,
        attributes: [
          { name: 'Material', inputType: 'SELECT', options: ['Fabric', 'Leather', 'Jute', 'Cane & Bamboo', 'Beaded', 'Embroidered fabric'], required: true },
          { name: 'Closure', inputType: 'SELECT', options: ['Zip', 'Clasp', 'Drawstring', 'Flap', 'Open top'] },
          { name: 'Style', inputType: 'SELECT', options: ['Potli', 'Clutch', 'Tote', 'Crossbody', 'Backpack', 'Baguette'] },
        ],
        productTypes: ['Potli Bags', 'Clutches', 'Tote Bags', 'Crossbody Bags', 'Backpacks'],
      },
    ],
  },
  {
    name: 'Apparel & Clothing', sortOrder: 4,
    imageUrl: 'https://picsum.photos/seed/1004/400/300',
    subcategories: [
      {
        name: 'Tops', sortOrder: 1,
        attributes: [
          { name: 'Fabric', inputType: 'SELECT', options: ['Cotton', 'Linen', 'Silk', 'Chanderi', 'Georgette', 'Rayon', 'Khadi'], required: true },
          { name: 'Fit', inputType: 'SELECT', options: ['Relaxed', 'Regular', 'Fitted', 'Oversized'] },
          { name: 'Sleeve length', inputType: 'SELECT', options: ['Sleeveless', 'Short sleeve', 'Three-quarter', 'Full sleeve'] },
          { name: 'Size range', inputType: 'SELECT', options: ['XS–L', 'S–XL', 'S–2XL', 'S–3XL', 'Custom sizing'] },
          { name: 'Gender', inputType: 'SELECT', options: ['Women', 'Men', 'Unisex'] },
        ],
        productTypes: ['Kurtis', 'Blouses', 'Shirts', 'Tunics', 'Crop Tops', 'Peplum Tops'],
      },
      {
        name: 'Bottoms', sortOrder: 2,
        attributes: [
          { name: 'Fabric', inputType: 'SELECT', options: ['Cotton', 'Linen', 'Rayon', 'Silk', 'Khadi'] },
          { name: 'Fit', inputType: 'SELECT', options: ['Straight', 'Wide leg', 'Flared', 'Tapered', 'Relaxed'] },
          { name: 'Waistband', inputType: 'SELECT', options: ['Elastic waist', 'Drawstring', 'Fixed waist', 'Smocked'] },
          { name: 'Size range', inputType: 'SELECT', options: ['XS–L', 'S–XL', 'S–2XL', 'Custom sizing'] },
        ],
        productTypes: ['Palazzos', 'Salwars', 'Trousers', 'Skirts', 'Leggings'],
      },
      {
        name: 'Sets & Suits', sortOrder: 3,
        attributes: [
          { name: 'Pieces included', inputType: 'SELECT', options: ['2-piece', '3-piece', '4-piece'] },
          { name: 'Fabric', inputType: 'SELECT', options: ['Cotton', 'Silk', 'Chanderi', 'Georgette', 'Linen', 'Khadi'] },
          { name: 'Style', inputType: 'SELECT', options: ['Salwar suit', 'Kurta set', 'Co-ord set', 'Dress set'] },
          { name: 'Size range', inputType: 'SELECT', options: ['XS–L', 'S–XL', 'S–2XL', 'Custom sizing'] },
        ],
        productTypes: ['Salwar Suits', 'Kurta Sets', 'Co-ord Sets', 'Lehenga Sets'],
      },
      {
        name: 'Outerwear', sortOrder: 4,
        attributes: [
          { name: 'Type', inputType: 'SELECT', options: ['Jacket', 'Shawl', 'Cape', 'Waistcoat', 'Coat'] },
          { name: 'Fabric', inputType: 'SELECT', options: ['Wool', 'Cotton', 'Silk', 'Pashmina', 'Linen'] },
        ],
        productTypes: ['Jackets', 'Shawls & Wraps', 'Capes', 'Waistcoats'],
      },
      {
        name: 'Loungewear', sortOrder: 5,
        attributes: [
          { name: 'Fabric', inputType: 'SELECT', options: ['Cotton', 'Modal', 'Bamboo', 'Linen'] },
          { name: 'Set type', inputType: 'SELECT', options: ['Top & bottom set', 'Top only', 'Bottom only', 'Full set'] },
        ],
        productTypes: ['Pyjama Sets', 'Nightwear', 'Yoga Wear', 'Loungewear Sets'],
      },
    ],
  },
  {
    name: 'Food & Wellness', sortOrder: 5,
    imageUrl: 'https://picsum.photos/seed/1005/400/300',
    subcategories: [
      {
        name: 'Teas & Infusions', sortOrder: 1,
        attributes: [
          { name: 'Tea type', inputType: 'SELECT', options: ['Black tea', 'Green tea', 'White tea', 'Oolong', 'Herbal infusion', 'Masala chai', 'Flower tea'], required: true },
          { name: 'Caffeine level', inputType: 'SELECT', options: ['Caffeine-free', 'Low caffeine', 'Medium caffeine', 'High caffeine'] },
          { name: 'Origin', inputType: 'SELECT', options: ['Darjeeling', 'Assam', 'Nilgiri', 'Munnar', 'Sikkim', 'Kangra', 'Blended'] },
          { name: 'Format', inputType: 'SELECT', options: ['Loose leaf', 'Tea bags', 'Tea powder', 'Compressed cake'] },
          { name: 'Weight options', inputType: 'SELECT', options: ['25g', '50g', '100g', '200g', '500g', '1kg'] },
          { name: 'Certifications', inputType: 'MULTI_SELECT', options: ['Organic', 'Fair trade', 'Rainforest Alliance', 'FSSAI', 'USDA Organic'] },
        ],
        productTypes: ['Loose Leaf Tea', 'Masala Chai', 'Herbal Infusions', 'Green Tea', 'White Tea', 'Chai Blends'],
      },
      {
        name: 'Spices & Condiments', sortOrder: 2,
        attributes: [
          { name: 'Product type', inputType: 'SELECT', options: ['Whole spice', 'Ground spice', 'Spice blend', 'Pickle', 'Chutney', 'Sauce', 'Paste'], required: true },
          { name: 'Heat level', inputType: 'SELECT', options: ['Mild', 'Medium', 'Hot', 'Extra hot'] },
          { name: 'Certifications', inputType: 'MULTI_SELECT', options: ['Organic', 'FSSAI certified', 'Non-GMO', 'Preservative-free'] },
          { name: 'Shelf life', inputType: 'SELECT', options: ['3 months', '6 months', '12 months', '24 months', '36 months'] },
        ],
        productTypes: ['Whole Spices', 'Ground Spices', 'Spice Blends', 'Pickles', 'Chutneys & Sauces', 'Curry Pastes'],
      },
      {
        name: 'Snacks & Sweets', sortOrder: 3,
        attributes: [
          { name: 'Dietary', inputType: 'MULTI_SELECT', options: ['Vegan', 'Vegetarian', 'Gluten-free', 'Nut-free', 'Sugar-free'] },
          { name: 'Shelf life', inputType: 'SELECT', options: ['Under 2 weeks', '1 month', '3 months', '6 months'] },
          { name: 'Packaging', inputType: 'SELECT', options: ['Jar', 'Box', 'Tin', 'Pouch', 'Gift set'] },
        ],
        productTypes: ['Artisan Snacks', 'Mithai', 'Chocolates', 'Cookies & Biscuits', 'Energy Bars', 'Roasted Nuts'],
      },
      {
        name: 'Wellness & Superfoods', sortOrder: 4,
        attributes: [
          { name: 'Product type', inputType: 'SELECT', options: ['Honey', 'Oil', 'Ghee', 'Dry fruits', 'Seeds', 'Supplement', 'Syrup'], required: true },
          { name: 'Certifications', inputType: 'MULTI_SELECT', options: ['Organic', 'Raw', 'Cold-pressed', 'FSSAI', 'USDA Organic'] },
        ],
        productTypes: ['Honey & Syrups', 'Cold-pressed Oils', 'Artisan Ghee', 'Dry Fruits & Seeds', 'Adaptogens'],
      },
    ],
  },
  {
    name: 'Art & Craft Objects', sortOrder: 6,
    imageUrl: 'https://picsum.photos/seed/1006/400/300',
    subcategories: [
      {
        name: 'Wall Art', sortOrder: 1,
        attributes: [
          { name: 'Medium', inputType: 'SELECT', options: ['Acrylic', 'Watercolour', 'Oil', 'Ink', 'Mixed media', 'Photography', 'Digital print', 'Gouache'], required: true },
          { name: 'Style', inputType: 'MULTI_SELECT', options: ['Abstract', 'Figurative', 'Landscape', 'Portrait', 'Folk', 'Geometric', 'Botanical'] },
          { name: 'Edition', inputType: 'SELECT', options: ['Original artwork', 'Limited edition print', 'Open edition print'] },
          { name: 'Region of origin', inputType: 'SELECT', options: ['Rajasthan', 'West Bengal', 'Maharashtra', 'Kerala', 'Tamil Nadu', 'Odisha', 'Bihar'] },
        ],
        productTypes: ['Original Paintings', 'Limited Edition Prints', 'Photography', 'Mixed Media'],
      },
      {
        name: 'Folk & Tribal Art', sortOrder: 2,
        attributes: [
          { name: 'Art tradition', inputType: 'SELECT', options: ['Madhubani', 'Warli', 'Gond', 'Pattachitra', 'Pichwai', 'Kalighat', 'Tanjore', 'Miniature'], required: true },
          { name: 'Medium', inputType: 'SELECT', options: ['Paper', 'Fabric', 'Wood', 'Canvas', 'Palm leaf'] },
          { name: 'Region', inputType: 'SELECT', options: ['Bihar', 'Jharkhand', 'Madhya Pradesh', 'Odisha', 'Rajasthan', 'West Bengal', 'Tamil Nadu', 'Karnataka'] },
        ],
        productTypes: ['Madhubani Paintings', 'Warli Art', 'Gond Paintings', 'Pattachitra', 'Pichwai', 'Tanjore Paintings'],
      },
      {
        name: 'Sculpture & Objects', sortOrder: 3,
        attributes: [
          { name: 'Material', inputType: 'SELECT', options: ['Wood', 'Metal', 'Stone', 'Clay', 'Ceramic', 'Papier-mâché', 'Brass', 'Bronze'] },
          { name: 'Style', inputType: 'SELECT', options: ['Traditional', 'Contemporary', 'Abstract', 'Figurative'] },
        ],
        productTypes: ['Figurines & Statues', 'Decorative Objects', 'Abstract Sculpture', 'Ceremonial Objects'],
      },
    ],
  },
  {
    name: 'Stationery & Paper Goods', sortOrder: 7,
    imageUrl: 'https://picsum.photos/seed/1007/400/300',
    subcategories: [
      {
        name: 'Notebooks & Journals', sortOrder: 1,
        attributes: [
          { name: 'Paper type', inputType: 'SELECT', options: ['Ruled', 'Blank', 'Dot grid', 'Handmade paper', 'Watercolour paper'], required: true },
          { name: 'Cover material', inputType: 'SELECT', options: ['Leather', 'Cloth', 'Hardback', 'Softback', 'Recycled'] },
          { name: 'Size', inputType: 'SELECT', options: ['Pocket (A6)', 'Standard (A5)', 'Large (A4)', 'Custom'] },
          { name: 'Occasion', inputType: 'MULTI_SELECT', options: ['Wedding', 'Corporate gift', 'Birthday', 'Festive', 'Everyday'] },
        ],
        productTypes: ['Ruled Notebooks', 'Dot Grid Journals', 'Hardcover Journals', 'Sketchbooks', 'Travel Journals'],
      },
      {
        name: 'Cards & Gifting', sortOrder: 2,
        attributes: [
          { name: 'Paper type', inputType: 'SELECT', options: ['Handmade paper', 'Recycled', 'Coated paper', 'Khadi paper'] },
          { name: 'Occasion', inputType: 'MULTI_SELECT', options: ['Wedding', 'Birthday', 'Diwali', 'Eid', 'Christmas', 'New Year', 'Thank you', 'Just because'] },
          { name: 'Sold as', inputType: 'SELECT', options: ['Single card', 'Pack of 4', 'Pack of 8', 'Pack of 12', 'Custom quantity'] },
        ],
        productTypes: ['Greeting Cards', 'Gift Wrapping', 'Gift Boxes', 'Tags & Labels', 'Envelopes'],
      },
      {
        name: 'Desk Accessories', sortOrder: 3,
        attributes: [
          { name: 'Material', inputType: 'SELECT', options: ['Wood', 'Leather', 'Brass', 'Ceramic', 'Cane', 'Fabric'] },
        ],
        productTypes: ['Pen Holders', 'Desk Organisers', 'Desk Pads', 'Letter Openers', 'Bookmarks'],
      },
      {
        name: 'Art Supplies', sortOrder: 4,
        attributes: [
          { name: 'Medium', inputType: 'SELECT', options: ['Watercolour', 'Calligraphy', 'Block printing', 'Stamp making', 'Natural dye'] },
        ],
        productTypes: ['Watercolour Sets', 'Calligraphy Kits', 'Block Printing Kits', 'Stamps & Ink'],
      },
    ],
  },
  {
    name: 'Ceramics & Pottery', sortOrder: 8,
    imageUrl: 'https://picsum.photos/seed/1008/400/300',
    subcategories: [
      {
        name: 'Tableware', sortOrder: 1,
        attributes: [
          { name: 'Clay type', inputType: 'SELECT', options: ['Stoneware', 'Earthenware', 'Porcelain', 'Terracotta', 'Blue pottery'], required: true },
          { name: 'Finish', inputType: 'SELECT', options: ['Glazed', 'Matte', 'Unglazed', 'Hand-painted', 'Speckled'] },
          { name: 'Food safe', inputType: 'BOOLEAN', options: [] },
          { name: 'Dishwasher safe', inputType: 'BOOLEAN', options: [] },
          { name: 'Sold as', inputType: 'SELECT', options: ['Single piece', 'Set of 2', 'Set of 4', 'Set of 6', 'Full dinner set'] },
        ],
        productTypes: ['Mugs & Cups', 'Bowls', 'Plates', 'Serving Platters', 'Teapots & Tea Sets', 'Side Plates'],
      },
      {
        name: 'Storage & Vases', sortOrder: 2,
        attributes: [
          { name: 'Clay type', inputType: 'SELECT', options: ['Stoneware', 'Earthenware', 'Porcelain', 'Terracotta'] },
          { name: 'Finish', inputType: 'SELECT', options: ['Glazed', 'Matte', 'Unglazed', 'Hand-painted'] },
          { name: 'Purpose', inputType: 'SELECT', options: ['Flower vase', 'Storage jar', 'Planter', 'Kitchen canister'] },
        ],
        productTypes: ['Vases', 'Planters', 'Jars & Canisters', 'Bread Bins'],
      },
      {
        name: 'Decorative Ceramics', sortOrder: 3,
        attributes: [
          { name: 'Style', inputType: 'SELECT', options: ['Folk', 'Contemporary', 'Minimalist', 'Geometric'] },
          { name: 'Technique', inputType: 'SELECT', options: ['Wheel thrown', 'Hand built', 'Cast', 'Sculpted'] },
        ],
        productTypes: ['Figurines', 'Wall Plates', 'Candle Holders', 'Incense Holders', 'Decorative Tiles'],
      },
    ],
  },
  {
    name: 'Leather & Bags', sortOrder: 9,
    imageUrl: 'https://picsum.photos/seed/1009/400/300',
    subcategories: [
      {
        name: 'Bags', sortOrder: 1,
        attributes: [
          { name: 'Leather type', inputType: 'SELECT', options: ['Full grain leather', 'Top grain leather', 'Vegan leather', 'Faux leather'], required: true },
          { name: 'Closure', inputType: 'SELECT', options: ['Zip', 'Buckle', 'Magnetic snap', 'Drawstring', 'Flap'] },
          { name: 'Lining', inputType: 'SELECT', options: ['Fabric lining', 'Leather lining', 'No lining'] },
          { name: 'Colour', inputType: 'SELECT', options: ['Tan', 'Black', 'Brown', 'Natural', 'Cognac', 'Multi-colour', 'Patina'] },
        ],
        productTypes: ['Tote Bags', 'Backpacks', 'Shoulder Bags', 'Messenger Bags', 'Duffel Bags'],
      },
      {
        name: 'Small Accessories', sortOrder: 2,
        attributes: [
          { name: 'Leather type', inputType: 'SELECT', options: ['Full grain', 'Vegan leather', 'Suede'] },
          { name: 'Colour', inputType: 'SELECT', options: ['Tan', 'Black', 'Brown', 'Natural', 'Cognac'] },
        ],
        productTypes: ['Wallets', 'Card Holders', 'Belts', 'Key Fobs', 'Phone Cases'],
      },
      {
        name: 'Footwear', sortOrder: 3,
        attributes: [
          { name: 'Style', inputType: 'SELECT', options: ['Mojaris', 'Kolhapuri', 'Sandals', 'Flats', 'Loafers'] },
          { name: 'Leather type', inputType: 'SELECT', options: ['Full grain leather', 'Suede', 'Vegan leather'] },
          { name: 'Size range', inputType: 'SELECT', options: ['EU 35–40', 'EU 35–42', 'EU 38–44', 'Custom sizing'] },
        ],
        productTypes: ['Mojaris', 'Kolhapuri Sandals', 'Flats', 'Loafers'],
      },
    ],
  },
  {
    name: 'Beauty & Ritual', sortOrder: 10,
    imageUrl: 'https://picsum.photos/seed/1010/400/300',
    subcategories: [
      {
        name: 'Skincare', sortOrder: 1,
        attributes: [
          { name: 'Skin type', inputType: 'MULTI_SELECT', options: ['All skin types', 'Dry', 'Oily', 'Combination', 'Sensitive', 'Mature'] },
          { name: 'Key ingredients', inputType: 'MULTI_SELECT', options: ['Turmeric', 'Neem', 'Rose', 'Sandalwood', 'Kumkumadi', 'Ashwagandha', 'Aloe vera', 'Coconut'] },
          { name: 'Certifications', inputType: 'MULTI_SELECT', options: ['Organic', 'Ayurvedic', 'Cruelty-free', 'Vegan', 'Paraben-free'] },
          { name: 'Format', inputType: 'SELECT', options: ['Cream', 'Serum', 'Oil', 'Balm', 'Powder', 'Mask', 'Cleanser', 'Toner'] },
        ],
        productTypes: ['Face Care', 'Body Care', 'Lip Care', 'Eye Care', 'Suncare'],
      },
      {
        name: 'Hair Care', sortOrder: 2,
        attributes: [
          { name: 'Hair type', inputType: 'MULTI_SELECT', options: ['All hair types', 'Dry', 'Oily', 'Curly', 'Frizzy', 'Coloured', 'Thinning'] },
          { name: 'Key ingredients', inputType: 'MULTI_SELECT', options: ['Coconut oil', 'Bhringraj', 'Amla', 'Brahmi', 'Hibiscus', 'Argan', 'Castor oil'] },
          { name: 'Format', inputType: 'SELECT', options: ['Oil', 'Shampoo', 'Conditioner', 'Mask', 'Serum', 'Powder'] },
          { name: 'Certifications', inputType: 'MULTI_SELECT', options: ['Organic', 'Ayurvedic', 'Sulphate-free', 'Paraben-free', 'Vegan'] },
        ],
        productTypes: ['Hair Oils', 'Shampoos', 'Conditioners', 'Hair Masks', 'Scalp Treatments'],
      },
      {
        name: 'Aromatherapy', sortOrder: 3,
        attributes: [
          { name: 'Product type', inputType: 'SELECT', options: ['Essential oil', 'Incense sticks', 'Incense cones', 'Dhoop', 'Diffuser blend', 'Bath salts', 'Body scrub'] },
          { name: 'Scent family', inputType: 'MULTI_SELECT', options: ['Floral', 'Woody', 'Earthy', 'Citrus', 'Spiced', 'Herbal', 'Resinous'] },
          { name: 'Certifications', inputType: 'MULTI_SELECT', options: ['Pure essential oil', 'Organic', 'No synthetic fragrance'] },
        ],
        productTypes: ['Essential Oils', 'Incense Sticks & Cones', 'Diffuser Blends', 'Bath & Body'],
      },
      {
        name: 'Ritual & Wellness', sortOrder: 4,
        attributes: [
          { name: 'Type', inputType: 'SELECT', options: ['Puja accessories', 'Meditation aid', 'Crystal & stones', 'Smudge & cleansing', 'Yoga props'] },
        ],
        productTypes: ['Puja Accessories', 'Meditation Aids', 'Crystals & Stones', 'Smudge Bundles'],
      },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertCategory({ name, parentId = null, level, sortOrder, imageUrl = null }) {
  const s = slug(name)
  const existing = await prisma.category.findUnique({ where: { slug: s } })
  if (existing) {
    return prisma.category.update({
      where: { slug: s },
      data: { level, sortOrder, parentId, imageUrl },
    })
  }
  return prisma.category.create({
    data: { name, slug: s, level, sortOrder, parentId, imageUrl },
  })
}

async function upsertAttribute(categoryId, { name, inputType, options, required = false, sortOrder = 0 }) {
  const existing = await prisma.categoryAttribute.findFirst({
    where: { categoryId, name },
  })
  if (existing) {
    return prisma.categoryAttribute.update({
      where: { id: existing.id },
      data: { inputType, options, required, sortOrder },
    })
  }
  return prisma.categoryAttribute.create({
    data: { categoryId, name, inputType, options, required, sortOrder },
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding Solomon Bharat category taxonomy…')
  let l1Count = 0, l2Count = 0, l3Count = 0, attrCount = 0

  for (const l1 of TAXONOMY) {
    const l1Cat = await upsertCategory({
      name: l1.name,
      level: 1,
      sortOrder: l1.sortOrder,
      imageUrl: l1.imageUrl,
    })
    l1Count++

    for (const l2 of l1.subcategories) {
      const l2Cat = await upsertCategory({
        name: l2.name,
        parentId: l1Cat.id,
        level: 2,
        sortOrder: l2.sortOrder,
      })
      l2Count++

      // Attributes live on L2
      for (let i = 0; i < (l2.attributes ?? []).length; i++) {
        await upsertAttribute(l2Cat.id, { ...l2.attributes[i], sortOrder: i })
        attrCount++
      }

      // L3 product types
      for (let i = 0; i < (l2.productTypes ?? []).length; i++) {
        await upsertCategory({
          name: l2.productTypes[i],
          parentId: l2Cat.id,
          level: 3,
          sortOrder: i,
        })
        l3Count++
      }
    }
  }

  console.log(`Done: ${l1Count} L1, ${l2Count} L2, ${l3Count} L3 categories, ${attrCount} attributes`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
