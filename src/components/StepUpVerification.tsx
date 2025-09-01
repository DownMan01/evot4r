import { useState } from 'react';
import { TwoFactorVerification } from './TwoFactorVerification';
import { useAuth } from '@/hooks/useAuth';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { supabase } from '@/integrations/supabase/client';

interface StepUpVerificationProps {
  onVerified: () => void;
  actionType: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const StepUpVerification = ({ 
  onVerified, 
  actionType, 
  title,
  description,
  children 
}: StepUpVerificationProps) => {
  const [showVerification, setShowVerification] = useState(false);
  const { profile } = useAuth();
  const { twoFactorEnabled } = useTwoFactor();

  const handleAction = async () => {
    // Check if step-up verification is required
    const requiresStepUp = profile?.role !== 'Voter' && 
                          twoFactorEnabled && 
                          (profile?.role === 'Staff' || profile?.role === 'Administrator');

    if (requiresStepUp) {
      // Check if user has valid step-up verification for this action
      const { data: verification } = await supabase
        .from('step_up_verifications')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('action_type', actionType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!verification) {
        setShowVerification(true);
        return;
      }
    }

    // Proceed with the action
    onVerified();
  };

  const handleVerificationSuccess = () => {
    setShowVerification(false);
    onVerified();
  };

  return (
    <>
      <div onClick={handleAction}>
        {children}
      </div>
      
      <TwoFactorVerification
        open={showVerification}
        onOpenChange={setShowVerification}
        onVerified={handleVerificationSuccess}
        actionType={actionType}
        title={title}
        description={description}
      />
    </>
  );
};