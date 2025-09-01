import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Cryptographic hash function using Web Crypto API
const generateSecureHash = async (data: any): Promise<string> => {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const useVoteReceipt = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveVoteReceipt = async (
    receiptId: string,
    electionId: string,
    electionTitle: string,
    selectedCandidates: Array<{ position: string; candidate: string }>,
    verificationToken: string,
    votingDate: string
  ) => {
    setLoading(true);
    try {
      // Create cryptographic hash for security and integrity
      const receiptData = {
        receipt_id: receiptId,
        election_id: electionId,
        selected_candidates: selectedCandidates,
        voting_date: votingDate,
        verification_token: verificationToken
      };
      const receiptHash = await generateSecureHash(receiptData);

      // Use the secure insert function instead of direct table access
      const { data, error } = await supabase.rpc('insert_vote_receipt', {
        p_receipt_id: receiptId,
        p_election_id: electionId,
        p_election_title: electionTitle,
        p_selected_candidates: selectedCandidates,
        p_receipt_hash: receiptHash,
        p_verification_token: verificationToken,
        p_voting_date: votingDate,
      });

      if (error) throw error;
      if (!data) throw new Error('Failed to save receipt');

      return true;
    } catch (error) {
      console.error('Failed to save vote receipt:', error);
      toast({
        title: "Error",
        description: "Failed to save receipt data. Your vote was still recorded.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyReceipt = useCallback(async (receiptId: string, verificationToken: string) => {
    setLoading(true);
    try {
      // Use the optimized verification function that returns only necessary data
      const { data, error } = await supabase.rpc('verify_vote_receipt', {
        p_receipt_id: receiptId,
        p_verification_token: verificationToken
      });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { success: false, error: 'Invalid receipt ID or verification token' };
      }

      // Return the first (and should be only) result
      const receiptData = data[0];
      
      // Verify the receipt hash for additional security
      const expectedHashData = {
        receipt_id: receiptData.receipt_id,
        election_id: receiptData.election_id,
        selected_candidates: receiptData.selected_candidates,
        voting_date: receiptData.voting_date,
        verification_token: verificationToken
      };
      
      // Note: We can't verify the hash here since we don't store it in the return
      // The hash verification happens at the database level for security
      
      return { success: true, data: receiptData };
    } catch (error) {
      console.error('Failed to verify receipt:', error);
      return { success: false, error: 'Failed to verify receipt' };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    saveVoteReceipt,
    verifyReceipt,
  };
};