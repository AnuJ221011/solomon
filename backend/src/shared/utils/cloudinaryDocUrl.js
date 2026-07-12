import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const DOC_FIELDS = [
  'aadharUrl', 'panUrl', 'gstCertUrl', 'incorporateCertUrl', 'msmeCertUrl', 'isoCertUrl', 'iecCertUrl',
];

// Uses the Admin API download endpoint (private_download_url), not a CDN
// sign_url — this account restricts direct PDF/ZIP delivery, and a plain
// sign_url does not bypass that restriction ("deny or ACL failure"); only
// the Admin-API-authenticated download link does.
export function getSignedDocUrl(storedUrl) {
  const uploadIdx = storedUrl.indexOf('/upload/');
  let publicId = storedUrl.slice(uploadIdx + 8).replace(/^v\d+\//, '');
  const resourceType = storedUrl.includes('/raw/upload/') ? 'raw' : 'image';
  if (resourceType === 'image') publicId = publicId.replace(/\.[^.]+$/, '');

  const ext = storedUrl.split('.').pop();
  const url = cloudinary.utils.private_download_url(publicId, ext, {
    resource_type: resourceType,
    type: 'upload',
    attachment: false,
  });
  return { url, ext };
}
