import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileOptimizedCardProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  header?: ReactNode;
}

export const MobileOptimizedCard = ({ 
  children, 
  className,
  contentClassName,
  headerClassName,
  header
}: MobileOptimizedCardProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className={cn(
      "overflow-hidden",
      isMobile && "mx-1 rounded-lg shadow-sm",
      className
    )}>
      {header && (
        <CardHeader className={cn(
          isMobile ? "p-3 pb-2" : "p-6 pb-4",
          headerClassName
        )}>
          {header}
        </CardHeader>
      )}
      <CardContent className={cn(
        isMobile ? "p-3" : "p-6",
        header && (isMobile ? "pt-1" : "pt-0"),
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};