import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { requireApprovedBrand } from '../../shared/middleware/requireApprovedBrand.js';
import { createError } from '../../shared/utils/createError.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { env } from '../../config/env.js';
import prisma from '../../config/db.js';
import { cloudinaryFolders } from '../../shared/constants/cloudinary.js';

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

// public_id + tags make the asset identifiable/searchable directly in the
// Cloudinary dashboard, instead of a random filename with no indication of
// which brand/product it belongs to or what kind of image it is.
function uploadToCloudinary(buffer, folder, isVideo, publicId, tags) {
  return new Promise((resolve, reject) => {
    const opts = isVideo
      ? { folder, resource_type: 'video', public_id: publicId, tags }
      : { folder, resource_type: 'image', transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }], public_id: publicId, tags };

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
  requireApprovedBrand,
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

    const existingMax = product.photos.reduce((max, p) => Math.max(max, p.position), -1);

    const uploaded = await Promise.all(
      files.map((file, i) => {
        const isVideo = file.mimetype.startsWith('video/');
        const publicId = `${product.slug}-${existingMax + 1 + i}-${Date.now()}`;
        return uploadToCloudinary(file.buffer, cloudinaryFolders.productMedia(product.id), isVideo, publicId, ['product-media', brand.slug, product.slug])
          .then((result) => ({ result, isVideo }));
      })
    );

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
router.patch('/product/:productId/reorder', authenticate, authorize('BRAND'), requireApprovedBrand, async (req, res) => {
  const { order } = req.body; // array of { id, position }
  if (!Array.isArray(order)) throw createError('order must be an array', 400);

  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
  if (!brand) throw createError('Brand profile not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: req.params.productId, brandProfileId: brand.id },
  });
  if (!product) throw createError('Product not found', 404);

  const photoIds = order.map(({ id }) => id);
  const ownedCount = await prisma.productPhoto.count({
    where: { id: { in: photoIds }, productId: product.id },
  });
  if (ownedCount !== photoIds.length) {
    throw createError('One or more photos do not belong to this product', 403);
  }

  await prisma.$transaction(
    order.map(({ id, position }) =>
      prisma.productPhoto.update({ where: { id }, data: { position } })
    )
  );
  sendSuccess(res, null, 'Media order saved successfully.');
});

// Delete a product photo or video
router.delete('/product/:productId/photo/:photoId', authenticate, authorize('BRAND'), requireApprovedBrand, async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
  if (!brand) throw createError('Brand profile not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: req.params.productId, brandProfileId: brand.id },
  });
  if (!product) throw createError('Product not found', 404);

  const photo = await prisma.productPhoto.findFirst({
    where: { id: req.params.photoId, productId: product.id },
  });
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
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
  if (!brand) throw createError('Brand profile not found', 404);
  const publicId = `${brand.slug}-logo-${Date.now()}`;
  const result = await uploadToCloudinary(req.file.buffer, cloudinaryFolders.logos, false, publicId, ['brand-logo', brand.slug]);
  await prisma.brandProfile.update({
    where: { userId: req.user.id },
    data: { logoUrl: result.secure_url },
  });
  sendSuccess(res, { logoUrl: result.secure_url }, 'Brand logo updated successfully.');
});

// Upload brand banner
router.post('/brand/banner', authenticate, authorize('BRAND'), safeUpload(upload.single('banner')), async (req, res) => {
  if (!req.file) throw createError('No file uploaded', 400);
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
  if (!brand) throw createError('Brand profile not found', 404);
  const publicId = `${brand.slug}-banner-${Date.now()}`;
  const result = await uploadToCloudinary(req.file.buffer, cloudinaryFolders.banners, false, publicId, ['brand-banner', brand.slug]);
  await prisma.brandProfile.update({
    where: { userId: req.user.id },
    data: { bannerUrl: result.secure_url },
  });
  sendSuccess(res, { bannerUrl: result.secure_url }, 'Brand banner updated successfully.');
});

// Multer instance for identity/business document uploads (PDF + image, 5 MB
// per file) — mirrors the config used at onboarding time in auth.routes.js,
// for brands completing these details later from their portal instead.
const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, or PDF files are allowed'));
    }
    cb(null, true);
  },
});

const DOC_UPLOAD_FIELDS = [
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gstCert', maxCount: 1 },
  { name: 'incorporateCert', maxCount: 1 },
  { name: 'msmeCert', maxCount: 1 },
  { name: 'isoCert', maxCount: 1 },
  { name: 'iecCert', maxCount: 1 },
];

const DOC_FIELD_MAP = {
  aadhar: { urlField: 'aadharUrl', tag: 'aadhar-card' },
  pan: { urlField: 'panUrl', tag: 'pan-card' },
  gstCert: { urlField: 'gstCertUrl', tag: 'gst-certificate' },
  incorporateCert: { urlField: 'incorporateCertUrl', tag: 'incorporation-certificate' },
  msmeCert: { urlField: 'msmeCertUrl', tag: 'msme-certificate' },
  isoCert: { urlField: 'isoCertUrl', tag: 'iso-certificate' },
  iecCert: { urlField: 'iecCertUrl', tag: 'iec-certificate' },
};

// Upload/replace identity or business documents — lets a brand fill these
// in from their portal after signup instead of during onboarding.
router.post(
  '/brand/documents',
  authenticate,
  authorize('BRAND'),
  safeUpload(docUpload.fields(DOC_UPLOAD_FIELDS)),
  async (req, res) => {
    const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
    if (!brand) throw createError('Brand profile not found', 404);

    const files = req.files ?? {};
    const providedFields = Object.keys(DOC_FIELD_MAP).filter((field) => files[field]?.[0]);
    if (providedFields.length === 0) throw createError('No files uploaded', 400);

    const updateData = {};
    await Promise.all(
      providedFields.map(async (field) => {
        const { urlField, tag } = DOC_FIELD_MAP[field];
        const file = files[field][0];
        const publicId = `${brand.slug}-${tag}-${Date.now()}`;
        const result = await uploadToCloudinary(file.buffer, cloudinaryFolders.docs, false, publicId, ['brand-document', tag, brand.slug]);
        updateData[urlField] = result.secure_url;
      })
    );

    const updated = await prisma.brandProfile.update({ where: { userId: req.user.id }, data: updateData });
    sendSuccess(res, updated, 'Documents uploaded successfully.');
  }
);

export default router;
