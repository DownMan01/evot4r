import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVoting = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createVotingSession = async (electionId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_voting_session', {
        p_election_id: electionId
      });

      if (error) throw error;
      return data; // Returns session token
    } catch (error) {
      console.error('Failed to create voting session:', error);
      toast({
        title: "Error",
        description: "Failed to start voting session. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const castAnonymousVote = async (
    sessionToken: string,
    candidateId: string,
    electionId: string,
    positionId: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cast_anonymous_vote', {
        p_session_token: sessionToken,
        p_candidate_id: candidateId,
        p_election_id: electionId,
        p_position_id: positionId
      });

      if (error) throw error;
      
      toast({
        title: "Vote Cast Successfully",
        description: "Your vote has been recorded anonymously.",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      toast({
        title: "Error",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkVotingStatus = async (electionId: string) => {
    try {
      const { data, error } = await supabase
        .from('voting_sessions')
        .select('has_voted, expires_at')
        .eq('election_id', electionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return {
        hasVoted: data?.has_voted || false,
        isExpired: data?.expires_at ? new Date(data.expires_at) < new Date() : false
      };
    } catch (error) {
      console.error('Failed to check voting status:', error);
      return { hasVoted: false, isExpired: false };
    }
  };

  return {
    loading,
    createVotingSession,
    castAnonymousVote,
    checkVotingStatus
  };
};