import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ImageWithLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  loaderSize?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
  minLoadingTime?: number;
}

export const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({
  src,
  alt,
  className,
  containerClassName,
  fallback,
  loaderSize = 'md',
  minLoadingTime = 250,
  onLoad,
  onError,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number>(Date.now());

  const loaderSizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-2'
  };

  useEffect(() => {
    if (src) {
      setLoading(true);
      setError(false);
      setImageLoaded(false);
      setLoadStartTime(Date.now());
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    setError(false);

    const loadTime = Date.now() - loadStartTime;
    const remainingTime = Math.max(0, minLoadingTime - loadTime);

    setTimeout(() => {
      setLoading(false);
      onLoad?.(e);
    }, remainingTime);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoading(false);
    setError(true);
    setImageLoaded(false);
    onError?.(e);
  };

  if (!src) {
    return fallback || null;
  }

  return (
    <div className={cn('relative', containerClassName)}>
      {loading && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-muted z-10 rounded-md',
            className
          )}
        >
          <div
            className={cn(
              'animate-spin rounded-full border-primary border-t-transparent',
              loaderSizes[loaderSize]
            )}
          ></div>
        </div>
      )}

      {error && fallback ? (
        <>{fallback}</>
      ) : (
        <img
          {...props}
          src={src}
          alt={alt}
          className={cn(
            className,
            'transition-opacity duration-200', // ← smooth 200ms fade
            loading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};
