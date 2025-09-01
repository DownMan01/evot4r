import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/usePermissions';

export const usePanelAccessControl = () => {
  const isMobile = useIsMobile();
  const { isAdmin, isStaff } = usePermissions();

  // Determine if current user needs desktop access for panels
  const requiresDesktopForPanels = isAdmin || isStaff;
  
  // Check if panel access should be restricted
  const isPanelAccessDenied = requiresDesktopForPanels && isMobile;
  
  return {
    isPanelAccessDenied,
    requiresDesktopForPanels,
    isMobile,
    canAccessPanels: !isPanelAccessDenied
  };
};