import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

/** Converts a name to a URL-safe slug: "Home Décor" → "home-decor" */
const toSlug = (name) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ── Read ──────────────────────────────────────────────────────────────────────

export const listCategories = async ({ includeInactive = false } = {}) => {
  return prisma.category.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: {
        where: includeInactive ? undefined : { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      },
    },
  });
};

/**
 * Returns the full L1 → L2 → L3 tree with CategoryAttributes on each node.
 * Shape: L1[] → { children: L2[] → { children: L3[], attributes: Attr[] } }
 */
export const getCategoryTree = async ({ includeInactive = false } = {}) => {
  const activeFilter = includeInactive ? undefined : { isActive: true };

  const l1s = await prisma.category.findMany({
    where: { level: 1, ...activeFilter },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      children: {
        where: activeFilter,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          children: {
            where: activeFilter,
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          },
        },
      },
    },
  });

  return l1s;
};

/** Returns a flat list — useful for dropdowns */
export const listCategoriesFlat = async ({ includeInactive = false } = {}) => {
  return prisma.category.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, slug: true, imageUrl: true, parentId: true, sortOrder: true },
  });
};

export const getCategoryBySlug = async (slug) => {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) throw createError('Category not found', 404);
  return category;
};

// ── Validate ──────────────────────────────────────────────────────────────────

/**
 * Validates that all supplied category names exist in the DB.
 * Throws 422 listing the unknown names so the caller can guide the user.
 */
export const validateCategories = async (names) => {
  if (!names || names.length === 0) return;
  const found = await prisma.category.findMany({
    where: { name: { in: names }, isActive: true },
    select: { name: true },
  });
  const foundNames = found.map((c) => c.name);
  const unknown = names.filter((n) => !foundNames.includes(n));
  if (unknown.length > 0) {
    throw createError(
      `Unknown categories: ${unknown.join(', ')}. Create them first or use an existing category.`,
      422
    );
  }
};

// ── Create ────────────────────────────────────────────────────────────────────

export const createCategory = async ({ name, description, parentId, sortOrder }) => {
  const slug = toSlug(name);

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name }, { slug }] },
  });
  if (existing) throw createError(`Category "${name}" already exists`, 409);

  const autoOrder = sortOrder ?? (await prisma.category.count()) + 1;

  let level = 1;
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { level: true } });
    if (!parent) throw createError('Parent category not found', 404);
    level = parent.level + 1;
  }

  return prisma.category.create({
    data: { name, slug, description: description ?? null, parentId: parentId ?? null, sortOrder: autoOrder, level },
  });
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateCategory = async (id, updates) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw createError('Category not found', 404);

  const data = { ...updates };
  if (updates.name && updates.name !== category.name) {
    // Regenerate slug only when name changes
    data.slug = toSlug(updates.name);
    const conflict = await prisma.category.findFirst({
      where: { OR: [{ name: updates.name }, { slug: data.slug }], NOT: { id } },
    });
    if (conflict) throw createError(`Category "${updates.name}" already exists`, 409);
  }

  return prisma.category.update({ where: { id }, data });
};

// ── Delete / deactivate ───────────────────────────────────────────────────────

/**
 * Soft-deletes (deactivates) a category.
 * Hard delete is blocked if products use this category.
 */
export const deleteCategory = async (id, { force = false } = {}) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw createError('Category not found', 404);

  if (force) {
    // Hard delete — only allowed if no products use it
    const productCount = await prisma.product.count({
      where: { categories: { has: category.name } },
    });
    if (productCount > 0) {
      throw createError(
        `Cannot delete "${category.name}" — ${productCount} product(s) use this category. Deactivate it instead.`,
        409
      );
    }
    await prisma.category.delete({ where: { id } });
  } else {
    // Soft delete — just mark inactive
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  }
};
