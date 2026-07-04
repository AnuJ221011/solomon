import prisma from '../../config/db.js';
import { sendTemplate } from './whatsapp.service.js';
import { logger } from '../../shared/utils/logger.js';

const SEND_DELAY_MS = 150; // ~6 sends/second — safe within Meta limits

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalisePhone(raw) {
  return raw.replace(/\D/g, '');
}

async function collectRecipients(recipientGroup, phones) {
  if (recipientGroup === 'ALL_BUYERS') {
    const profiles = await prisma.buyerProfile.findMany({
      where: { phone: { not: null } },
      select: { phone: true, businessName: true },
    });
    return profiles.map((p) => ({ phone: p.phone, name: p.businessName }));
  }

  if (recipientGroup === 'ALL_BRANDS') {
    const profiles = await prisma.brandProfile.findMany({
      where: { phone: { not: null }, status: 'APPROVED' },
      select: { phone: true, brandName: true },
    });
    return profiles.map((p) => ({ phone: p.phone, name: p.brandName }));
  }

  if (recipientGroup === 'CUSTOM' && phones?.length) {
    return phones.map((p) => (typeof p === 'string' ? { phone: p, name: null } : p));
  }

  return [];
}

export async function createBroadcast({ name, templateName, languageCode = 'en', components = [], recipientGroup, phones }) {
  const raw = await collectRecipients(recipientGroup, phones);

  // Normalise phones — Meta wants digits only, no + or spaces
  const recipients = raw
    .map((r) => ({ ...r, phone: normalisePhone(r.phone ?? '') }))
    .filter((r) => r.phone.length >= 10);

  if (!recipients.length) throw new Error('No valid recipients found');

  const broadcast = await prisma.whatsappBroadcast.create({
    data: {
      name,
      templateName,
      languageCode,
      components,
      status: 'RUNNING',
      totalCount: recipients.length,
      recipients: {
        create: recipients.map((r) => ({ phone: r.phone, name: r.name ?? null })),
      },
    },
    include: { recipients: true },
  });

  // Non-blocking — fire and forget; errors are logged per-recipient
  processBroadcast(broadcast).catch((err) =>
    logger.error('Broadcast loop crashed', { broadcastId: broadcast.id, err: err.message })
  );

  return { id: broadcast.id, totalCount: broadcast.totalCount };
}

async function processBroadcast(broadcast) {
  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of broadcast.recipients) {
    try {
      const result = await sendTemplate(
        recipient.phone,
        broadcast.templateName,
        broadcast.languageCode,
        broadcast.components,
      );
      const messageId = result?.messages?.[0]?.id ?? null;
      await prisma.whatsappBroadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: 'SENT', messageId },
      });
      sentCount++;
    } catch (err) {
      await prisma.whatsappBroadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: 'FAILED', error: err.message?.slice(0, 255) ?? 'Unknown error' },
      });
      failedCount++;
      logger.warn('Broadcast recipient send failed', { recipientId: recipient.id, phone: recipient.phone, err: err.message });
    }

    // Update running counters every recipient
    await prisma.whatsappBroadcast.update({
      where: { id: broadcast.id },
      data: { sentCount, failedCount },
    });

    await sleep(SEND_DELAY_MS);
  }

  await prisma.whatsappBroadcast.update({
    where: { id: broadcast.id },
    data: { status: 'DONE' },
  });

  logger.info('Broadcast completed', { broadcastId: broadcast.id, sentCount, failedCount, total: broadcast.totalCount });
}

export async function listBroadcasts() {
  return prisma.whatsappBroadcast.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, templateName: true, status: true,
      totalCount: true, sentCount: true, failedCount: true, createdAt: true,
    },
  });
}

export async function getBroadcastDetail(id) {
  return prisma.whatsappBroadcast.findUnique({
    where: { id },
    include: {
      recipients: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, phone: true, name: true, status: true, messageId: true, error: true },
      },
    },
  });
}
