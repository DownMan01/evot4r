import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileScreenProps {
  children: ReactNode;
  className?: string;
  hasBottomNav?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const MobileScreen = ({ 
  children, 
  className,
  hasBottomNav = true,
  padding = 'md'
}: MobileScreenProps) => {
  const isMobile = useIsMobile();

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-3 lg:p-6',
    lg: 'p-4 lg:p-8'
  };

  return (
    <div className={cn(
      "w-full min-h-screen",
      isMobile && "mobile-full-height",
      paddingClasses[padding],
      isMobile && hasBottomNav && "pb-28",
      isMobile && "mobile-scroll",
      className
    )}>
      {children}
    </div>
  );
};