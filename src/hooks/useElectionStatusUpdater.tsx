import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useElectionManagement } from '@/hooks/useElectionManagement';

export const useElectionStatusUpdater = (enabled = true) => {
  const { checkAndUpdateElectionStatuses } = useElectionManagement();

  useEffect(() => {
    if (!enabled) return;

    // Update election statuses immediately on mount
    checkAndUpdateElectionStatuses();

    // Set up interval to check every 5 minutes
    const interval = setInterval(() => {
      checkAndUpdateElectionStatuses();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [enabled, checkAndUpdateElectionStatuses]);

  // Manual trigger function
  const triggerUpdate = () => {
    checkAndUpdateElectionStatuses();
  };

  return { triggerUpdate };
};