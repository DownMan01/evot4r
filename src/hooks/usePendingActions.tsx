import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PendingAction {
  id: string;
  action_type: string;
  requested_by: string;
  requested_at: string;
  status: string;
  action_data: any;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export const usePendingActions = () => {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPendingActions = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout and abort controller for better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const { data, error } = await supabase
        .from('pending_actions')
        .select('*')
        .order('requested_at', { ascending: false });

      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setPendingActions(data || []);
    } catch (error: any) {
      console.error('Failed to fetch pending actions:', error);
      
      // More detailed error handling
      if (error.name === 'AbortError') {
        setError('Request timeout - please try again');
      } else if (error.message?.includes('Failed to fetch')) {
        setError('Network connection error - please check your internet connection');
      } else {
        setError(error.message || 'Failed to fetch pending actions');
      }
    } finally {
      setLoading(false);
    }
  };

  const createElectionRequest = async (electionData: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    positions: Array<{
      title: string;
      description: string;
      max_candidates: number;
    }>;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('pending_actions')
        .insert({
          action_type: 'create_election',
          requested_by: user.id,
          action_data: electionData
        });

      if (error) throw error;

      await fetchPendingActions();
      
      // Notify administrators about new pending action
      try {
        await supabase.rpc('notify_pending_action_created', {
          p_action_type: 'create_election',
          p_details: `Election: "${electionData.title}"`
        });
      } catch (notificationError) {
        console.warn('Failed to send admin notification:', notificationError);
      }
      
      toast({
        title: "Success",
        description: "Election creation request submitted for admin approval"
      });
      
      return true;
    } catch (error) {
      console.error('Failed to create election request:', error);
      toast({
        title: "Error",
        description: "Failed to submit election request",
        variant: "destructive"
      });
      return false;
    }
  };

  const addCandidateRequest = async (candidateData: {
    election_id: string;
    position_id: string;
    full_name: string;
    bio: string;
    image_url?: string;
  }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('pending_actions')
        .insert({
          action_type: 'add_candidate',
          requested_by: user.id,
          action_data: candidateData
        });

      if (error) throw error;

      await fetchPendingActions();
      
      // Notify administrators about new pending action
      try {
        await supabase.rpc('notify_pending_action_created', {
          p_action_type: 'add_candidate',
          p_details: `Candidate: "${candidateData.full_name}"`
        });
      } catch (notificationError) {
        console.warn('Failed to send admin notification:', notificationError);
      }
      
      toast({
        title: "Success",
        description: "Candidate addition request submitted for admin approval"
      });
      
      return true;
    } catch (error) {
      console.error('Failed to create candidate request:', error);
      toast({
        title: "Error",
        description: "Failed to submit candidate request",
        variant: "destructive"
      });
      return false;
    }
  };

  const publishResultsRequest = async (electionId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('pending_actions')
        .insert({
          action_type: 'publish_results',
          requested_by: user.id,
          action_data: { election_id: electionId }
        });

      if (error) throw error;

      await fetchPendingActions();
      
      // Notify administrators about new pending action
      try {
        await supabase.rpc('notify_pending_action_created', {
          p_action_type: 'publish_results',
          p_details: `Results publication request`
        });
      } catch (notificationError) {
        console.warn('Failed to send admin notification:', notificationError);
      }
      
      toast({
        title: "Success",
        description: "Results publication request submitted for admin approval"
      });
      
      return true;
    } catch (error) {
      console.error('Failed to create results request:', error);
      toast({
        title: "Error",
        description: "Failed to submit results request",
        variant: "destructive"
      });
      return false;
    }
  };

  const approveAction = async (actionId: string, notes?: string) => {
    try {
      // Get the action details first to handle cover image upload
      const { data: actionData, error: fetchError } = await supabase
        .from('pending_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      if (fetchError) throw fetchError;

      // No need to upload image here - it's already uploaded during staff creation
      // Just proceed with approval as the database function will handle the final image path

      const { error } = await supabase.rpc('approve_pending_action', {
        p_action_id: actionId,
        p_admin_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Action approved successfully"
      });
      
      await fetchPendingActions();
      return true;
    } catch (error: any) {
      console.error('Failed to approve action:', error);
      
      // Provide more detailed error message
      let errorMessage = "Failed to approve action";
      if (error?.message) {
        if (error.message.includes('Only administrators')) {
          errorMessage = "You don't have permission to approve actions. Only administrators can approve actions.";
        } else if (error.message.includes('not found')) {
          errorMessage = "Action not found or already processed";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  const rejectAction = async (actionId: string, notes?: string) => {
    try {
      const { error } = await supabase.rpc('reject_pending_action', {
        p_action_id: actionId,
        p_admin_notes: notes || null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Action rejected"
      });
      
      await fetchPendingActions();
      return true;
    } catch (error: any) {
      console.error('Failed to reject action:', error);
      
      // Provide more detailed error message
      let errorMessage = "Failed to reject action";
      if (error?.message) {
        if (error.message.includes('Only administrators')) {
          errorMessage = "You don't have permission to reject actions. Only administrators can reject actions.";
        } else if (error.message.includes('not found')) {
          errorMessage = "Action not found or already processed";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchPendingActions();
  }, [user]);

  return {
    pendingActions,
    loading,
    error,
    createElectionRequest,
    addCandidateRequest,
    publishResultsRequest,
    approveAction,
    rejectAction,
    refetch: fetchPendingActions
  };
};