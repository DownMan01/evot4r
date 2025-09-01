import { useState, useEffect, useRef } from 'react';
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
  cover_image_url: string | null;
  eligible_voters: string | null;
  show_results_to_voters: boolean;
}

interface UseOptimizedElectionsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  refetchInterval?: number;
  userRole?: string;
}

export const useOptimizedElections = (options: UseOptimizedElectionsOptions = {}) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  
  const { 
    limit = 10, 
    offset = 0, 
    status, 
    refetchInterval = 0, // Disable auto-polling by default
    userRole
  } = options;

  const cacheRef = useRef<Map<string, { data: Election[]; timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CACHE_DURATION = 30000; // 30 seconds cache
  const REQUEST_TIMEOUT = 15000; // 15 second timeout

  const getCacheKey = () => `${limit}-${offset}-${status || 'all'}-${userRole || 'none'}`;

  const fetchElections = async (showLoading = true) => {
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setElections(cached.data);
      setLoading(false);
      return;
    }

    // Cancel previous request and timeout
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Request canceled');
    }
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }

    abortControllerRef.current = new AbortController();
    
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Set timeout for the request
      requestTimeoutRef.current = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort('Request timeout');
        }
      }, REQUEST_TIMEOUT);

      let query = supabase
        .from('elections')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply role-based filtering at database level
      if (userRole === 'Voter') {
        query = query.in('status', ['Active', 'Upcoming']);
      }

      const { data, error: fetchError, count } = await query.abortSignal(
        abortControllerRef.current.signal
      );

      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }

      if (fetchError) throw fetchError;

      const electionsData = data || [];
      
      // Cache the result
      cacheRef.current.set(cacheKey, {
        data: electionsData,
        timestamp: Date.now()
      });

      setElections(electionsData);
      setTotalCount(count || 0);
    } catch (err: any) {
      // Updated check for Supabase-specific abort error (code '20')
      if (err.code === '20' || err.name === 'AbortError') {
        console.debug('Request aborted, ignoring...');
        return;
      }
      
      console.error('Error fetching elections:', err);
      setError('Failed to load elections. Please check your connection and try again.');
      if (showLoading) {
        toast({
          title: "Error",
          description: "Failed to load elections. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
    }
  };

  // Debounced fetch to handle rapid changes
  const debouncedFetch = () => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchElections();
    }, 300); // 300ms debounce for all fetches
  };

  const refreshElections = () => {
    cacheRef.current.clear();
    fetchElections(true);
  };

  useEffect(() => {
    debouncedFetch();

    // Only set up polling if enabled
    let interval: NodeJS.Timeout | null = null;
    if (refetchInterval > 0) {
      interval = setInterval(() => {
        fetchElections(false);
      }, refetchInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Component unmounted');
      }
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [limit, offset, status, refetchInterval, userRole]); // Added userRole to dependencies

  return {
    elections,
    loading,
    error,
    totalCount,
    refetch: refreshElections,
    hasNextPage: offset + limit < totalCount,
    hasPreviousPage: offset > 0,
  };
};
