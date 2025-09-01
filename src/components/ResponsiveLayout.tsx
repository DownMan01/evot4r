import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveLayout = ({ 
  children, 
  className,
  mobileClassName,
  desktopClassName 
}: ResponsiveLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      className,
      isMobile ? mobileClassName : desktopClassName,
      isMobile && "mobile-layout"
    )}>
      {children}
    </div>
  );
};

interface MobileContentWrapperProps {
  children: ReactNode;
  hasBottomNav?: boolean;
  className?: string;
}

export const MobileContentWrapper = ({ 
  children, 
  hasBottomNav = true,
  className 
}: MobileContentWrapperProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn(
      "mobile-content-wrapper",
      hasBottomNav && "pb-20", // Account for bottom navigation
      className
    )}>
      {children}
    </div>
  );
};