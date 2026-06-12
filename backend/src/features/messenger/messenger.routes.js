import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import { createError } from '../../shared/utils/createError.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();
router.use(authenticate);

const sendSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().min(1).max(2000),
  orderId: z.string().optional(),
});

/**
 * GET /api/messages/conversations
 * Returns a list of unique conversation partners with the last message.
 */
router.get('/conversations', async (req, res) => {
  const userId = req.user.id;

  // Get distinct partners — both sent and received
  const sent = await prisma.message.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: 'desc' },
    distinct: ['recipientId'],
    select: { recipientId: true, content: true, createdAt: true, isRead: true },
  });

  const received = await prisma.message.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: 'desc' },
    distinct: ['senderId'],
    select: { senderId: true, content: true, createdAt: true, isRead: true },
  });

  // Merge and deduplicate by partner ID
  const partnerMap = new Map();
  for (const m of sent) {
    const key = m.recipientId;
    if (!partnerMap.has(key) || m.createdAt > partnerMap.get(key).lastAt) {
      partnerMap.set(key, { partnerId: key, lastMessage: m.content, lastAt: m.createdAt, unreadCount: 0 });
    }
  }
  for (const m of received) {
    const key = m.senderId;
    const existing = partnerMap.get(key);
    if (!existing || m.createdAt > existing.lastAt) {
      partnerMap.set(key, { partnerId: key, lastMessage: m.content, lastAt: m.createdAt, unreadCount: m.isRead ? 0 : 1 });
    } else if (!m.isRead) {
      existing.unreadCount = (existing.unreadCount ?? 0) + 1;
    }
  }

  const conversations = await Promise.all(
    [...partnerMap.values()].sort((a, b) => b.lastAt - a.lastAt).map(async (c) => {
      const partner = await prisma.user.findUnique({
        where: { id: c.partnerId },
        select: { id: true, name: true, role: true, avatarUrl: true,
          brandProfile: { select: { brandName: true, slug: true } } },
      });
      return { ...c, partner };
    })
  );

  sendSuccess(res, conversations);
});

/**
 * GET /api/messages/:partnerId
 * Returns the message thread with a specific user, optionally filtered by orderId.
 */
router.get('/:partnerId', async (req, res) => {
  const userId = req.user.id;
  const { partnerId } = req.params;
  const { orderId, page = '1', limit = '50' } = req.query;

  const where = {
    OR: [
      { senderId: userId, recipientId: partnerId },
      { senderId: partnerId, recipientId: userId },
    ],
  };
  if (orderId) where.orderId = orderId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    prisma.message.count({ where }),
  ]);

  // Mark received messages as read
  await prisma.message.updateMany({
    where: { senderId: partnerId, recipientId: userId, isRead: false },
    data: { isRead: true },
  });

  sendSuccess(res, { messages, total, page: parseInt(page), limit: parseInt(limit) });
});

/**
 * POST /api/messages
 * Send a message to another user.
 */
router.post('/', validate(sendSchema), async (req, res) => {
  const { recipientId, content, orderId } = req.body;

  // Validate recipient exists
  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) throw createError('Recipient not found', 404);
  if (recipientId === req.user.id) throw createError('Cannot send a message to yourself', 400);

  // If orderId provided, verify the sender is involved in the order
  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw createError('Order not found', 404);
    const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
    const isBuyer = order.buyerUserId === req.user.id;
    const isBrand = brand && order.brandProfileId === brand.id;
    if (!isBuyer && !isBrand) throw createError('You are not involved in this order', 403);
  }

  const message = await prisma.message.create({
    data: { senderId: req.user.id, recipientId, content, orderId: orderId ?? null },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  sendSuccess(res, message, 'Message sent to recipient.', 201);
});

/**
 * PATCH /api/messages/:id/read
 * Mark a single message as read.
 */
router.patch('/:id/read', async (req, res) => {
  const msg = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!msg) throw createError('Message not found', 404);
  if (msg.recipientId !== req.user.id) throw createError('Access denied', 403);
  await prisma.message.update({ where: { id: msg.id }, data: { isRead: true } });
  sendSuccess(res, null, 'Message marked as read.');
});

export default router;
