import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useUniversalNotifications } from '@/hooks/useUniversalNotifications';

interface ProfileUpdateRequest {
  id: string;
  user_id: string;
  current_email: string | null;
  requested_email: string | null;
  current_year_level: string | null;
  requested_year_level: string | null;
  status: string;
  admin_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  // User profile fields
  full_name: string | null;
  student_id: string | null;
  course: string | null;
  year_level: string | null;
  gender: string | null;
  id_image_url: string | null;
  email: string | null;
  registration_status: string | null;
}

export const useProfileUpdateRequests = () => {
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { logVoterActivity } = useAuditLog();
  const { notifyProfileUpdateRequest } = useUniversalNotifications();

  const fetchRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First get profile update requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('profile_update_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(requestsData.map(req => req.user_id))];

      // Get profiles for these users with proper admin access
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, student_id, course, year_level, gender, id_image_url, email, registration_status')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        // Continue without profile data instead of throwing error
      }

      // Create a lookup map for profiles
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      // Merge requests with profile data
      const enrichedRequests = requestsData.map(request => ({
        ...request,
        full_name: profilesMap.get(request.user_id)?.full_name || null,
        student_id: profilesMap.get(request.user_id)?.student_id || null,
        course: profilesMap.get(request.user_id)?.course || null,
        year_level: profilesMap.get(request.user_id)?.year_level || null,
        gender: profilesMap.get(request.user_id)?.gender || null,
        id_image_url: profilesMap.get(request.user_id)?.id_image_url || null,
        email: profilesMap.get(request.user_id)?.email || null,
        registration_status: profilesMap.get(request.user_id)?.registration_status || null,
      }));
      
      setRequests(enrichedRequests);
    } catch (error: any) {
      console.error('Failed to fetch profile update requests:', error);
      setError(error.message || 'Failed to fetch profile update requests');
    } finally {
      setLoading(false);
    }
  };

  const submitUpdateRequest = async (data: {
    email?: string;
    year_level?: string;
  }) => {
    if (!user) return false;

    try {
      // Get current profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, year_level')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Check if there's already a pending request
      const { data: existingRequest, error: existingError } = await supabase
        .from('profile_update_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'Pending')
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingRequest) {
        toast({
          title: "Error",
          description: "You already have a pending profile update request",
          variant: "destructive"
        });
        return false;
      }

      // Prepare request data
      const requestData: any = {
        user_id: user.id,
        current_email: profile?.email,
        current_year_level: profile?.year_level
      };

      // Only include fields that are actually changing
      if (data.email && data.email !== profile?.email) {
        requestData.requested_email = data.email;
      }
      if (data.year_level && data.year_level !== profile?.year_level) {
        requestData.requested_year_level = data.year_level;
      }

      // Check if there are any changes
      if (!requestData.requested_email && !requestData.requested_year_level) {
        toast({
          title: "No Changes",
          description: "No changes detected in your profile update request",
          variant: "destructive"
        });
        return false;
      }

      const { data: insertData, error } = await supabase
        .from('profile_update_requests')
        .insert(requestData)
        .select('id')
        .single();

      if (error) throw error;

      // Log voter activity
      await logVoterActivity(
        'profile_update_request',
        'profile_update_request',
        insertData?.id,
        {
          requested_changes: {
            email: requestData.requested_email ? { from: requestData.current_email, to: requestData.requested_email } : null,
            year_level: requestData.requested_year_level ? { from: requestData.current_year_level, to: requestData.requested_year_level } : null
          }
        }
      );

      // Notification will be automatically created by database trigger

      toast({
        title: "Success",
        description: "Profile update request submitted for staff approval"
      });
      
      await fetchRequests();
      return true;
    } catch (error: any) {
      console.error('Failed to submit profile update request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit profile update request",
        variant: "destructive"
      });
      return false;
    }
  };

  const approveRequest = async (requestId: string, notes?: string) => {
    try {
      const { error } = await supabase.rpc('approve_profile_update_request', {
        p_request_id: requestId,
        p_admin_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile update request approved"
      });
      
      await fetchRequests();
      return true;
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive"
      });
      return false;
    }
  };

  const rejectRequest = async (requestId: string, notes?: string) => {
    try {
      const { error } = await supabase.rpc('reject_profile_update_request', {
        p_request_id: requestId,
        p_admin_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile update request rejected"
      });
      
      await fetchRequests();
      return true;
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  return {
    requests,
    loading,
    error,
    submitUpdateRequest,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests
  };
};