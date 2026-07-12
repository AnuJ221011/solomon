import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import * as categoryService from './category.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

const createSchema = z.object({
  name:        z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  parentId:    z.string().optional(),
  sortOrder:   z.number().int().min(0).optional(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/categories — all active categories (nested tree)
router.get('/', async (req, res) => {
  const categories = await categoryService.listCategories();
  sendSuccess(res, categories);
});

// GET /api/categories/flat — flat list for dropdowns
router.get('/flat', async (req, res) => {
  const categories = await categoryService.listCategoriesFlat();
  sendSuccess(res, categories);
});

// GET /api/categories/tree — full L1→L2→L3 tree with attributes
router.get('/tree', async (req, res) => {
  const tree = await categoryService.getCategoryTree();
  sendSuccess(res, tree);
});

router.get('/:slug', async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess(res, category);
});

// ── Admin — create ────────────────────────────────────────────────────────────

// Category creation is admin-only — brands pick from the existing taxonomy
// (or "Other") instead of creating ad-hoc categories from the product form.
router.post('/',
  authenticate,
  authorize('ADMIN'),
  validate(createSchema),
  async (req, res) => {
    const category = await categoryService.createCategory(req.body);
    sendSuccess(res, category, 'New category created successfully.', 201);
  }
);

// ── Admin ─────────────────────────────────────────────────────────────────────

router.patch('/:id',
  authenticate, authorize('ADMIN'),
  validate(updateSchema),
  async (req, res) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    sendSuccess(res, category, 'Category details updated successfully.');
  }
);

// DELETE ?force=true for hard delete; default is soft deactivate
router.delete('/:id',
  authenticate, authorize('ADMIN'),
  async (req, res) => {
    await categoryService.deleteCategory(req.params.id, { force: req.query.force === 'true' });
    sendSuccess(res, null, req.query.force === 'true' ? 'Category permanently removed.' : 'Category hidden from listings.');
  }
);

// GET /api/categories/admin/all — includes inactive (admin only)
router.get('/admin/all',
  authenticate, authorize('ADMIN'),
  async (req, res) => {
    const categories = await categoryService.listCategories({ includeInactive: true });
    sendSuccess(res, categories);
  }
);

// GET /api/categories/admin/tree — full L1→L2→L3 tree, includes inactive (admin only)
router.get('/admin/tree',
  authenticate, authorize('ADMIN'),
  async (req, res) => {
    const tree = await categoryService.getCategoryTree({ includeInactive: true });
    sendSuccess(res, tree);
  }
);

export default router;
