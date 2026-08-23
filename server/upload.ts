import { Request, Response } from 'express';

/**
 * Cloudinary / Photo Storage Status Check
 * Returns configuration status without leaking secrets.
 */
export function getPhotoUploadStatusHandler(req: Request, res: Response) {
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  return res.json({
    success: true,
    uploadAvailable: isCloudinaryConfigured,
    provider: isCloudinaryConfigured ? 'cloudinary' : 'none',
    message: isCloudinaryConfigured
      ? 'Cloudinary photo storage is configured and ready.'
      : 'Photo upload is currently unavailable because external cloud storage (Cloudinary) is not configured.'
  });
}
