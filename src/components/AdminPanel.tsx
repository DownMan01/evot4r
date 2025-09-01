import { useState, useEffect } from 'react';
import { PanelAccessGuard } from '@/components/PanelAccessGuard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card";
import { RefreshButton } from '@/components/ui/refresh-button';
import { RefreshCw, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { usePendingActions } from '@/hooks/usePendingActions';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Vote, FileText, Clock, Shield } from 'lucide-react';

// Import new modular components
import { UserManagementTab } from './admin/UserManagementTab';
import { AuditLogsTab } from './admin/AuditLogsTab';
import { PendingApprovalsTab } from './admin/PendingApprovalsTab';
import { ElectionManagementTab } from './admin/ElectionManagementTab';

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

export const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  const { profile, canManageUsers, canViewAuditLogs } = usePermissions();
  const { user } = useAuth();
  const { auditLogs, loading: auditLogsLoading, error: auditLogsError, refetch: refetchAuditLogs } = useAuditLogs();
  const { pendingActions, approveAction, rejectAction, refetch } = usePendingActions();
  const { loading: userManagementLoading, approveUser, rejectUser } = useUserManagement();

  useEffect(() => {
    const loadData = async () => {
      if (canManageUsers) {
        await fetchUsers();
        await fetchElections();
      }
    };
    
    if (user && (canManageUsers || canViewAuditLogs)) {
      loadData();
    }
  }, [canManageUsers, canViewAuditLogs, user]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_profiles_with_email_status');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setElections(data || []);
    } catch (error: any) {
      console.error('Failed to fetch elections:', error);
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    try {
      toast({ title: "Refreshing data...", description: "Fetching latest information" });
      
      const refreshPromises = [];
      if (canManageUsers) {
        refreshPromises.push(fetchUsers());
        refreshPromises.push(fetchElections());
      }
      refreshPromises.push(refetch());
      refreshPromises.push(refetchAuditLogs());
      
      await Promise.all(refreshPromises);
      toast({ title: "Data refreshed", description: "All admin panel data updated successfully" });
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      toast({ title: "Refresh failed", description: "Failed to refresh data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: 'Approved' | 'Rejected') => {
    if (!profile || !canManageUsers) return;
    
    setLoading(true);
    try {
      const adminNotesForUser = adminNotes[userId] || undefined;
      const success = status === 'Approved' 
        ? await approveUser(userId, adminNotesForUser)
        : await rejectUser(userId, adminNotesForUser);
      
      if (success) {
        setAdminNotes(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        await Promise.all([fetchUsers(), refetch()]);
      }
    } catch (error: any) {
      console.error('Error in updateUserStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'Voter' | 'Staff' | 'Administrator') => {
    if (!profile || !canManageUsers) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_user_role', {
        p_user_id: userId,
        p_new_role: newRole,
        p_admin_notes: `Role changed to ${newRole} by ${profile.full_name}`
      });
      
      if (error) throw error;
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleResultsVisibility = async (electionId: string, showResults: boolean) => {
    if (!profile || !canManageUsers) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.rpc('toggle_election_results_visibility', {
        p_election_id: electionId,
        p_show_results: showResults
      });
      
      if (error) throw error;
      toast({ title: "Success", description: `Results ${showResults ? 'shown to' : 'hidden from'} voters` });
      await fetchElections();
    } catch (error: any) {
      console.error('Failed to toggle results visibility:', error);
      toast({ title: "Error", description: "Failed to update results visibility", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-purple-500';
      case 'Staff': return 'bg-blue-500';
      case 'Voter': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-500';
      case 'Rejected': return 'bg-red-500';
      case 'Pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (!canManageUsers && !canViewAuditLogs) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to access this panel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <PanelAccessGuard panelName="Admin Panel">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-slate-950">
            
          </h2>
          <div className="flex items-center gap-2 md:gap-4">
            <Badge variant="outline" className="px-2 md:px-3 py-1 text-xs md:text-sm">
              {pendingActions.filter(a => a.status === 'Pending').length + users.filter(u => u.registration_status === 'Pending').length} Pending
            </Badge>
            <RefreshButton
              onClick={refreshAllData}
              loading={loading || auditLogsLoading || userManagementLoading}
              disabled={loading || auditLogsLoading || userManagementLoading}
              text="Refresh Data"
              mobileText="Refresh"
            />
          </div>
        </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="rounded-full bg-blue-100 p-2 md:p-3 mr-3 md:mr-4">
              <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Pending Users</p>
              <p className="text-xl md:text-2xl font-bold">{users.filter(u => u.registration_status === 'Pending').length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="rounded-full bg-red-100 p-2 md:p-3 mr-3 md:mr-4">
              <Vote className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Rejected Users</p>
              <p className="text-xl md:text-2xl font-bold">{users.filter(u => u.registration_status === 'Rejected').length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="rounded-full bg-purple-100 p-2 md:p-3 mr-3 md:mr-4">
              <Users className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Approved Users</p>
              <p className="text-xl md:text-2xl font-bold">{users.filter(u => u.registration_status === 'Approved').length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="flex items-center p-4 md:p-6">
            <div className="rounded-full bg-orange-100 p-2 md:p-3 mr-3 md:mr-4">
              <FileText className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Staff Requests</p>
              <p className="text-xl md:text-2xl font-bold">{pendingActions.filter(a => a.status === 'Pending').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="flex w-full overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-4 gap-1 scrollbar-hide">
          {/* Mobile: horizontal scroll, Desktop: grid layout */}
          <TabsTrigger value="approvals" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Pending Approvals</span>
            <span className="sm:hidden">Approvals</span>
          </TabsTrigger>
          {canManageUsers && (
            <TabsTrigger value="users" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="elections" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Vote className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Election Management</span>
              <span className="sm:hidden">Elections</span>
            </TabsTrigger>
          )}
          {canViewAuditLogs && (
            <TabsTrigger value="audit" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Audit Logs</span>
              <span className="sm:hidden">Audit</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="approvals" className="space-y-6">
          <PendingApprovalsTab
            users={users}
            pendingActions={pendingActions}
            loading={loading}
            userManagementLoading={userManagementLoading}
            updateUserStatus={updateUserStatus}
            approveAction={approveAction}
            rejectAction={rejectAction}
            refetch={refetch}
            refetchAuditLogs={refetchAuditLogs}
            adminNotes={adminNotes}
            setAdminNotes={setAdminNotes}
          />
        </TabsContent>

        {canManageUsers && (
          <TabsContent value="users" className="space-y-6">
            <UserManagementTab
              users={users}
              loading={loading}
              updateUserRole={updateUserRole}
              getRoleColor={getRoleColor}
              getStatusColor={getStatusColor}
              refetch={fetchUsers}
            />
          </TabsContent>
        )}

        {canManageUsers && (
          <TabsContent value="elections" className="space-y-6">
            <ElectionManagementTab
              elections={elections}
              loading={loading}
              toggleResultsVisibility={toggleResultsVisibility}
              fetchElections={fetchElections}
            />
          </TabsContent>
        )}

        {canViewAuditLogs && (
          <TabsContent value="audit" className="space-y-6">
            <AuditLogsTab
              auditLogs={auditLogs}
              loading={auditLogsLoading}
              error={auditLogsError}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
    </PanelAccessGuard>
  );
};
