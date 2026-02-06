import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileBuffer: Buffer, options: {
  folder?: string,
  resource_type?: 'auto' | 'raw' | 'image' | 'video',
  type?: 'upload' | 'authenticated' | 'private',
  public_id?: string,
  format?: string
} = {}): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "fixkart-inventory",
        resource_type: options.resource_type || "auto",
        type: options.type || "upload",
        public_id: options.public_id,
        format: options.format
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    // Write buffer to stream
    uploadStream.end(fileBuffer);
  });
};

export const getPrivateDownloadUrl = (publicId: string, format: string, resourceType: string = "raw") => {
  // 10 years expiry
  const expiresAt = Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60);

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: expiresAt
  });
};

export const ensureSignedUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  try {
    // Regex to extract parts from Cloudinary URL
    const regex = /https:\/\/res\.cloudinary\.com\/[^/]+\/([^/]+)\/([^/]+)\/v\d+\/(.+)\.(\w+)$/;
    const match = url.match(regex);

    if (match) {
      const [, resourceType, type, publicId, format] = match;

      if (type === 'authenticated') return url;

      return getPrivateDownloadUrl(publicId, format, resourceType);
    }

    return url;
  } catch (error) {
    console.error("Error signing URL:", error);
    return url;
  }
};