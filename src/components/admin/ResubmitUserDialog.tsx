import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StepUpVerification } from '../StepUpVerification';
import { RotateCcw } from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  student_id: string | null;
  email: string | null;
  registration_status: string;
}

interface ResubmitUserDialogProps {
  user: User;
  onSuccess: () => void;
}

export const ResubmitUserDialog = ({ user, onSuccess }: ResubmitUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          registration_status: 'Rejected',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been marked for resubmission. They will need to update their details.",
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark user for resubmission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <RotateCcw className="h-3 w-3" />
          Request Resubmit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request User Resubmission</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will mark <strong>{user.full_name}</strong> for resubmission. 
            They will be able to update their profile details and resubmit for approval.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <StepUpVerification
              onVerified={handleResubmit}
              actionType="request_resubmit"
              title="Verify Identity"
              description="Please verify your identity to request user resubmission."
            >
              <Button disabled={loading}>
                {loading ? 'Processing...' : 'Confirm Resubmit'}
              </Button>
            </StepUpVerification>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};