import multer, { type StorageEngine } from 'multer';
import type { RequestHandler } from 'express';
import { AppError } from '../shared/errors/AppError';

/**
 * In-memory multer storage — files are kept in Buffer so we can
 * stream them directly to Cloudinary without writing to disk.
 */
const storage: StorageEngine = multer.memoryStorage();

/** Restrict to image MIME types */
function imageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400, 'INVALID_FILE_TYPE'));
  }
}

/** Single-image upload: field name `avatar`, max 5 MB */
export const uploadAvatar: RequestHandler = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('avatar');

/** Single-image upload for general attachments, max 10 MB */
export const uploadAttachment: RequestHandler = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single('file');

/** Multi-image upload for pet gallery: field name `images`, max 10 files, max 5 MB each */
export const uploadGalleryImages: RequestHandler = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
}).array('images', 10);
