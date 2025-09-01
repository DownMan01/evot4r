import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StepUpVerification } from './StepUpVerification';
import { useAuth } from '@/hooks/useAuth';
import { Key, Lock } from 'lucide-react';

interface ChangePasswordDialogProps {
  children: React.ReactNode;
}

export const ChangePasswordDialog = ({ children }: ChangePasswordDialogProps) => {
  const { toast } = useToast();
  const { session, signOut, refreshSession } = useAuth();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [userEmail, setUserEmail] = useState<string>("");

  const validateSession = async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error || !currentSession) {
        const refreshSuccess = await refreshSession();
        if (refreshSuccess) return true;
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again to change your password.",
          variant: "destructive"
        });
        setOpen(false);
        await signOut();
        return false;
      }
      return true;
    } catch {
      toast({
        title: "Session Error",
        description: "Unable to verify your session. Please try logging in again.",
        variant: "destructive"
      });
      setOpen(false);
      await signOut();
      return false;
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast({ title: "Error", description: "Current password is required.", variant: "destructive" });
      return;
    }
    if (!passwordData.newPassword) {
      toast({ title: "Error", description: "New password is required.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast({ title: "Error", description: "New password must be different from current password.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const isSessionValid = await validateSession();
      if (!isSessionValid) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', session?.user?.id)
        .single();

      if (!profileData?.email) {
        toast({ title: "Error", description: "Unable to verify current user. Please try again.", variant: "destructive" });
        setLoading(false);
        return;
      }

      setUserEmail(profileData.email);

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password: passwordData.currentPassword
      });

      if (authError) {
        toast({ title: "Error", description: "Current password is incorrect.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) {
        if (error.message.includes('session')) {
          toast({
            title: "Session Error",
            description: "Your session has expired. Please log in again to change your password.",
            variant: "destructive"
          });
          setOpen(false);
          await signOut();
        } else {
          toast({ title: "Error", description: error.message || "Failed to update password.", variant: "destructive" });
        }
      } else {
        toast({
          title: "Success",
          description: "Password updated successfully. You will be signed out of all devices."
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setOpen(false);
      }
    } catch (error: any) {
      if (error?.message?.includes('session')) {
        toast({ title: "Session Error", description: "Your session has expired. Please log in again.", variant: "destructive" });
        setOpen(false);
        await signOut();
      } else {
        toast({ title: "Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
      }
    }

    setLoading(false);
  };

  const handleOpenChange = async (newOpen: boolean) => {
    if (!loading) {
      if (newOpen) {
        const isSessionValid = await validateSession();
        if (!isSessionValid) return;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', session?.user?.id)
          .single();
        if (profileData?.email) setUserEmail(profileData.email);
      }
      setOpen(newOpen);
      if (!newOpen) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="change-password-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> Change Password
          </DialogTitle>
          {/* Always rendered description with matching ID */}
          <DialogDescription id="change-password-description">
            Enter your current and new password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Security Notice:</strong> Changing your password will sign you out of all other devices.
              </div>
            </div>
          </div>

          <form className="space-y-4">
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={userEmail}
              readOnly
              hidden
              aria-hidden="true"
              tabIndex={-1}
            />

            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                aria-describedby="current-password-description"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))
                }
                placeholder="Enter your current password"
                disabled={loading}
              />
              <p id="current-password-description" className="sr-only">
                Enter your existing account password to verify identity.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                aria-describedby="new-password-description"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))
                }
                placeholder="Enter your new password"
                disabled={loading}
              />
              <p id="new-password-description" className="text-xs text-muted-foreground">
                Password must be at least 6 characters long.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                aria-describedby="confirm-password-description"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Confirm your new password"
                disabled={loading}
              />
              <p id="confirm-password-description" className="sr-only">
                Re-enter the new password to confirm.
              </p>
            </div>
          </form>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <StepUpVerification
              onVerified={handlePasswordChange}
              actionType="change_password"
              title="Verify Password Change"
              description="Please verify your identity to change your password."
            >
              <Button
                disabled={
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword ||
                  loading
                }
                className="min-w-[100px]"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </StepUpVerification>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
