import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Universal notification hook that provides role-aware notification creation
 * for all user types (Voter, Staff, Administrator)
 */
export const useUniversalNotifications = () => {
  const { createNotification } = useNotifications();
  const { profile } = useAuth();
  const { toast } = useToast();

  /**
   * Notify staff/admin about voter actions (profile updates, appeals, etc.)
   */
  const notifyStaffAndAdmin = async (
    title: string,
    message: string,
    type: string = 'user_action',
    data?: any,
    priority: string = 'medium'
  ) => {
    try {
      await createNotification(
        title,
        message,
        type,
        priority,
        undefined, // No specific recipient
        ['Staff', 'Administrator'], // Target roles
        data,
        '/admin'
      );
      return true;
    } catch (error) {
      console.error('Failed to notify staff/admin:', error);
      return false;
    }
  };

  /**
   * Notify a specific user about an action result (approval, rejection, etc.)
   */
  const notifyUser = async (
    userId: string,
    title: string,
    message: string,
    type: string = 'system_update',
    data?: any,
    priority: string = 'medium',
    linkUrl?: string
  ) => {
    try {
      await createNotification(
        title,
        message,
        type,
        priority,
        userId, // Specific recipient
        undefined, // No target roles
        data,
        linkUrl
      );
      return true;
    } catch (error) {
      console.error('Failed to notify user:', error);
      return false;
    }
  };

  /**
   * Notify all voters about elections or system-wide announcements
   */
  const notifyAllVoters = async (
    title: string,
    message: string,
    type: string = 'system_announcement',
    data?: any,
    priority: string = 'medium',
    linkUrl?: string
  ) => {
    try {
      // Only staff/admin can create notifications targeting all voters
      if (!profile || !['Staff', 'Administrator'].includes(profile.role)) {
        throw new Error('Only staff and administrators can notify all voters');
      }

      await createNotification(
        title,
        message,
        type,
        priority,
        undefined, // No specific recipient
        ['Voter'], // Target all voters
        data,
        linkUrl
      );
      return true;
    } catch (error) {
      console.error('Failed to notify all voters:', error);
      return false;
    }
  };

  /**
   * Create a self-notification (voter notifying themselves)
   */
  const notifySelf = async (
    title: string,
    message: string,
    type: string = 'personal_reminder',
    data?: any,
    priority: string = 'low',
    linkUrl?: string
  ) => {
    try {
      if (!profile?.user_id) {
        throw new Error('User not authenticated');
      }

      await createNotification(
        title,
        message,
        type,
        priority,
        profile.user_id, // Self notification
        undefined, // No target roles
        data,
        linkUrl
      );
      return true;
    } catch (error) {
      console.error('Failed to create self notification:', error);
      return false;
    }
  };

  /**
   * Helper for profile update request notifications (Staff only)
   */
  const notifyProfileUpdateRequest = async (requestData?: any) => {
    try {
      await createNotification(
        'New Profile Update Request',
        'A voter has submitted a profile update request that requires review.',
        'profile_update_request',
        'medium',
        undefined, // No specific recipient
        ['Staff'], // Only Staff role
        requestData,
        '/admin'
      );
      return true;
    } catch (error) {
      console.error('Failed to notify staff:', error);
      return false;
    }
  };

  /**
   * Helper for profile update response notifications
   */
  const notifyProfileUpdateResponse = async (
    userId: string,
    approved: boolean,
    adminNotes?: string,
    requestData?: any
  ) => {
    const title = approved ? 'Profile Update Approved' : 'Profile Update Rejected';
    let message = approved 
      ? 'Your profile update request has been approved and applied to your account.'
      : 'Your profile update request has been rejected.';
    
    if (!approved && adminNotes) {
      message += ` Reason: ${adminNotes}`;
    }
    
    if (!approved) {
      message += ' You can submit a new request with corrections.';
    }

    return await notifyUser(
      userId,
      title,
      message,
      'profile_update_request',
      { 
        status: approved ? 'approved' : 'rejected', 
        admin_notes: adminNotes,
        ...requestData 
      },
      approved ? 'medium' : 'high',
      '/settings'
    );
  };

  /**
   * Helper for user registration notifications
   */
  const notifyRegistrationResponse = async (
    userId: string,
    approved: boolean,
    reason?: string
  ) => {
    const title = approved ? 'Registration Approved' : 'Registration Rejected';
    let message = approved
      ? 'Your voter registration has been approved. You can now participate in elections.'
      : 'Your voter registration has been rejected.';
    
    if (!approved && reason) {
      message += ` Reason: ${reason}`;
    }
    
    if (!approved) {
      message += ' You can appeal this decision in your profile settings.';
    }

    return await notifyUser(
      userId,
      title,
      message,
      'voter_registration',
      { 
        status: approved ? 'approved' : 'rejected', 
        reason 
      },
      'high',
      approved ? '/dashboard' : '/settings'
    );
  };

  /**
   * Helper for election-related notifications
   */
  const notifyElectionUpdate = async (
    title: string,
    message: string,
    electionData?: any,
    targetRoles: ('Voter' | 'Staff' | 'Administrator')[] = ['Voter', 'Staff', 'Administrator']
  ) => {
    try {
      // Only staff/admin can create election notifications
      if (!profile || !['Staff', 'Administrator'].includes(profile.role)) {
        throw new Error('Only staff and administrators can create election notifications');
      }

      await createNotification(
        title,
        message,
        'election_update',
        'high',
        undefined,
        targetRoles,
        electionData,
        '/dashboard'
      );
      return true;
    } catch (error) {
      console.error('Failed to notify election update:', error);
      return false;
    }
  };

  return {
    // Core functions
    notifyStaffAndAdmin,
    notifyUser,
    notifyAllVoters,
    notifySelf,
    
    // Helper functions for common scenarios
    notifyProfileUpdateRequest,
    notifyProfileUpdateResponse,
    notifyRegistrationResponse,
    notifyElectionUpdate,
    
    // Direct access to the underlying function
    createNotification
  };
};