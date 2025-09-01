import { supabase } from '@/integrations/supabase/client';

export type ImageBucket = 'student-ids' | 'candidate-profiles' | 'election-covers';

interface SecureImageResponse {
  url: string | null;
  error?: string;
}

/**
 * Get a secure signed URL for an image in Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param expiresIn - URL expiration time in seconds (1 hour = 3600 seconds)
 */
export const getSecureImageUrl = async (
  bucket: ImageBucket,
  path: string,
  expiresIn: number = 60
): Promise<SecureImageResponse> => {
  if (!path) {
    return { url: null, error: 'No path provided' };
  }

  try {
    // If path is already a full URL, extract the path
    let cleanPath = path;
    if (path.startsWith('http')) {
      const url = new URL(path);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf(bucket);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        cleanPath = pathParts.slice(bucketIndex + 1).join('/');
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, expiresIn);

    if (error) {
      console.error(`Error creating signed URL for ${bucket}/${cleanPath}:`, error);
      return { url: null, error: error.message };
    }

    return { url: data.signedUrl };
  } catch (error: any) {
    console.error(`Error getting secure image URL:`, error);
    return { url: null, error: error.message };
  }
};

/**
 * Upload an image to a secure bucket and return the path (not full URL)
 * @param bucket - The storage bucket name
 * @param file - The file to upload
 * @param path - The desired file path within the bucket
 */
export const uploadSecureImage = async (
  bucket: ImageBucket,
  file: File,
  path: string
): Promise<{ path: string | null; error?: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) {
      console.error(`Error uploading to ${bucket}/${path}:`, error);
      return { path: null, error: error.message };
    }

    return { path: data.path };
  } catch (error: any) {
    console.error(`Error uploading secure image:`, error);
    return { path: null, error: error.message };
  }
};

/**
 * Cache for signed URLs to avoid repeated requests
 */
const urlCache = new Map<string, { url: string; expires: number }>();

/**
 * Get a cached signed URL or create a new one
 */
export const getCachedSecureImageUrl = async (
  bucket: ImageBucket,
  path: string,
  expiresIn: number = 60
): Promise<SecureImageResponse> => {
  const cacheKey = `${bucket}/${path}`;
  const cached = urlCache.get(cacheKey);
  
  // Check if cached URL is still valid (with 5 minute buffer)
  if (cached && cached.expires > Date.now() + 300000) {
    return { url: cached.url };
  }

  const result = await getSecureImageUrl(bucket, path, expiresIn);
  
  if (result.url) {
    urlCache.set(cacheKey, {
      url: result.url,
      expires: Date.now() + (expiresIn * 1000)
    });
  }

  return result;
};
