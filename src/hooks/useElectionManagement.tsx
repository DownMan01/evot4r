import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Election {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useElectionManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchElections = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Election[];
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast({
        title: "Error",
        description: "Failed to fetch elections",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateElectionStatus = useCallback(async (electionId: string, status: string, showToast: boolean = true) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('elections')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', electionId);

      if (error) throw error;

      if (showToast) {
        toast({
          title: "Success",
          description: `Election status updated to ${status}`,
        });
      }
      return true;
    } catch (error) {
      console.error('Error updating election status:', error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to update election status",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkAndUpdateElectionStatuses = useCallback(async () => {
    try {
      // Use the new database function for better performance and consistency
      const { error } = await supabase.rpc('auto_update_election_statuses');

      if (error) {
        console.error('Error updating election statuses:', error);
        // Fallback to manual checking if the function fails
        const { data: elections, error: fetchError } = await supabase
          .from('elections')
          .select('*')
          .in('status', ['Upcoming', 'Active']);

        if (fetchError) throw fetchError;

        const now = new Date();
        
        for (const election of elections || []) {
          const startDate = new Date(election.start_date);
          const endDate = new Date(election.end_date);
          
          let newStatus = election.status;
          
          if (now >= startDate && now <= endDate && election.status === 'Upcoming') {
            newStatus = 'Active';
          } else if (now > endDate && election.status === 'Active') {
            newStatus = 'Completed';
          }
          
          if (newStatus !== election.status) {
            await updateElectionStatus(election.id, newStatus, false); // Don't show toast for automatic updates
          }
        }
      }
    } catch (error) {
      console.error('Error checking election statuses:', error);
    }
  }, [updateElectionStatus]);

  return {
    loading,
    fetchElections,
    updateElectionStatus,
    checkAndUpdateElectionStatuses,
  };
};