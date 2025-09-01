import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Candidate {
  id: string;
  full_name: string;
  bio: string | null;
  image_url: string | null;
  position_title: string;
  election_title: string;
  election_status: string;
  election_id: string;
  position_id: string;
  why_vote_me?: string | null;
  partylist?: string | null;
  jhs_school?: string | null;
  jhs_graduation_year?: number | null;
  shs_school?: string | null;
  shs_graduation_year?: number | null;
}

interface UseOptimizedCandidatesOptions {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  electionId?: string;
}

export const useOptimizedCandidates = (options: UseOptimizedCandidatesOptions = {}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  
  const { limit = 1000, offset = 0, searchTerm = '', electionId } = options;

  const cacheRef = useRef<Map<string, { data: Candidate[]; timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CACHE_DURATION = 15000; // 15 seconds cache

  const getCacheKey = () => `${limit}-${offset}-${searchTerm}-${electionId || 'all'}`;

  const fetchCandidates = async (showLoading = true) => {
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    
    // Return cached data if still valid and no search
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && !searchTerm) {
      setCandidates(cached.data);
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Request canceled');
    }

    abortControllerRef.current = new AbortController();
    
    try {
      if (showLoading) setLoading(true);
      setError(null);

      let query = supabase
        .from('candidates')
        .select(`
          *,
          positions!candidates_position_id_fkey(
            title,
            elections!positions_election_id_fkey(
              title,
              status
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (electionId) {
        query = query.eq('election_id', electionId);
      }

      const { data, error: fetchError, count } = await query.abortSignal(
        abortControllerRef.current.signal
      );

      if (fetchError) throw fetchError;

      let formattedCandidates = data?.map((candidate: any) => ({
        id: candidate.id,
        full_name: candidate.full_name,
        bio: candidate.bio,
        image_url: candidate.image_url,
        position_title: candidate.positions.title,
        election_title: candidate.positions.elections.title,
        election_status: candidate.positions.elections.status,
        election_id: candidate.election_id,
        position_id: candidate.position_id,
        why_vote_me: candidate.why_vote_me,
        partylist: candidate.partylist,
        jhs_school: candidate.jhs_school,
        jhs_graduation_year: candidate.jhs_graduation_year,
        shs_school: candidate.shs_school,
        shs_graduation_year: candidate.shs_graduation_year
      })) || [];

      // Client-side search filtering for performance
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        formattedCandidates = formattedCandidates.filter(candidate =>
          candidate.full_name.toLowerCase().includes(lowerSearch) ||
          candidate.position_title.toLowerCase().includes(lowerSearch) ||
          candidate.election_title.toLowerCase().includes(lowerSearch) ||
          candidate.bio?.toLowerCase().includes(lowerSearch) ||
          candidate.partylist?.toLowerCase().includes(lowerSearch)
        );
      }

      // Cache the result (only if no search)
      if (!searchTerm) {
        cacheRef.current.set(cacheKey, {
          data: formattedCandidates,
          timestamp: Date.now()
        });
      }

      setCandidates(formattedCandidates);
      setTotalCount(count || 0);
    } catch (err: any) {
      if (err.code === '20' || err.name === 'AbortError') {
        console.debug('Request aborted, ignoring...');
        return;
      }
      
      console.error('Error fetching candidates:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load candidates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const debouncedFetch = () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchCandidates();
    }, 300); // 300ms debounce for all fetches
  };

  useEffect(() => {
    debouncedFetch();
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted');
      }
    };
  }, [limit, offset, searchTerm, electionId]);

  const refreshCandidates = () => {
    cacheRef.current.clear();
    fetchCandidates(true);
  };

  return {
    candidates,
    loading,
    error,
    totalCount,
    refetch: refreshCandidates,
    hasNextPage: offset + limit < totalCount,
    hasPreviousPage: offset > 0,
  };
};
