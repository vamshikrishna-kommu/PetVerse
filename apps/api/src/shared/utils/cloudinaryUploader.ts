import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env, isConfiguredCredential } from '../../config/env';
import { CLOUDINARY_FOLDERS } from '@petverse/shared-constants';

const isCloudinaryActive = Boolean(
  isConfiguredCredential(env.CLOUDINARY_CLOUD_NAME) &&
  isConfiguredCredential(env.CLOUDINARY_API_KEY) &&
  isConfiguredCredential(env.CLOUDINARY_API_SECRET)
);

// Configure once
if (isCloudinaryActive) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure HTTPS URL of the uploaded asset.
 * Falls back to a base64 data-URL if Cloudinary is not configured (dev mode).
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<string> {
  // If Cloudinary is not configured (local dev without credentials),
  // return a data URL so the app still works end-to-end without a cloud account.
  if (!isCloudinaryActive) {
    const base64 = buffer.toString('base64');
    return `data:image/jpeg;base64,${base64}`;
  }

  return new Promise<string>((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    };

    if (publicId) {
      options.public_id = publicId;
      options.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result: UploadApiResponse | undefined) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error('Upload failed: no secure_url'));
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

/** Upload a pet avatar */
export async function uploadPetAvatar(buffer: Buffer, petId: string): Promise<string> {
  return uploadImageBuffer(buffer, CLOUDINARY_FOLDERS.PET_AVATARS, `pet_${petId}`);
}

/** Upload a user avatar */
export async function uploadUserAvatar(buffer: Buffer, userId: string): Promise<string> {
  return uploadImageBuffer(buffer, CLOUDINARY_FOLDERS.USER_AVATARS, `user_${userId}`);
}

/** Upload a pet gallery photo */
export async function uploadPetGalleryImage(buffer: Buffer, petId: string): Promise<string> {
  const uniqueId = `gallery_${petId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return uploadImageBuffer(buffer, 'petverse/gallery', uniqueId);
}
