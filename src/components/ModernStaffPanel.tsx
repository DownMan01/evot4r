import { useState } from 'react';
import { PanelAccessGuard } from '@/components/PanelAccessGuard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfileUpdateRequests } from '@/hooks/useProfileUpdateRequests';
import { usePendingActions } from '@/hooks/usePendingActions';
import { useStaffStats } from '@/hooks/useStaffStats';
import { ModernProfileUpdateRequestsPanel } from '@/components/ModernProfileUpdateRequestsPanel';
import { ModernStaffPendingActionsPanel } from '@/components/ModernStaffPendingActionsPanel';
import { ModernElectionProgressPanel } from '@/components/ModernElectionProgressPanel';
import { RecentVoterActivityPanel } from '@/components/RecentVoterActivityPanel';
import { StatsCardsSkeleton } from '@/components/UnifiedLoadingSkeleton';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Users, Settings, Clock, BarChart3, Activity, Search, Filter, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ModernStaffPanel = () => {
  const {
    canApproveVoters,
    isAdmin
  } = usePermissions();
  const {
    requests: profileUpdateRequests,
    loading: requestsLoading,
    refetch: refetchRequests
  } = useProfileUpdateRequests();
  const {
    pendingActions,
    loading: actionsLoading,
    refetch: refetchActions
  } = usePendingActions();
  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats
  } = useStaffStats();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const handleRefreshAll = async () => {
    await Promise.all([refetchRequests?.(), refetchActions?.(), refetchStats?.()]);
  };

  if (!canApproveVoters) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to access the staff panel.</p>
        </CardContent>
      </Card>
    );
  }

  const pendingProfileRequests = profileUpdateRequests.filter(r => r.status === 'Pending').length;
  const pendingActionsCount = pendingActions.filter(a => a.status === 'Pending').length;

  return (
    <PanelAccessGuard panelName="Staff Panel">
      <div className="space-y-6">
        {/* Header - Matching AdminPanel style */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-slate-950">
            Staff Panel
          </h2>
          <div className="flex items-center gap-2 md:gap-4">
            <Badge variant="outline" className="px-2 md:px-3 py-1 text-xs md:text-sm">
              {pendingProfileRequests + pendingActionsCount} Pending
            </Badge>
            <RefreshButton
              onClick={handleRefreshAll}
              loading={requestsLoading || actionsLoading || statsLoading}
              disabled={requestsLoading || actionsLoading || statsLoading}
              text="Refresh Data"
              mobileText="Refresh"
            />
          </div>
        </div>

      {/* Quick Stats Cards - Matching AdminPanel style */}
      {statsLoading ? (
        <StatsCardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center p-4 md:p-6">
              <div className="rounded-full bg-blue-100 p-2 md:p-3 mr-3 md:mr-4">
                <Settings className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Profile Requests</p>
                <p className="text-xl md:text-2xl font-bold">{stats?.pendingRequests || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center p-4 md:p-6">
              <div className="rounded-full bg-green-100 p-2 md:p-3 mr-3 md:mr-4">
                <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Active Elections</p>
                <p className="text-xl md:text-2xl font-bold">{stats?.activeElections || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center p-4 md:p-6">
              <div className="rounded-full bg-purple-100 p-2 md:p-3 mr-3 md:mr-4">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Voters</p>
                <p className="text-xl md:text-2xl font-bold">{stats?.totalVoters || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="flex items-center p-4 md:p-6">
              <div className="rounded-full bg-orange-100 p-2 md:p-3 mr-3 md:mr-4">
                <Clock className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">My Actions</p>
                <p className="text-xl md:text-2xl font-bold">{stats?.staffPendingActions || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters - Enhanced design */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests, actions, elections..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              {/* Status Filter */}
              <div className="min-w-[140px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="min-w-[140px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="profile_update">Profile Updates</SelectItem>
                    <SelectItem value="create_election">Create Election</SelectItem>
                    <SelectItem value="add_candidate">Add Candidate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== 'All' || typeFilter !== 'All') && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setTypeFilter('All');
                  }}
                  className="h-11 px-3"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Matching AdminPanel style */}
      <Tabs defaultValue="profile-updates" className="w-full">
        <TabsList className={`grid w-full gap-2 ${isAdmin ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4'}`}>
          <TabsTrigger value="profile-updates" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Settings className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Profile Updates</span>
            <span className="sm:hidden">Updates</span>
            {pendingProfileRequests > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-2 bg-destructive text-destructive-foreground">
                {pendingProfileRequests}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="my-actions" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">My Actions</span>
            <span className="sm:hidden">Actions</span>
          </TabsTrigger>
          
          {isAdmin && (
            <TabsTrigger value="pending-actions" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Clock className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden lg:inline">All Actions</span>
              <span className="lg:hidden">All</span>
              {pendingActionsCount > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-2 bg-destructive text-destructive-foreground">
                  {pendingActionsCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
          
          <TabsTrigger value="election-progress" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Elections</span>
            <span className="sm:hidden">Elections</span>
          </TabsTrigger>
          
          <TabsTrigger value="voter-activity" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Activity className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Activity</span>
            <span className="sm:hidden">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile-updates" className="space-y-6">
          <ModernProfileUpdateRequestsPanel searchTerm={searchTerm} statusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="my-actions" className="space-y-6">
          <ModernStaffPendingActionsPanel searchTerm={searchTerm} statusFilter={statusFilter} typeFilter={typeFilter} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending-actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  All Pending Actions (Admin View)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {actionsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-24" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Enhanced admin panel coming soon. Use the main admin dashboard for now.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="election-progress" className="space-y-6">
          <ModernElectionProgressPanel searchTerm={searchTerm} statusFilter={statusFilter} />
        </TabsContent>

        <TabsContent value="voter-activity" className="space-y-6">
          <RecentVoterActivityPanel />
        </TabsContent>
      </Tabs>
    </div>
    </PanelAccessGuard>
  );
};