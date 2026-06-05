import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { validate } from '../../shared/middleware/validate.js';
import { createError } from '../../shared/utils/createError.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'CUSTOM']).default('CUSTOM'),
  canViewPayouts: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(true),
});

router.use(authenticate);

router.get('/', async (req, res) => {
  const members = await prisma.teamMember.findMany({
    where: { ownerUserId: req.user.id },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  });
  sendSuccess(res, members);
});

router.post('/', validate(inviteSchema), async (req, res) => {
  const invitee = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!invitee) throw createError('User with that email not found. They must sign up first.', 404);
  if (invitee.id === req.user.id) throw createError('Cannot add yourself as a team member', 400);

  const member = await prisma.teamMember.upsert({
    where: { userId_ownerUserId: { userId: invitee.id, ownerUserId: req.user.id } },
    create: {
      userId: invitee.id,
      ownerUserId: req.user.id,
      role: req.body.role,
      canViewPayouts: req.body.canViewPayouts,
      canViewAnalytics: req.body.canViewAnalytics,
    },
    update: {
      role: req.body.role,
      canViewPayouts: req.body.canViewPayouts,
      canViewAnalytics: req.body.canViewAnalytics,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  sendSuccess(res, member, 'Team member added', 201);
});

router.delete('/:userId', async (req, res) => {
  const member = await prisma.teamMember.findUnique({
    where: { userId_ownerUserId: { userId: req.params.userId, ownerUserId: req.user.id } },
  });
  if (!member) throw createError('Team member not found', 404);
  await prisma.teamMember.delete({ where: { id: member.id } });
  sendSuccess(res, null, 'Team member removed');
});

export default router;
