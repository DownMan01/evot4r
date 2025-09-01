import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PendingUser {
  id: string;
  user_id: string;
  student_id: string | null;
  full_name: string | null;
  email: string | null;
  registration_status: string;
  created_at: string;
}

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingResendData, setPendingResendData] = useState<{userId: string, adminNotes?: string} | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_profiles_with_email_status');

      if (error) throw error;
      
      // Filter for pending users only
      const pendingUsers = data?.filter(user => user.registration_status === 'Pending') || [];
      return pendingUsers;
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending users",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const approveUser = useCallback(async (userId: string, adminNotes?: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('approve_user_registration', {
        p_user_id: userId,
        p_admin_notes: adminNotes
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User registration approved successfully",
      });
      return true;
    } catch (error: any) {
      console.error('Error approving user:', error);
      
      // Provide more detailed error message
      let errorMessage = "Failed to approve user registration";
      if (error?.message) {
        if (error.message.includes('Only administrators')) {
          errorMessage = "You don't have permission to approve users. Only administrators can approve user registrations.";
        } else if (error.message.includes('not found')) {
          errorMessage = "User not found or registration already processed";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const rejectUser = useCallback(async (userId: string, adminNotes?: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('reject_user_registration', {
        p_user_id: userId,
        p_admin_notes: adminNotes
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User registration rejected",
      });
      return true;
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      
      // Provide more detailed error message
      let errorMessage = "Failed to reject user registration";
      if (error?.message) {
        if (error.message.includes('Only administrators')) {
          errorMessage = "You don't have permission to reject users. Only administrators can reject user registrations.";
        } else if (error.message.includes('not found')) {
          errorMessage = "User not found or registration already processed";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_profiles_with_email_status');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resendConfirmationEmail = useCallback(async (userId: string, adminNotes?: string) => {
    // Check if current admin has 2FA enabled
    if (profile?.two_factor_enabled) {
      // Store the pending action and trigger 2FA verification
      setPendingResendData({ userId, adminNotes });
      setRequiresTwoFactor(true);
      return { requiresTwoFactor: true };
    }

    // If no 2FA, proceed directly
    return await performResendEmail(userId, adminNotes);
  }, [profile, toast]);

  const performResendEmail = useCallback(async (userId: string, adminNotes?: string) => {
    try {
      setLoading(true);

      // First, get the user's email from the database
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', userId)
        .single();

      if (userError || !userProfile?.email) {
        throw new Error('User email not found');
      }

      // Use Supabase's built-in resend method (same as signup flow)
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: userProfile.email
      });

      if (resendError) {
        throw new Error(resendError.message);
      }

      // Log the admin action using existing audit function
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user) {
        const { error: logError } = await supabase.rpc('log_audit_action', {
          p_actor_id: currentUser.data.user.id,
          p_actor_role: 'Administrator',
          p_action: 'resend_confirmation_email',
          p_resource_type: 'user_profile',
          p_resource_id: userId,
          p_details: {
            target_email: userProfile.email,
            admin_notes: adminNotes,
            resent_at: new Date().toISOString()
          }
        });

        if (logError) {
          console.warn('Failed to log resend action:', logError);
          // Don't fail the whole operation if logging fails
        }
      }

      toast({
        title: "Success",
        description: `Confirmation email resent to ${userProfile.email}`,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error resending confirmation email:', error);
      
      let errorMessage = "Failed to resend confirmation email";
      if (error?.message) {
        if (error.message.includes('Email rate limit exceeded')) {
          errorMessage = "Email rate limit exceeded. Please wait before trying again.";
        } else if (error.message.includes('User not found') || error.message.includes('email not found')) {
          errorMessage = "User email not found";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleTwoFactorVerified = useCallback(async () => {
    if (pendingResendData) {
      const result = await performResendEmail(pendingResendData.userId, pendingResendData.adminNotes);
      setPendingResendData(null);
      setRequiresTwoFactor(false);
      return result;
    }
    return { success: false };
  }, [pendingResendData, performResendEmail]);

  const cancelTwoFactorVerification = useCallback(() => {
    setPendingResendData(null);
    setRequiresTwoFactor(false);
  }, []);

  return {
    loading,
    fetchPendingUsers,
    approveUser,
    rejectUser,
    getAllUsers,
    resendConfirmationEmail,
    requiresTwoFactor,
    handleTwoFactorVerified,
    cancelTwoFactorVerification,
  };
};