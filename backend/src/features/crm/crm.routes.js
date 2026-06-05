import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import prisma from '../../config/db.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { createError } from '../../shared/utils/createError.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { parseCsv } from '../products/product.import.js';
import { send as sendEmail } from '../../shared/utils/email.js';

const router = Router();
router.use(authenticate, authorize('BRAND'));

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

const getBrandId = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  return brand.id;
};

// List CRM contacts
router.get('/contacts', async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const contacts = await prisma.crmContact.findMany({
    where: { brandProfileId },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, contacts);
});

// Add a single contact
router.post('/contacts', validate(z.object({
  name: z.string().optional(),
  email: z.string().email(),
  businessName: z.string().optional(),
  notes: z.string().optional(),
})), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const contact = await prisma.crmContact.upsert({
    where: { brandProfileId_email: { brandProfileId, email: req.body.email } },
    create: { brandProfileId, ...req.body },
    update: req.body,
  });
  sendSuccess(res, contact, 'Contact saved', 201);
});

// Delete a contact
router.delete('/contacts/:id', async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const contact = await prisma.crmContact.findFirst({ where: { id: req.params.id, brandProfileId } });
  if (!contact) throw createError('Contact not found', 404);
  await prisma.crmContact.delete({ where: { id: contact.id } });
  sendSuccess(res, null, 'Contact deleted');
});

// Upload contacts from CSV (columns: name, email, businessName, notes)
router.post('/contacts/import', (req, res, next) => csvUpload.single('file')(req, res, (err) => err ? next(err) : next()), async (req, res) => {
  if (!req.file) throw createError('No CSV file uploaded', 400);
  const brandProfileId = await getBrandId(req.user.id);
  const rows = parseCsv(req.file.buffer.toString('utf-8'));
  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.email) { skipped++; continue; }
    await prisma.crmContact.upsert({
      where: { brandProfileId_email: { brandProfileId, email: row.email } },
      create: { brandProfileId, email: row.email, name: row.name || null, businessName: row.business_name || null, notes: row.notes || null },
      update: { name: row.name || undefined, businessName: row.business_name || undefined },
    }).then(() => imported++).catch(() => skipped++);
  }

  sendSuccess(res, { imported, skipped }, 'Contacts imported');
});

// Send a share link campaign to contacts
router.post('/campaigns/send-share-link', validate(z.object({
  shareLinkId: z.string().min(1),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  contactIds: z.array(z.string()).min(1).optional(),
})), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const brand = await prisma.brandProfile.findUnique({ where: { id: brandProfileId } });

  const shareLink = await prisma.shareLink.findFirst({
    where: { id: req.body.shareLinkId, brandProfileId },
  });
  if (!shareLink) throw createError('Share link not found', 404);

  const shareLinkUrl = shareLink.slug
    ? `https://solomonbharat.com/s/${brand.slug}/${shareLink.slug}`
    : `https://solomonbharat.com/s/${shareLink.token}`;

  const where = { brandProfileId };
  if (req.body.contactIds?.length) where.id = { in: req.body.contactIds };
  const contacts = await prisma.crmContact.findMany({ where });

  let sent = 0;
  for (const contact of contacts) {
    await sendEmail({
      to: contact.email,
      subject: req.body.subject,
      html: `
        <p>${req.body.message}</p>
        <p><a href="${shareLinkUrl}">View ${brand.brandName}'s wholesale catalogue →</a></p>
      `,
    }).then(() => sent++).catch(() => {});
  }

  sendSuccess(res, { sent, total: contacts.length }, `Campaign sent to ${sent} contacts`);
});

export default router;
