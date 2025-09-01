import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StepUpVerification } from '../StepUpVerification';
import { Shield, AlertTriangle, UserCog } from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  student_id: string | null;
  email: string | null;
  role: string;
  registration_status: string;
  course: string | null;
  year_level: string | null;
  gender: string | null;
  id_image_url: string | null;
  created_at: string;
}

interface RoleChangeDialogProps {
  user: User;
  updateUserRole: (userId: string, role: 'Voter' | 'Staff' | 'Administrator') => Promise<void>;
  getRoleColor: (role: string) => string;
  children: React.ReactNode;
}

export const RoleChangeDialog = ({ 
  user, 
  updateUserRole, 
  getRoleColor, 
  children 
}: RoleChangeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Voter' | 'Staff' | 'Administrator'>(user.role as 'Voter' | 'Staff' | 'Administrator');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleUpdate = async () => {
    if (selectedRole === user.role) {
      setOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      await updateUserRole(user.user_id, selectedRole);
      setOpen(false);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'Voter':
        return 'Can participate in elections and view results when published';
      case 'Staff':
        return 'Can manage elections, candidates, and assist with administration tasks';
      case 'Administrator':
        return 'Full system access including user management and system configuration';
      default:
        return '';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Administrator':
        return <Shield className="h-4 w-4" />;
      case 'Staff':
        return <UserCog className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Change User Role
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{user.full_name || 'No Name'}</h4>
                <Badge className={`${getRoleColor(user.role)} text-white text-xs`}>
                  {user.role}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>ID: {user.student_id || 'N/A'}</p>
                <p>Email: {user.email || 'N/A'}</p>
                <p>Course: {user.course || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Security Warning */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Security Notice:</strong> Role changes affect user permissions and system access. 
              Two-factor authentication is required to proceed.
            </AlertDescription>
          </Alert>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label htmlFor="role-select">Select New Role</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(value: 'Voter' | 'Staff' | 'Administrator') => setSelectedRole(value)}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Voter">
                  <div className="flex items-center gap-2">
                    <span>Voter</span>
                  </div>
                </SelectItem>
                <SelectItem value="Staff">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    <span>Staff</span>
                  </div>
                </SelectItem>
                <SelectItem value="Administrator">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Administrator</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Role Description */}
            <div className="bg-muted/30 rounded-md p-3">
              <div className="flex items-center gap-2 mb-2">
                {getRoleIcon(selectedRole)}
                <span className="font-medium text-sm">{selectedRole} Permissions:</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getRoleDescription(selectedRole)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            
            <StepUpVerification
              onVerified={handleRoleUpdate}
              actionType="update_user_role"
              title="Role Change - Two-Factor Authentication Required"
              description={`Please enter your two-factor authentication code to change ${user.full_name || 'this user'}'s role from ${user.role} to ${selectedRole}.`}
            >
              <Button 
                disabled={isUpdating || selectedRole === user.role}
                className="min-w-[120px]"
              >
                {isUpdating ? 'Updating...' : 'Update Role'}
              </Button>
            </StepUpVerification>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};