import prisma from '../../config/db.js';
import { createError } from '../utils/createError.js';

// Blocks brand-portal actions until the brand's application is approved —
// they can still log in, view their (mostly empty) dashboard, and complete
// their profile (brand story, identity docs, bank account), but can't take
// any action that matters to buyers (products, orders, share links, etc.)
// until an admin approves them. Must run after authenticate + authorize('BRAND').
export const requireApprovedBrand = async (req, _res, next) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: req.user.id },
    select: { status: true },
  });
  if (!brand) return next(createError('Brand profile not found', 404));
  if (brand.status !== 'APPROVED') {
    return next(createError('Your brand account is pending admin approval — this action isn\'t available yet.', 403));
  }
  next();
};
