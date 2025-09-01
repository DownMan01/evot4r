import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useAuditLog = () => {
  const { user, profile } = useAuth();

  const logAction = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    if (!user || !profile) return;

    try {
      await supabase.rpc('log_audit_action', {
        p_actor_id: user.id,
        p_actor_role: profile.role,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  };

  const logVoterActivity = async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.rpc('log_voter_activity', {
        p_user_id: user.id,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details || {}
      });
    } catch (error) {
      console.error('Failed to log voter activity:', error);
    }
  };

  const fetchAuditLogs = async (limit = 50) => {
    try {
      // Add timeout for better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Supabase error fetching audit logs:', error);
        throw error;
      }

      // Manually fetch profile data for logs with actor_id - but avoid too many parallel requests
      const logsWithProfiles = [];
      for (const log of (data || [])) {
        if (log.actor_id) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, student_id')
              .eq('user_id', log.actor_id)
              .single();
            
            logsWithProfiles.push({ ...log, profiles: profile });
          } catch {
            logsWithProfiles.push({ ...log, profiles: null });
          }
        } else {
          logsWithProfiles.push({ ...log, profiles: null });
        }
      }

      return logsWithProfiles;
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      
      if (error.name === 'AbortError') {
        console.error('Audit logs request timeout');
      } else if (error.message?.includes('Failed to fetch')) {
        console.error('Network connection error for audit logs');
      }
      
      return [];
    }
  };

  return {
    logAction,
    logVoterActivity,
    fetchAuditLogs
  };
};