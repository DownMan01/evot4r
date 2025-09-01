import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileOptimizedGridProps {
  children: ReactNode;
  className?: string;
  mobileColumns?: 1 | 2;
  desktopColumns?: 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

export const MobileOptimizedGrid = ({ 
  children, 
  className,
  mobileColumns = 1,
  desktopColumns = 3,
  gap = 'md'
}: MobileOptimizedGridProps) => {
  const isMobile = useIsMobile();

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const mobileGridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2'
  };

  const desktopGridClasses = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6'
  };

  return (
    <div className={cn(
      "grid",
      mobileGridClasses[mobileColumns],
      desktopGridClasses[desktopColumns],
      gapClasses[gap],
      isMobile && "px-1",
      className
    )}>
      {children}
    </div>
  );
};