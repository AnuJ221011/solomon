import { v2 as cloudinary } from 'cloudinary';
import prisma from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';
import { sendText, downloadMediaBuffer } from './whatsapp.service.js';
import { createProduct } from '../products/product.service.js';
import { cloudinaryFolders } from '../../shared/constants/cloudinary.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const SESSION_TTL_HOURS = 24;
const MAX_PHOTOS = 5;

const LEAD_TIME_MAP = {
  '1': 'ONE_TO_THREE_DAYS',
  '2': 'ONE_TO_TWO_WEEKS',
  '3': 'TWO_TO_FOUR_WEEKS',
};

const LEAD_TIME_LABEL = {
  ONE_TO_THREE_DAYS: '1-3 days',
  ONE_TO_TWO_WEEKS: '1-2 weeks',
  TWO_TO_FOUR_WEEKS: '2-4 weeks',
};

const ZONE_MAP = {
  '1': ['DOMESTIC'],
  '2': ['DOMESTIC', 'SOUTH_ASIA'],
  '3': ['DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD'],
};

const ZONE_LABEL = {
  '1': 'India only',
  '2': 'India + South Asia',
  '3': 'All regions worldwide',
};

// ── Cloudinary upload ─────────────────────────────────────────────────────────

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id })),
    ).end(buffer);
  });
}

// ── Session helpers ───────────────────────────────────────────────────────────

async function loadSession(phone) {
  const session = await prisma.whatsappSession.findUnique({ where: { phone } });
  if (session && new Date() > session.expiresAt) {
    await prisma.whatsappSession.delete({ where: { phone } });
    return null;
  }
  return session;
}

async function saveSession(phone, userId, step, data) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  return prisma.whatsappSession.upsert({
    where: { phone },
    create: { phone, userId, step, data, expiresAt },
    update: { step, data, expiresAt },
  });
}

async function clearSession(phone) {
  await prisma.whatsappSession.deleteMany({ where: { phone } });
}

// ── Categories ────────────────────────────────────────────────────────────────

async function getTopCategories() {
  const cats = await prisma.category.findMany({
    where: { isActive: true, level: 1 },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { name: true },
    take: 8,
  });
  return cats.map((c) => c.name);
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handleInboundMessage(from, message) {
  // Normalise phone variants: look up brand by all likely formats
  const phoneVariants = [from, `+${from}`, from.replace(/^\+/, '')];
  const brand = await prisma.brandProfile.findFirst({
    where: { phone: { in: phoneVariants } },
    include: { user: { select: { id: true } } },
  });

  if (!brand || brand.status !== 'APPROVED') {
    await sendText(from,
      "This number isn't linked to an approved Solomon Bharat seller account.\n\n" +
      `Visit ${env.CLIENT_URL}/apply to get started.`
    );
    return;
  }

  const userId = brand.user.id;
  const session = await loadSession(from);
  const type = message.type;
  const body = (message.text?.body ?? '').trim();

  // Cancel anywhere
  if (body.toLowerCase() === 'cancel') {
    await clearSession(from);
    await sendText(from, "Listing cancelled. Type *list* anytime to start again.");
    return;
  }

  const step = session?.step ?? 'IDLE';
  const data = (session?.data ?? {});

  switch (step) {
    case 'IDLE': {
      const trigger = body.toLowerCase();
      if (['list', 'hi', 'hello', 'start', 'menu'].includes(trigger) || !session) {
        await saveSession(from, userId, 'AWAITING_NAME', {});
        await sendText(from,
          `👋 Hi ${brand.brandName}! Let's list a new product.\n\n` +
          `*Step 1/9 — Product name*\n\nWhat is the product name?\n\nType *cancel* at any time to exit.`
        );
      } else {
        await sendText(from, "Hi! Type *list* to start listing a new product.");
      }
      break;
    }

    case 'AWAITING_NAME': {
      if (!body || body.length < 2) {
        await sendText(from, "Please enter a valid product name (at least 2 characters).");
        return;
      }
      const categories = await getTopCategories();
      const catList = categories.map((c, i) => `${i + 1}. ${c}`).join('\n');
      data.name = body;
      data._categories = categories;
      await saveSession(from, userId, 'AWAITING_CATEGORY', data);
      await sendText(from,
        `✅ *${body}*\n\n*Step 2/9 — Category*\n\n${catList}\n\nReply with the number.`
      );
      break;
    }

    case 'AWAITING_CATEGORY': {
      const categories = data._categories ?? await getTopCategories();
      const idx = parseInt(body, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= categories.length) {
        const catList = categories.map((c, i) => `${i + 1}. ${c}`).join('\n');
        await sendText(from, `Please reply with a number 1–${categories.length}:\n\n${catList}`);
        return;
      }
      data.categories = [categories[idx]];
      await saveSession(from, userId, 'AWAITING_PRICE', data);
      await sendText(from,
        `✅ Category: *${data.categories[0]}*\n\n*Step 3/9 — Price*\n\nWholesale price per unit (₹)?\n\nJust type the number, e.g. *450*`
      );
      break;
    }

    case 'AWAITING_PRICE': {
      const price = parseFloat(body.replace(/,/g, ''));
      if (isNaN(price) || price <= 0) {
        await sendText(from, "Please enter a valid price greater than 0, e.g. *450*");
        return;
      }
      data.wholesalePriceInr = price;
      await saveSession(from, userId, 'AWAITING_MOQ', data);
      await sendText(from,
        `✅ Price: *₹${price}*\n\n*Step 4/9 — Minimum order quantity (MOQ)*\n\nHow many units minimum per order?\n\ne.g. *12*`
      );
      break;
    }

    case 'AWAITING_MOQ': {
      const moq = parseInt(body, 10);
      if (isNaN(moq) || moq < 1) {
        await sendText(from, "Please enter a valid MOQ (minimum 1), e.g. *12*");
        return;
      }
      data.moq = moq;
      await saveSession(from, userId, 'AWAITING_WEIGHT', data);
      await sendText(from,
        `✅ MOQ: *${moq} units*\n\n*Step 5/9 — Weight*\n\nApproximate weight per unit in grams?\n\ne.g. *300* for 300g`
      );
      break;
    }

    case 'AWAITING_WEIGHT': {
      const weight = parseInt(body, 10);
      if (isNaN(weight) || weight < 1) {
        await sendText(from, "Please enter weight in grams (numbers only), e.g. *300*");
        return;
      }
      data.weightGrams = weight;
      await saveSession(from, userId, 'AWAITING_LEAD_TIME', data);
      await sendText(from,
        `✅ Weight: *${weight}g*\n\n*Step 6/9 — Lead time*\n\n1. 1-3 days\n2. 1-2 weeks\n3. 2-4 weeks\n\nReply with the number.`
      );
      break;
    }

    case 'AWAITING_LEAD_TIME': {
      const lt = LEAD_TIME_MAP[body];
      if (!lt) {
        await sendText(from, "Please reply with 1, 2, or 3.");
        return;
      }
      data.leadTime = lt;
      await saveSession(from, userId, 'AWAITING_DESCRIPTION', data);
      await sendText(from,
        `✅ Lead time: *${LEAD_TIME_LABEL[lt]}*\n\n*Step 7/9 — Description*\n\nDescribe the product — materials, sizes, colours, what makes it special.`
      );
      break;
    }

    case 'AWAITING_DESCRIPTION': {
      if (!body || body.length < 10) {
        await sendText(from, "Please enter a description (at least 10 characters).");
        return;
      }
      data.description = body;
      data.photos = [];
      await saveSession(from, userId, 'AWAITING_PHOTOS', data);
      await sendText(from,
        `✅ Description saved.\n\n*Step 8/9 — Photos*\n\nSend up to ${MAX_PHOTOS} product photos one by one.\nType *done* when you're finished.`
      );
      break;
    }

    case 'AWAITING_PHOTOS': {
      data.photos = data.photos ?? [];

      if (body.toLowerCase() === 'done') {
        if (data.photos.length === 0) {
          await sendText(from, "Please send at least 1 photo before typing *done*.");
          return;
        }
        await saveSession(from, userId, 'AWAITING_ZONES', data);
        await sendText(from,
          `✅ ${data.photos.length} photo(s) saved.\n\n*Step 9/9 — Shipping zones*\n\n1. India only\n2. India + South Asia\n3. All regions worldwide\n\nReply with the number.`
        );
        return;
      }

      if (type === 'image') {
        if (data.photos.length >= MAX_PHOTOS) {
          await sendText(from, `You've reached the maximum of ${MAX_PHOTOS} photos. Type *done* to continue.`);
          return;
        }
        try {
          const mediaId = message.image.id;
          const buffer = await downloadMediaBuffer(mediaId);
          let photoData;
          if (buffer) {
            photoData = await uploadBuffer(buffer, cloudinaryFolders.products);
          } else {
            // Mock mode
            photoData = { url: `https://picsum.photos/seed/${Date.now()}/800/800`, publicId: `mock-${Date.now()}` };
          }
          data.photos.push(photoData);
          await saveSession(from, userId, 'AWAITING_PHOTOS', data);
          const remaining = MAX_PHOTOS - data.photos.length;
          await sendText(from,
            `📸 Photo ${data.photos.length} received.` +
            (remaining > 0 ? ` Send more (up to ${remaining} more) or type *done*.` : ` Type *done* to continue.`)
          );
        } catch (err) {
          logger.error('WhatsApp photo upload failed', { err: err.message });
          await sendText(from, "Couldn't save that photo. Please try sending it again.");
        }
      } else {
        await sendText(from, "Please send a photo, or type *done* to continue.");
      }
      break;
    }

    case 'AWAITING_ZONES': {
      const zones = ZONE_MAP[body];
      if (!zones) {
        await sendText(from, "Please reply with 1, 2, or 3.");
        return;
      }
      data.enabledZones = zones;
      await saveSession(from, userId, 'CONFIRM', data);
      await sendText(from,
        `✅ Ready to publish! Here's the summary:\n\n` +
        `📦 *${data.name}*\n` +
        `Category: ${data.categories[0]}\n` +
        `Price: ₹${data.wholesalePriceInr}/unit\n` +
        `MOQ: ${data.moq} units\n` +
        `Weight: ${data.weightGrams}g\n` +
        `Lead time: ${LEAD_TIME_LABEL[data.leadTime]}\n` +
        `Shipping: ${ZONE_LABEL[body]}\n` +
        `Photos: ${data.photos.length}\n\n` +
        `Reply *confirm* to publish or *cancel* to discard.`
      );
      break;
    }

    case 'CONFIRM': {
      if (body.toLowerCase() !== 'confirm') {
        await sendText(from, "Reply *confirm* to publish the product, or *cancel* to discard.");
        return;
      }
      try {
        const product = await createProduct(userId, {
          name: data.name,
          description: data.description,
          wholesalePriceInr: data.wholesalePriceInr,
          moq: data.moq,
          stepQty: 1,
          leadTime: data.leadTime,
          weightGrams: data.weightGrams,
          categories: data.categories,
          enabledZones: data.enabledZones,
          availability: 'ACTIVE',
          tags: [],
        });

        if (data.photos?.length) {
          await prisma.productPhoto.createMany({
            data: data.photos.map((p, i) => ({
              productId: product.id,
              url: p.url,
              publicId: p.publicId,
              position: i,
            })),
          });
        }

        await clearSession(from);
        await sendText(from,
          `🎉 *Product published!*\n\n` +
          `*${product.name}* is now live on Solomon Bharat.\n\n` +
          `View it at:\n${env.CLIENT_URL}/products/${product.slug}\n\n` +
          `Type *list* to add another product.`
        );
      } catch (err) {
        logger.error('WhatsApp product creation failed', { err: err.message });
        await sendText(from, `Could not publish: ${err.message}\n\nType *cancel* to start over.`);
      }
      break;
    }

    default: {
      await clearSession(from);
      await sendText(from, "Session expired. Type *list* to start listing a product.");
    }
  }
}
