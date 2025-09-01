import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserHistoryEntry {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  timestamp: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
}

export const useUserHistory = () => {
  const [userHistory, setUserHistory] = useState<UserHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const formatActionDescription = (action: string, details: any, resourceType: string | null): string => {
    switch (action) {
      case 'login':
        return `Successfully signed in to your account`;
      case 'logout':
        return `Signed out of your account`;
      case 'cast_vote':
        return `Cast your vote in an election`;
      case 'submit_appeal':
        return `Submitted registration appeal for account review`;
      case 'approve_user_registration':
        return `Registration status approved by administrator`;
      case 'reject_user_registration':
        return `Registration status rejected by administrator`;
      case 'update_user_role':
        return `Account role updated to ${details?.new_role || 'unknown'}`;
      case 'approve_action':
        return `System action approved: ${details?.action_type || 'unknown'}`;
      case 'reject_action':
        return `System action rejected: ${details?.action_type || 'unknown'}`;
      case 'profile_update_request':
        return `Submitted request to update profile information`;
      case 'approve_profile_update':
        return `Profile update request approved by staff`;
      case 'reject_profile_update':
        return `Profile update request rejected by staff`;
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const fetchUserHistory = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('actor_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedHistory: UserHistoryEntry[] = data?.map(entry => ({
        id: entry.id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        details: entry.details,
        timestamp: entry.timestamp,
        description: formatActionDescription(entry.action, entry.details, entry.resource_type),
        ip_address: entry.ip_address as string | null,
        user_agent: entry.user_agent as string | null
      })) || [];

      setUserHistory(formattedHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, [user?.id]);

  return { userHistory, loading, error, refetch: fetchUserHistory };
};