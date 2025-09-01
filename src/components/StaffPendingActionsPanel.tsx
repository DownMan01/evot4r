import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePendingActions } from '@/hooks/usePendingActions';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, FileText, Users, Settings } from 'lucide-react';

export const StaffPendingActionsPanel = () => {
  const { pendingActions, loading } = usePendingActions();
  const { user } = useAuth();

  // Filter to show only current user's pending actions
  const userPendingActions = pendingActions.filter(
    action => action.requested_by === user?.id
  );

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create_election':
        return <Settings className="h-4 w-4" />;
      case 'add_candidate':
        return <Users className="h-4 w-4" />;
      case 'publish_results':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'create_election':
        return 'Create Election';
      case 'add_candidate':
        return 'Add Candidate';
      case 'publish_results':
        return 'Publish Results';
      default:
        return actionType;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'Approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          My Pending Actions
          {userPendingActions.filter(a => a.status === 'Pending').length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {userPendingActions.filter(a => a.status === 'Pending').length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : userPendingActions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No pending actions found.</p>
            <p className="text-sm">Actions you submit will appear here for admin approval.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {userPendingActions.slice(0, 10).map((action) => (
              <div key={action.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActionIcon(action.action_type)}
                    <div>
                      <h4 className="font-medium">{getActionLabel(action.action_type)}</h4>
                      <p className="text-sm text-muted-foreground">
                        Requested: {new Date(action.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(action.status)}
                  </div>
                </div>

                {/* Show action-specific details */}
                {action.action_type === 'create_election' && action.action_data.title && (
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm font-medium">Election: {action.action_data.title}</p>
                    {action.action_data.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.action_data.description}
                      </p>
                    )}
                  </div>
                )}

                {action.action_type === 'add_candidate' && action.action_data.full_name && (
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm font-medium">Candidate: {action.action_data.full_name}</p>
                  </div>
                )}

                {action.action_type === 'publish_results' && (
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm font-medium">Publishing election results</p>
                  </div>
                )}

                {/* Show admin notes if rejected or approved */}
                {action.admin_notes && (
                  <div className="bg-muted/30 p-3 rounded">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes:</p>
                    <p className="text-sm">{action.admin_notes}</p>
                  </div>
                )}

                {action.status !== 'Pending' && action.reviewed_at && (
                  <div className="text-xs text-muted-foreground">
                    {action.status} on {new Date(action.reviewed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};