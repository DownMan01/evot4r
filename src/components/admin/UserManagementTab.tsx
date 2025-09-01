import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RoleChangeDialog } from './RoleChangeDialog';
import { ResubmitUserDialog } from './ResubmitUserDialog';
import { Users, Eye, Search, Filter, ChevronDown, Settings, Mail, MailCheck } from 'lucide-react';
import { UserDetailsDialog } from './UserDetailsDialog';
import { useUserManagement } from '@/hooks/useUserManagement';
import { TwoFactorVerification } from '@/components/TwoFactorVerification';

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
  email_confirmed_at?: string | null;
}

interface UserManagementTabProps {
  users: User[];
  loading: boolean;
  updateUserRole: (userId: string, role: 'Voter' | 'Staff' | 'Administrator') => Promise<void>;
  getRoleColor: (role: string) => string;
  getStatusColor: (status: string) => string;
  refetch: () => Promise<void>;
}

export const UserManagementTab = ({
  users,
  loading,
  updateUserRole,
  getRoleColor,
  getStatusColor,
  refetch
}: UserManagementTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  const { resendConfirmationEmail, loading: resendingEmail, requiresTwoFactor, handleTwoFactorVerified, cancelTwoFactorVerification } = useUserManagement();
  
  const handleResendEmail = async (userId: string, email: string) => {
    const result = await resendConfirmationEmail(userId, `Email resent by admin for user: ${email}`);
    if (result && 'success' in result && result.success) {
      await refetch();
    }
    // If requiresTwoFactor is true, the 2FA dialog will be shown automatically
  };
  
  const handleTwoFactorVerifiedSuccess = async () => {
    const result = await handleTwoFactorVerified();
    if (result && 'success' in result && result.success) {
      await refetch();
    }
  };
  
  const getEmailStatus = (user: User) => {
    return user.email_confirmed_at ? 'confirmed' : 'unconfirmed';
  };
  
  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'unconfirmed':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || user.registration_status === statusFilter;
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Paginate users
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const statuses = ['All', 'Pending', 'Approved', 'Rejected'];
  const roles = ['All', 'Voter', 'Staff', 'Administrator'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management ({filteredUsers.length} users)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {paginatedUsers.map(user => (
            <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-medium text-lg truncate">{user.full_name || 'No Name'}</h4>
                    <Badge className={`${getRoleColor(user.role)} text-white text-xs`}>
                      {user.role}
                    </Badge>
                    <Badge className={`${getStatusColor(user.registration_status)} text-white text-xs`}>
                      {user.registration_status}
                    </Badge>
                    <Badge className={`${getEmailStatusColor(getEmailStatus(user))} text-white text-xs flex items-center gap-1`}>
                      {getEmailStatus(user) === 'confirmed' ? (
                        <>
                          <MailCheck className="h-3 w-3" />
                          Email Confirmed
                        </>
                      ) : (
                        <>
                          <Mail className="h-3 w-3" />
                          Email Unconfirmed
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <span className="truncate">ID: {user.student_id || 'N/A'}</span>
                    <span className="truncate">Email: {user.email || 'N/A'}</span>
                    <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-1 w-full sm:w-auto">
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <UserDetailsDialog user={user} />
                  </Dialog>
                  
                  <RoleChangeDialog
                    user={user}
                    updateUserRole={updateUserRole}
                    getRoleColor={getRoleColor}
                  >
                    <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                      <Settings className="h-3 w-3" />
                      Change Role
                     </Button>
                   </RoleChangeDialog>
                   
                     {/* Add Resubmit button for approved and rejected users */}
                     {(user.registration_status === 'Rejected' || user.registration_status === 'Approved') && (
                       <ResubmitUserDialog 
                         user={user} 
                         onSuccess={refetch}
                       />
                     )}
                     
                     {/* Add Resend Email button for unconfirmed emails */}
                     {!user.email_confirmed_at && user.email && (
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="flex items-center gap-2 w-full sm:w-auto"
                         onClick={() => handleResendEmail(user.user_id, user.email!)}
                         disabled={resendingEmail}
                       >
                         <Mail className="h-3 w-3" />
                         {resendingEmail ? 'Sending...' : 'Resend Email'}
                       </Button>
                     )}
                 </div>
              </div>
            </div>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found matching your criteria</p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* 2FA Verification Dialog */}
      <TwoFactorVerification
        open={requiresTwoFactor}
        onOpenChange={(open) => {
          if (!open) {
            cancelTwoFactorVerification();
          }
        }}
        onVerified={handleTwoFactorVerifiedSuccess}
        actionType="resend_confirmation_email"
        title="Two-Factor Authentication Required"
        description="Please verify your identity to resend the confirmation email"
      />
    </Card>
  );
};