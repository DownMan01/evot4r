import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileTabsWrapperProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export const MobileTabsWrapper = ({ 
  children, 
  activeTab, 
  onTabChange, 
  tabs 
}: MobileTabsWrapperProps) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile tab content area */}
      <div className="flex-1 overflow-y-auto mobile-scroll">
        {children}
      </div>
      
      {/* Mobile bottom tab navigation handled by main Dashboard */}
    </div>
  );
};