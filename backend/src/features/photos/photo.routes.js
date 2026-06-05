import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { createError } from '../../shared/utils/createError.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { env } from '../../config/env.js';
import prisma from '../../config/db.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

const router = Router();

/**
 * Wraps a multer middleware so stream errors are passed to Express's
 * error handler rather than crashing the process.
 */
const safeUpload = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (err) return next(createError(`Upload error: ${err.message}`, 400));
    next();
  });
};

// Upload product photos (max 8 per product)
router.post(
  '/product/:productId',
  authenticate,
  authorize('BRAND'),
  safeUpload(upload.array('photos', 8)),
  async (req, res) => {
    const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
    if (!brand) throw createError('Brand profile not found', 404);

    const product = await prisma.product.findFirst({
      where: { id: req.params.productId, brandProfileId: brand.id },
      include: { photos: true },
    });
    if (!product) throw createError('Product not found', 404);

    const files = req.files;
    if (!files || files.length === 0) throw createError('No files uploaded', 400);

    const remaining = 8 - product.photos.length;
    if (files.length > remaining) {
      throw createError(`Can only upload ${remaining} more photo(s) — max 8 per product`, 400);
    }

    const uploaded = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, `Solomon-Bharat2/products/${product.id}`))
    );

    const existingMax = product.photos.reduce((max, p) => Math.max(max, p.position), -1);

    const photos = await prisma.$transaction(
      uploaded.map((result, i) =>
        prisma.productPhoto.create({
          data: {
            productId: product.id,
            url: result.secure_url,
            publicId: result.public_id,
            position: existingMax + 1 + i,
          },
        })
      )
    );

    sendSuccess(res, photos, 'Photos uploaded', 201);
  }
);

// Reorder product photos
router.patch('/product/:productId/reorder', authenticate, authorize('BRAND'), async (req, res) => {
  const { order } = req.body; // array of { id, position }
  if (!Array.isArray(order)) throw createError('order must be an array', 400);

  await prisma.$transaction(
    order.map(({ id, position }) => prisma.productPhoto.update({ where: { id }, data: { position } }))
  );
  sendSuccess(res, null, 'Photos reordered');
});

// Delete a product photo
router.delete('/product/:productId/photo/:photoId', authenticate, authorize('BRAND'), async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
  if (!brand) throw createError('Brand profile not found', 404);

  const photo = await prisma.productPhoto.findUnique({ where: { id: req.params.photoId } });
  if (!photo) throw createError('Photo not found', 404);

  await cloudinary.uploader.destroy(photo.publicId).catch(() => {});
  await prisma.productPhoto.delete({ where: { id: photo.id } });
  sendSuccess(res, null, 'Photo deleted');
});

// Upload brand logo
router.post('/brand/logo', authenticate, authorize('BRAND'), safeUpload(upload.single('logo')), async (req, res) => {
  if (!req.file) throw createError('No file uploaded', 400);
  const result = await uploadToCloudinary(req.file.buffer, 'Solomon-Bharat2/logos');
  await prisma.brandProfile.update({
    where: { userId: req.user.id },
    data: { logoUrl: result.secure_url },
  });
  sendSuccess(res, { logoUrl: result.secure_url }, 'Logo uploaded');
});

// Upload brand banner
router.post('/brand/banner', authenticate, authorize('BRAND'), safeUpload(upload.single('banner')), async (req, res) => {
  if (!req.file) throw createError('No file uploaded', 400);
  const result = await uploadToCloudinary(req.file.buffer, 'Solomon-Bharat2/banners');
  await prisma.brandProfile.update({
    where: { userId: req.user.id },
    data: { bannerUrl: result.secure_url },
  });
  sendSuccess(res, { bannerUrl: result.secure_url }, 'Banner uploaded');
});

export default router;
