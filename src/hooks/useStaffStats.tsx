import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StaffStats {
  pendingRequests: number;
  totalVoters: number;
  activeElections: number;
  staffPendingActions: number;
}

export const useStaffStats = () => {
  const [stats, setStats] = useState<StaffStats>({
    pendingRequests: 0,
    totalVoters: 0,
    activeElections: 0,
    staffPendingActions: 0
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch all stats in parallel
      const [
        pendingRequestsResult,
        totalVotersResult,
        activeElectionsResult,
        staffPendingActionsResult
      ] = await Promise.all([
        supabase
          .from('profile_update_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('registration_status', 'Approved')
          .eq('role', 'Voter'),
        
        supabase
          .from('elections')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Active'),
        
        supabase
          .from('pending_actions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending')
          .eq('requested_by', user.id)
      ]);

      setStats({
        pendingRequests: pendingRequestsResult.count || 0,
        totalVoters: totalVotersResult.count || 0,
        activeElections: activeElectionsResult.count || 0,
        staffPendingActions: staffPendingActionsResult.count || 0
      });
    } catch (error) {
      console.error('Failed to fetch staff stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};