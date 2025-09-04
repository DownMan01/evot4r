import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePendingActions } from '@/hooks/usePendingActions';
import { useAuth } from '@/hooks/useAuth';
import { ListViewSkeleton } from '@/components/UnifiedLoadingSkeleton';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Clock, CheckCircle, XCircle, Eye, Calendar, UserPlus, BarChart3, Settings } from 'lucide-react';
import { formatPhilippineDateTime, formatPhilippineDate } from '@/utils/dateUtils';

interface ModernStaffPendingActionsPanelProps {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
}

export const ModernStaffPendingActionsPanel = ({
  searchTerm,
  statusFilter,
  typeFilter
}: ModernStaffPendingActionsPanelProps) => {
  const { pendingActions, loading, refetch } = usePendingActions();
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Helper function needed for filtering - define before usage
  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'create_election':
        return 'Create Election';
      case 'add_candidate':
        return 'Add Candidate';
      case 'publish_results':
        return 'Publish Results';
      default:
        return actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Filter actions to show only current user's actions
  const userPendingActions = pendingActions.filter(action => action.requested_by === user?.id);

  // Apply search and filters
  const filteredActions = userPendingActions.filter(action => {
    const matchesSearch = !searchTerm || 
      getActionLabel(action.action_type).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.action_data.title && action.action_data.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (action.action_data.full_name && action.action_data.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || action.status === statusFilter;
    const matchesType = typeFilter === 'All' || action.action_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create_election':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'add_candidate':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'publish_results':
        return <BarChart3 className="h-4 w-4 text-purple-500" />;
      default:
        return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'Approved':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const openDetailsDialog = (action: any) => {
    setSelectedAction(action);
    setShowDetailsDialog(true);
  };

  const formatActionData = (actionType: string, actionData: any) => {
    switch (actionType) {
      case 'create_election':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="font-medium">Title:</span>
                <span className="ml-2">{actionData.title}</span>
              </div>
              <div>
                <span className="font-medium">Description:</span>
                <span className="ml-2">{actionData.description || 'No description'}</span>
              </div>
              <div>
                <span className="font-medium">Eligible Voters:</span>
                <span className="ml-2">{actionData.eligible_voters || 'All Courses'}</span>
              </div>
              <div>
                <span className="font-medium">Start Date:</span>
                <span className="ml-2">{formatPhilippineDateTime(actionData.start_date)}</span>
              </div>
              <div>
                <span className="font-medium">End Date:</span>
                <span className="ml-2">{formatPhilippineDateTime(actionData.end_date)}</span>
              </div>
            </div>
            
            {actionData.positions && actionData.positions.length > 0 && (
              <div className="mt-4">
                <span className="font-medium">Positions ({actionData.positions.length}):</span>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {actionData.positions.map((pos: any, index: number) => (
                    <div key={index} className="bg-muted/30 p-3 rounded-lg text-sm">
                      <p className="font-medium">{pos.title}</p>
                      {pos.description && <p className="text-muted-foreground">{pos.description}</p>}
                      <p className="text-xs text-muted-foreground">Max candidates: {pos.max_candidates || 10}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'add_candidate':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Name:</span>
              <span className="ml-2">{actionData.full_name}</span>
            </div>
            <div>
              <span className="font-medium">Bio:</span>
              <span className="ml-2">{actionData.bio || 'No bio provided'}</span>
            </div>
            {actionData.image_url && (
              <div>
                <span className="font-medium">Image URL:</span>
                <span className="ml-2 text-xs text-muted-foreground break-all">{actionData.image_url}</span>
              </div>
            )}
          </div>
        );
      case 'publish_results':
        return (
          <div className="space-y-2">
            <div>
              <span className="font-medium">Election ID:</span>
              <span className="ml-2">{actionData.election_id}</span>
            </div>
          </div>
        );
      default:
        return <pre className="text-sm bg-muted/30 p-3 rounded-lg overflow-auto">{JSON.stringify(actionData, null, 2)}</pre>;
    }
  };

  const pendingCount = filteredActions.filter(action => action.status === 'Pending').length;

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              My Pending Actions
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredActions.length} of {userPendingActions.length} actions
              </span>
              <RefreshButton 
                onClick={refetch}
                loading={loading}
                size="sm"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <ListViewSkeleton />
          ) : filteredActions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No actions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'All' || typeFilter !== 'All'
                  ? 'Try adjusting your filters to see more results.' 
                  : 'You haven\'t submitted any actions yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActions.map((action) => (
                <Card key={action.id} className="border-border/30 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getActionIcon(action.action_type)}
                            <h4 className="font-semibold text-lg">{getActionLabel(action.action_type)}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(action.status)}
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatPhilippineDate(action.requested_at)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {action.action_type === 'create_election' && (
                            <p><span className="font-medium">Election:</span> {action.action_data.title}</p>
                          )}
                          
                          {action.action_type === 'add_candidate' && (
                            <p><span className="font-medium">Candidate:</span> {action.action_data.full_name}</p>
                          )}
                          
                          <p className="text-muted-foreground">
                            Requested: {formatPhilippineDateTime(action.requested_at)}
                          </p>
                          
                          {action.status !== 'Pending' && action.reviewed_at && (
                            <p className={action.status === 'Approved' ? 'text-success' : 'text-destructive'}>
                              {action.status}: {formatPhilippineDateTime(action.reviewed_at)}
                            </p>
                          )}
                          
                          {action.admin_notes && (
                            <div className="bg-muted/30 p-3 rounded-lg">
                              <p className="font-medium text-xs mb-1">Admin Notes:</p>
                              <p className="text-xs">{action.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-auto w-full">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openDetailsDialog(action)}
                          className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/50"
                        >
                          <Eye className="h-4 w-4" />
                          More Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction && getActionIcon(selectedAction.action_type)}
              {selectedAction && getActionLabel(selectedAction.action_type)} - Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAction && (
            <div className="space-y-6">
              {/* Action Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Action Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Action Type:</span>
                      <p className="text-muted-foreground">{getActionLabel(selectedAction.action_type)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedAction.status)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Requested Date:</span>
                      <p className="text-muted-foreground">{formatPhilippineDateTime(selectedAction.requested_at)}</p>
                    </div>
                    {selectedAction.reviewed_at && (
                      <div>
                        <span className="font-medium">Reviewed Date:</span>
                        <p className="text-muted-foreground">{formatPhilippineDateTime(selectedAction.reviewed_at)}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedAction.admin_notes && (
                    <div className="space-y-2">
                      <span className="font-medium">Admin Notes:</span>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{selectedAction.admin_notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Action Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    {formatActionData(selectedAction.action_type, selectedAction.action_data)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};