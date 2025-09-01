import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VotingHistoryEntry {
  id: string;
  election_title: string;
  candidate_name: string;
  position_title: string;
  created_at: string;
  election_id: string;
}

export const useVotingHistory = () => {
  const [votingHistory, setVotingHistory] = useState<VotingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchVotingHistory = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          created_at,
          election_id,
          candidate_id,
          position_id,
          elections!votes_election_id_fkey(title),
          candidates!votes_candidate_id_fkey(full_name),
          positions!votes_position_id_fkey(title)
        `)
        .eq('voter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedHistory: VotingHistoryEntry[] = data?.map(vote => ({
        id: vote.id,
        election_title: (vote.elections as any)?.title || 'Unknown Election',
        candidate_name: (vote.candidates as any)?.full_name || 'Unknown Candidate',
        position_title: (vote.positions as any)?.title || 'Unknown Position',
        created_at: vote.created_at,
        election_id: vote.election_id
      })) || [];

      setVotingHistory(formattedHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch voting history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotingHistory();
  }, [user?.id]);

  return { votingHistory, loading, error, refetch: fetchVotingHistory };
};