import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserDetailsDialog } from './UserDetailsDialog';
import { Users, Clock, Eye, UserCheck, UserX, CheckCircle, XCircle, Search, Filter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StepUpVerification } from '../StepUpVerification';

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

interface PendingAction {
  id: string;
  action_type: string;
  action_data: any;
  status: string;
  requested_at: string;
  reviewed_at?: string;
  admin_notes?: string;
}

interface PendingApprovalsTabProps {
  users: User[];
  pendingActions: PendingAction[];
  loading: boolean;
  userManagementLoading: boolean;
  updateUserStatus: (userId: string, status: 'Approved' | 'Rejected') => Promise<void>;
  approveAction: (actionId: string, notes?: string) => Promise<boolean>;
  rejectAction: (actionId: string, notes?: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  refetchAuditLogs: () => Promise<void>;
  adminNotes: Record<string, string>;
  setAdminNotes: (notes: Record<string, string>) => void;
}

export const PendingApprovalsTab = ({
  users,
  pendingActions,
  loading,
  userManagementLoading,
  updateUserStatus,
  approveAction,
  rejectAction,
  refetch,
  refetchAuditLogs,
  adminNotes,
  setAdminNotes
}: PendingApprovalsTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('All');

  const pendingUsers = users.filter(user => user.registration_status === 'Pending');
  const pendingStaffActions = pendingActions.filter(action => action.status === 'Pending');

  // Filter based on search
  const filteredPendingUsers = pendingUsers.filter(user =>
    !searchTerm || 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingActions = pendingStaffActions.filter(action =>
    !searchTerm ||
    action.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.action_data?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.action_data?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveAction = async (actionId: string) => {
    const success = await approveAction(actionId, adminNotes[actionId]);
    if (success) {
      setAdminNotes({ ...adminNotes, [actionId]: '' });
      await refetch();
      await refetchAuditLogs();
    }
  };

  const handleRejectAction = async (actionId: string) => {
    const success = await rejectAction(actionId, adminNotes[actionId] || 'Rejected by admin');
    if (success) {
      setAdminNotes({ ...adminNotes, [actionId]: '' });
      await refetch();
      await refetchAuditLogs();
    }
  };

  const recentActions = pendingActions.filter(action => action.status !== 'Pending').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Approvals</span>
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
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search approvals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {showFilters && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="All">All Types</option>
                    <option value="Users">User Registrations</option>
                    <option value="Actions">Staff Actions</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* User Account Approvals */}
      {(filterType === 'All' || filterType === 'Users') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending User Registrations ({filteredPendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {filteredPendingUsers.map(user => (
                <div key={user.id} className="border rounded-lg bg-blue-50/50 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-medium text-lg truncate">{user.full_name || 'No Name'}</h4>
                        <Badge className="bg-yellow-500 text-white text-xs">
                          Pending Approval
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <span className="truncate">ID: {user.student_id || 'N/A'}</span>
                        <span className="truncate">Email: {user.email || 'N/A'}</span>
                        <span>Registered: {new Date(user.created_at).toLocaleDateString()}</span>
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
                        <UserDetailsDialog 
                          user={user} 
                          onStatusUpdate={updateUserStatus}
                          adminNotes={adminNotes}
                          setAdminNotes={setAdminNotes}
                          loading={loading}
                          userManagementLoading={userManagementLoading}
                        />
                      </Dialog>
                      
                       <div className="flex flex-col gap-2 w-full sm:w-auto">
                         <StepUpVerification
                           onVerified={() => updateUserStatus(user.user_id, 'Approved')}
                           actionType="approve_user"
                           title="Verify Identity"
                           description="Please verify your identity to approve this user registration."
                         >
                           <Button 
                             size="sm" 
                             disabled={loading || userManagementLoading} 
                             className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                           >
                             <UserCheck className="h-3 w-3" />
                             Approve
                           </Button>
                         </StepUpVerification>
                         <StepUpVerification
                           onVerified={() => updateUserStatus(user.user_id, 'Rejected')}
                           actionType="reject_user"
                           title="Verify Identity"
                           description="Please verify your identity to reject this user registration."
                         >
                           <Button 
                             size="sm" 
                             variant="outline" 
                             disabled={loading || userManagementLoading} 
                             className="flex items-center gap-1 border-red-200 hover:border-red-300 bg-red-600 hover:bg-red-500 text-white"
                           >
                             <UserX className="h-3 w-3" />
                             Reject
                           </Button>
                         </StepUpVerification>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredPendingUsers.length === 0 && (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {searchTerm ? 'No user registrations match your search' : 'No pending user registrations'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Action Approvals */}
      {(filterType === 'All' || filterType === 'Actions') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Staff Action Requests ({filteredPendingActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {filteredPendingActions.map(action => (
                <div key={action.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-medium text-lg">
                          {action.action_type === 'create_election' && 'Create Election Request'}
                          {action.action_type === 'add_candidate' && 'Add Candidate Request'}
                          {action.action_type === 'publish_results' && 'Publish Results Request'}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {action.action_type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Requested: {new Date(action.requested_at).toLocaleString()}
                      </p>
                      
                      <div className="bg-muted/50 p-3 rounded text-sm space-y-2 max-h-32 overflow-y-auto">
                        <h5 className="font-medium">Request Details:</h5>
                        {action.action_type === 'create_election' && (
                          <div>
                            <p><strong>Title:</strong> {action.action_data.title}</p>
                            <p><strong>Description:</strong> {action.action_data.description}</p>
                            <p><strong>Start Date:</strong> {new Date(action.action_data.start_date).toLocaleString()}</p>
                            <p><strong>End Date:</strong> {new Date(action.action_data.end_date).toLocaleString()}</p>
                            {action.action_data.positions && (
                              <div>
                                <p><strong>Positions:</strong></p>
                                <ul className="list-disc list-inside ml-4">
                                  {action.action_data.positions.map((pos: any, index: number) => (
                                    <li key={index}>{pos.title} - {pos.description}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        {action.action_type === 'add_candidate' && (
                          <div>
                            <p><strong>Candidate Name:</strong> {action.action_data.full_name}</p>
                            <p><strong>Bio:</strong> {action.action_data.bio}</p>
                            <p><strong>Election ID:</strong> {action.action_data.election_id}</p>
                            <p><strong>Position ID:</strong> {action.action_data.position_id}</p>
                          </div>
                        )}
                        {action.action_type === 'publish_results' && (
                          <div>
                            <p><strong>Election ID:</strong> {action.action_data.election_id}</p>
                            <p>Staff is requesting to publish the results for this election.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Add admin notes (optional)" 
                      value={adminNotes[action.id] || ''} 
                      onChange={e => setAdminNotes({
                        ...adminNotes,
                        [action.id]: e.target.value
                      })} 
                      className="min-h-[80px]" 
                    />
                    
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                       <StepUpVerification
                         onVerified={() => handleApproveAction(action.id)}
                         actionType="approve_action"
                         title="Verify Identity"
                         description="Please verify your identity to approve this staff action."
                       >
                         <Button 
                           size="sm" 
                           disabled={loading} 
                           className="flex items-center gap-1 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                         >
                           <CheckCircle className="h-3 w-3" />
                           Approve
                         </Button>
                       </StepUpVerification>
                       
                       <StepUpVerification
                         onVerified={() => handleRejectAction(action.id)}
                         actionType="reject_action"
                         title="Verify Identity"
                         description="Please verify your identity to reject this staff action."
                       >
                         <Button 
                           size="sm" 
                           variant="outline" 
                           disabled={loading} 
                           className="flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 w-full sm:w-auto"
                         >
                           <XCircle className="h-3 w-3" />
                           Reject
                         </Button>
                       </StepUpVerification>
                     </div>
                  </div>
                </div>
              ))}
              
              {filteredPendingActions.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No action requests match your search' : 'No pending approvals'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Actions */}
      {recentActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {recentActions.map(action => (
                <div key={action.id} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {action.action_type === 'create_election' && 'Election Creation'}
                        {action.action_type === 'add_candidate' && 'Candidate Addition'}
                        {action.action_type === 'publish_results' && 'Results Publication'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(action.reviewed_at || action.requested_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={`text-xs ${action.status === 'Approved' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {action.status}
                    </Badge>
                  </div>
                  {action.admin_notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Notes: {action.admin_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};