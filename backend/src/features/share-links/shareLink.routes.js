import { Router } from 'express';
import * as ctrl from './shareLink.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { createShareLinkSchema, updateShareLinkSchema, recordVisitSchema } from './shareLink.validator.js';

const router = Router();

// Public — resolves a share link token
router.get('/:token', ctrl.getShareLink);
router.post('/visit', validate(recordVisitSchema), ctrl.recordVisit);

// Brand-only
router.get('/', authenticate, authorize('BRAND'), ctrl.getMyShareLinks);
router.post('/', authenticate, authorize('BRAND'), validate(createShareLinkSchema), ctrl.createShareLink);
router.patch('/:id', authenticate, authorize('BRAND'), validate(updateShareLinkSchema), ctrl.updateShareLink);
router.delete('/:id', authenticate, authorize('BRAND'), ctrl.deleteShareLink);

export default router;
