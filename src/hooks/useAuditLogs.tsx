import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  timestamp: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  actor_id: string | null;
  actor_role: string | null;
  actor_profile?: {
    full_name: string;
    student_id: string;
    email: string;
    role: string;
    course: string;
    year_level: string;
  } | null;
}

export const useAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const formatActionDescription = (action: string, details: any, resourceType: string | null): string => {
    switch (action) {
      case 'login':
        return `User signed into the system`;
      case 'logout':
        return `User signed out of the system`;
      case 'cast_vote':
        return `Vote cast in election`;
      case 'submit_appeal':
        return `Registration appeal submitted for review`;
      case 'approve_user_registration':
        return `User registration approved`;
      case 'reject_user_registration':
        return `User registration rejected`;
      case 'update_user_role':
        return `User role updated to ${details?.new_role || 'unknown'}`;
      case 'approve_action':
        return `${details?.action_type?.replace(/_/g, ' ') || 'Action'} request approved`;
      case 'reject_action':
        return `${details?.action_type?.replace(/_/g, ' ') || 'Action'} request rejected`;
      case 'profile_update_request':
        return `Profile update requested`;
      case 'approve_profile_update':
        return `Profile update request approved`;
      case 'reject_profile_update':
        return `Profile update request rejected`;
      case 'show_results_to_voters':
        return `Election results published to voters`;
      case 'hide_results_from_voters':
        return `Election results hidden from voters`;
      case 'create_election':
        return `New election created: ${details?.title || 'Unknown'}`;
      case 'add_candidate':
        return `Candidate added: ${details?.full_name || 'Unknown'}`;
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const fetchAuditLogs = async () => {
    if (!user?.id || !profile) return;
    
    // Only staff and admin can view audit logs based on their permissions
    if (profile.role !== 'Staff' && profile.role !== 'Administrator') {
      setError('Insufficient permissions to view audit logs');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First, fetch audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (auditError) throw auditError;

      // Get unique actor IDs (excluding null values)
      const actorIds = [...new Set(auditData?.map(log => log.actor_id).filter(Boolean) || [])];

      // If there are actor IDs, fetch their profiles
      let profilesData: any[] = [];
      if (actorIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, student_id, email, role, course, year_level')
          .in('user_id', actorIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Create a map for quick profile lookup
      const profileMap = new Map(
        profilesData.map(profile => [profile.user_id, profile])
      );

      // Merge audit logs with profile data
      const formattedLogs: AuditLogEntry[] = auditData?.map(entry => ({
        id: entry.id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        details: entry.details,
        timestamp: entry.timestamp,
        description: formatActionDescription(entry.action, entry.details, entry.resource_type),
        ip_address: entry.ip_address as string | null,
        user_agent: entry.user_agent as string | null,
        actor_id: entry.actor_id as string | null,
        actor_role: entry.actor_role as string | null,
        actor_profile: entry.actor_id ? profileMap.get(entry.actor_id) || null : null
      })) || [];

      setAuditLogs(formattedLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [user?.id, profile?.role]);

  return { auditLogs, loading, error, refetch: fetchAuditLogs };
};