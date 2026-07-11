// Single source of truth for the Cloudinary folder layout — every upload
// call site should build its target folder from here instead of repeating
// the root folder name as a string literal.
export const CLOUDINARY_ROOT_FOLDER = 'Solomon-Bharat2';

export const cloudinaryFolders = {
  docs: `${CLOUDINARY_ROOT_FOLDER}/docs`,
  logos: `${CLOUDINARY_ROOT_FOLDER}/logos`,
  banners: `${CLOUDINARY_ROOT_FOLDER}/banners`,
  products: `${CLOUDINARY_ROOT_FOLDER}/products`,
  productMedia: (productId) => `${CLOUDINARY_ROOT_FOLDER}/products/${productId}`,
};
