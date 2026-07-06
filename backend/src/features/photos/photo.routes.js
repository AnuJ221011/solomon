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

const MAX_MEDIA_PER_PRODUCT = 20;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;   // 8 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;  // 100 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (!isImage && !isVideo) {
      return cb(new Error('Only image and video files are allowed'));
    }
    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return cb(new Error('Image files must be under 8 MB'));
    }
    cb(null, true);
  },
});

function uploadToCloudinary(buffer, folder, isVideo) {
  return new Promise((resolve, reject) => {
    const opts = isVideo
      ? { folder, resource_type: 'video' }
      : { folder, resource_type: 'image', transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }] };

    const stream = cloudinary.uploader.upload_stream(opts, (err, result) =>
      err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
}

const router = Router();

const safeUpload = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (err) return next(createError(`Upload error: ${err.message}`, 400));
    next();
  });
};

// Upload product media (images + videos, max 20 total per product)
router.post(
  '/product/:productId',
  authenticate,
  authorize('BRAND'),
  safeUpload(upload.array('photos', MAX_MEDIA_PER_PRODUCT)),
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

    const remaining = MAX_MEDIA_PER_PRODUCT - product.photos.length;
    if (files.length > remaining) {
      throw createError(`Can only upload ${remaining} more file(s) — max ${MAX_MEDIA_PER_PRODUCT} per product`, 400);
    }

    const uploaded = await Promise.all(
      files.map((file) => {
        const isVideo = file.mimetype.startsWith('video/');
        return uploadToCloudinary(file.buffer, `Solomon-Bharat2/products/${product.id}`, isVideo)
          .then((result) => ({ result, isVideo }));
      })
    );

    const existingMax = product.photos.reduce((max, p) => Math.max(max, p.position), -1);

    const media = await prisma.$transaction(
      uploaded.map(({ result, isVideo }, i) =>
        prisma.productPhoto.create({
          data: {
            productId: product.id,
            url: result.secure_url,
            publicId: result.public_id,
            position: existingMax + 1 + i,
            mediaType: isVideo ? 'video' : 'image',
          },
        })
      )
    );

    sendSuccess(res, media, `${media.length} file${media.length !== 1 ? 's' : ''} uploaded successfully.`, 201);
  }
);

// Reorder product photos/videos
router.patch('/product/:productId/reorder', authenticate, authorize('BRAND'), async (req, res) => {
  const { order } = req.body; // array of { id, position }
  if (!Array.isArray(order)) throw createError('order must be an array', 400);

  await prisma.$transaction(
    order.map(({ id, position }) => prisma.productPhoto.update({ where: { id }, data: { position } }))
  );
  sendSuccess(res, null, 'Media order saved successfully.');
});

// Delete a product photo or video
router.delete('/product/:productId/photo/:photoId', authenticate, authorize('BRAND'), async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
  if (!brand) throw createError('Brand profile not found', 404);

  const photo = await prisma.productPhoto.findUnique({ where: { id: req.params.photoId } });
  if (!photo) throw createError('Media file not found', 404);

  await cloudinary.uploader.destroy(photo.publicId, {
    resource_type: photo.mediaType === 'video' ? 'video' : 'image',
  }).catch(() => {});
  await prisma.productPhoto.delete({ where: { id: photo.id } });
  sendSuccess(res, null, 'File removed from product gallery.');
});

// Upload brand logo
router.post('/brand/logo', authenticate, authorize('BRAND'), safeUpload(upload.single('logo')), async (req, res) => {
  if (!req.file) throw createError('No file uploaded', 400);
  const result = await uploadToCloudinary(req.file.buffer, 'Solomon-Bharat2/logos', false);
  await prisma.brandProfile.update({
    where: { userId: req.user.id },
    data: { logoUrl: result.secure_url },
  });
  sendSuccess(res, { logoUrl: result.secure_url }, 'Brand logo updated successfully.');
});

// Upload brand banner
router.post('/brand/banner', authenticate, authorize('BRAND'), safeUpload(upload.single('banner')), async (req, res) => {
  if (!req.file) throw createError('No file uploaded', 400);
  const result = await uploadToCloudinary(req.file.buffer, 'Solomon-Bharat2/banners', false);
  await prisma.brandProfile.update({
    where: { userId: req.user.id },
    data: { bannerUrl: result.secure_url },
  });
  sendSuccess(res, { bannerUrl: result.secure_url }, 'Brand banner updated successfully.');
});

export default router;
