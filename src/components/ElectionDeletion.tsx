import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle } from 'lucide-react';
import { StepUpVerification } from './StepUpVerification';

interface ElectionDeletionProps {
  election: {
    id: string;
    title: string;
    status: string;
  };
  onDeleted: () => void;
}

export const ElectionDeletion = ({ election, onDeleted }: ElectionDeletionProps) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE' to confirm deletion",
        variant: "destructive"
      });
      return;
    }

    setDeleting(true);
    try {
      // Delete related data in order to maintain referential integrity
      
      // 1. Delete votes
      await supabase
        .from('votes')
        .delete()
        .eq('election_id', election.id);

      // 2. Delete voting sessions
      await supabase
        .from('voting_sessions')
        .delete()
        .eq('election_id', election.id);

      // 3. Delete candidates
      await supabase
        .from('candidates')
        .delete()
        .eq('election_id', election.id);

      // 4. Delete positions
      await supabase
        .from('positions')
        .delete()
        .eq('election_id', election.id);

      // 5. Delete pending actions related to this election
      await supabase
        .from('pending_actions')
        .delete()
        .or(`action_data->>'election_id'.eq.${election.id},action_data->'election_id'.eq.${election.id}`);

      // 6. Finally, delete the election
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', election.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Election deleted successfully"
      });

      setOpen(false);
      setConfirmText('');
      onDeleted();
    } catch (error) {
      console.error('Failed to delete election:', error);
      toast({
        title: "Error",
        description: "Failed to delete election. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete Election
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Election
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This action cannot be undone. This will permanently delete:
              <ul className="mt-2 ml-4 list-disc">
                <li>All votes cast in this election</li>
                <li>All candidates and their information</li>
                <li>All positions and their details</li>
                <li>All related voting sessions</li>
                <li>All pending actions related to this election</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Election to delete: <strong> {election.title} </strong>
            </Label>
            <Label htmlFor="confirm"> 
               Type <strong> DELETE</strong> to confirm:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <StepUpVerification
              onVerified={handleDelete}
              actionType="delete_election"
              title="Delete Election - Two-Factor Authentication Required"
              description="Please enter your two-factor authentication code to confirm the deletion of this election."
            >
              <Button 
                variant="destructive" 
                disabled={deleting || confirmText !== 'DELETE'}
              >
                {deleting ? 'Deleting...' : 'Delete Election'}
              </Button>
            </StepUpVerification>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};