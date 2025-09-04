import React, { useState, useEffect } from 'react';
import { getCachedSecureImageUrl, type ImageBucket } from '@/utils/secureImageUtils';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecureImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  bucket: ImageBucket;
  path: string | null | undefined;
  fallback?: React.ReactNode;
  showError?: boolean;
  minLoadingTime?: number;
}

export const SecureImage: React.FC<SecureImageProps> = ({
  bucket,
  path,
  alt,
  className,
  fallback,
  showError = false,
  minLoadingTime = 250,
  ...props
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number>(Date.now());

  useEffect(() => {
    const loadImage = async () => {
      if (!path) {
        setLoading(false);
        setError('No image path provided');
        return;
      }

      setLoading(true);
      setError(null);
      setImageLoaded(false);
      setLoadStartTime(Date.now());

      try {
        const result = await getCachedSecureImageUrl(bucket, path);

        if (result.error) {
          setError(result.error);
          setImageUrl(null);
          setLoading(false);
        } else {
          setImageUrl(result.url);
          // let <img> handle load event
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load image');
        setImageUrl(null);
        setLoading(false);
      }
    };

    loadImage();
  }, [bucket, path]);

  const handleImageLoad = () => {
    setImageLoaded(true);

    // Calculate how long the image has been loading
    const loadTime = Date.now() - loadStartTime;
    const remainingTime = Math.max(0, minLoadingTime - loadTime);

    // Ensure minimum loading time for better UX
    setTimeout(() => {
      setLoading(false);
    }, remainingTime);
  };

  const handleImageError = () => {
    setError('Failed to load image');
    setImageUrl(null);
    setLoading(false);
  };

  return (
    <div className={cn("relative flex items-center justify-center bg-muted", className)}>
      {/* Spinner overlay while loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
        </div>
      )}

      {/* Error or fallback ONLY after loading is finished */}
      {!loading && (error || !imageUrl) ? (
        fallback ? (
          <>{fallback}</>
        ) : showError ? (
          <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
            <AlertCircle className="h-6 w-6" />
            <span className="text-sm">Image unavailable</span>
          </div>
        ) : null
      ) : null}

      {/* Actual image */}
      {imageUrl && (
        <img
          {...props}
          src={imageUrl}
          alt={alt}
          className={cn(
            className,
            'transition-opacity duration-200',
            loading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  );
};
