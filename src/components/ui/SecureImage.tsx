import React, { useState, useEffect } from 'react';
import { getCachedSecureImageUrl, type ImageBucket } from '@/utils/secureImageUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface SecureImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  bucket: ImageBucket;
  path: string | null | undefined;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const SecureImage: React.FC<SecureImageProps> = ({
  bucket,
  path,
  alt,
  className,
  fallback,
  showError = false,
  ...props
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!path) {
        setLoading(false);
        setError('No image path provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getCachedSecureImageUrl(bucket, path);
        
        if (result.error) {
          setError(result.error);
          setImageUrl(null);
        } else {
          setImageUrl(result.url);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load image');
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [bucket, path]);

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="w-full h-full animate-pulse" />
      </div>
    );
  }

  if (error || !imageUrl) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showError) {
      return (
        <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
          <div className="flex flex-col items-center gap-2 p-4">
            <AlertCircle className="h-6 w-6" />
            <span className="text-sm">Image unavailable</span>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <img
      {...props}
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => {
        setError('Failed to load image');
        setImageUrl(null);
      }}
    />
  );
};