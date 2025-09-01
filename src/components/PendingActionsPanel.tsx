import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePendingActions } from '@/hooks/usePendingActions';
import { usePermissions } from '@/hooks/usePermissions';
import { Clock, CheckCircle, XCircle, Eye, Calendar, UserPlus, BarChart3 } from 'lucide-react';
import { SecureImage } from '@/components/ui/SecureImage';
export const PendingActionsPanel = () => {
  const {
    pendingActions,
    loading,
    approveAction,
    rejectAction
  } = usePendingActions();
  const {
    isAdmin
  } = usePermissions();
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create_election':
        return <Calendar className="h-4 w-4" />;
      case 'add_candidate':
        return <UserPlus className="h-4 w-4" />;
      case 'publish_results':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500';
      case 'Approved':
        return 'bg-green-500';
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  const formatActionData = (actionType: string, actionData: any) => {
    switch (actionType) {
      case 'create_election':
        return <div className="space-y-3">
            <p><strong>Title:</strong> {actionData.title}</p>
            <p><strong>Description:</strong> {actionData.description || 'No description'}</p>
            <p><strong>Eligible Voters:</strong> {actionData.eligible_voters || 'All Courses'}</p>
            <p><strong>Start Date:</strong> {new Date(actionData.start_date).toLocaleString()}</p>
            <p><strong>End Date:</strong> {new Date(actionData.end_date).toLocaleString()}</p>
            
            {actionData.cover_image_filename && <div className="space-y-2">
                <div>
                  <strong>Cover Image:</strong> {actionData.cover_image_filename}
                  <span className="text-sm text-muted-foreground ml-2">(Already uploaded to storage)</span>
                </div>
                {actionData.cover_image_url && <div className="mt-2">
                    <SecureImage 
                      bucket="election-covers"
                      path={actionData.cover_image_url}
                      alt="Election cover preview" 
                      className="w-full max-w-md h-32 object-cover rounded-lg border"
                      showError={true}
                      fallback={
                        <div className="w-full max-w-md h-32 bg-muted rounded-lg border flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">No cover image</span>
                        </div>
                      }
                    />
                  </div>}
              </div>}
            
            {actionData.positions && actionData.positions.length > 0 && <div>
                <strong>Positions ({actionData.positions.length}):</strong>
                <div className="mt-2 space-y-2">
                  {actionData.positions.map((pos: any, index: number) => <div key={index} className="bg-muted/50 p-3 rounded-lg">
                      <p className="font-medium">{pos.title}</p>
                      {pos.description && <p className="text-sm text-muted-foreground mt-1">{pos.description}</p>}
                      <p className="text-sm">Maximum candidates: {pos.max_candidates || 10}</p>
                    </div>)}
                </div>
              </div>}
          </div>;
      case 'add_candidate':
        return <div className="space-y-2">
            <p><strong>Name:</strong> {actionData.full_name}</p>
            <p><strong>Bio:</strong> {actionData.bio || 'No bio provided'}</p>
            {actionData.image_url && <p><strong>Image URL:</strong> {actionData.image_url}</p>}
          </div>;
      case 'publish_results':
        return <div className="space-y-2">
            <p><strong>Election ID:</strong> {actionData.election_id}</p>
          </div>;
      default:
        return <pre className="text-sm">{JSON.stringify(actionData, null, 2)}</pre>;
    }
  };
  const handleViewAction = (action: any) => {
    setSelectedAction(action);
    setShowActionDialog(true);
    setActionNotes('');
  };
  const handleApprove = async () => {
    if (!selectedAction || !isAdmin) return;
    
    setProcessingAction(true);
    try {
      const success = await approveAction(selectedAction.id, actionNotes);
      if (success) {
        setShowActionDialog(false);
        setSelectedAction(null);
        setActionNotes('');
      }
    } catch (error) {
      console.error('Error approving action:', error);
    } finally {
      setProcessingAction(false);
    }
  };
  const handleReject = async () => {
    if (!selectedAction || !isAdmin) return;
    
    setProcessingAction(true);
    try {
      const success = await rejectAction(selectedAction.id, actionNotes);
      if (success) {
        setShowActionDialog(false);
        setSelectedAction(null);
        setActionNotes('');
      }
    } catch (error) {
      console.error('Error rejecting action:', error);
    } finally {
      setProcessingAction(false);
    }
  };
  if (loading) {
    return <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading pending actions...</p>
        </CardContent>
      </Card>;
  }
  const pendingCount = pendingActions.filter(action => action.status === 'Pending').length;
  return <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Pending Actions
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500 text-white">
                {pendingCount} Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingActions.length === 0 ? <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending actions found</p>
            </div> : <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingActions.map(action => <div key={action.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getActionIcon(action.action_type)}
                        <h4 className="font-medium">{getActionLabel(action.action_type)}</h4>
                        <Badge className={`${getStatusColor(action.status)} text-white text-xs`}>
                          {action.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        Requested: {new Date(action.requested_at).toLocaleString()}
                      </p>
                      
                      {action.action_type === 'create_election' && <p className="text-sm truncate">
                          <strong>Election:</strong> {action.action_data.title}
                        </p>}
                      
                      {action.action_type === 'add_candidate' && <p className="text-sm truncate">
                          <strong>Candidate:</strong> {action.action_data.full_name}
                        </p>}
                      
                      {action.status === 'Approved' && action.reviewed_at && <p className="text-sm text-green-600">
                          Approved: {new Date(action.reviewed_at).toLocaleString()}
                        </p>}
                      
                      {action.status === 'Rejected' && action.reviewed_at && <p className="text-sm text-red-600">
                          Rejected: {new Date(action.reviewed_at).toLocaleString()}
                        </p>}
                      
                      {action.admin_notes && <p className="text-sm mt-1 break-words">
                          <strong>Notes:</strong> {action.admin_notes}
                        </p>}
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewAction(action)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {isAdmin && action.status === 'Pending' && <>
                          <Button size="sm" onClick={() => handleViewAction(action)} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleViewAction(action)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>}
                    </div>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* Action Review Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">
              {selectedAction && getActionLabel(selectedAction.action_type)} - Review
            </DialogTitle>
          </DialogHeader>
          
          {selectedAction && <>
              <div className="flex-1 overflow-y-auto space-y-6 py-4">
                <div>
                  <h4 className="font-medium mb-3 text-base">Action Details</h4>
                  <div className="bg-muted/50 p-4 rounded-lg border">
                    <div className="overflow-x-auto">
                      {formatActionData(selectedAction.action_type, selectedAction.action_data)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-3 text-base">Request Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <span className="font-medium min-w-fit">Requested by:</span>
                        <span className="break-all">{selectedAction.requested_by}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <span className="font-medium min-w-fit">Requested at:</span>
                        <span>{new Date(selectedAction.requested_at).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:gap-2">
                        <span className="font-medium min-w-fit">Status:</span>
                        <Badge className={`${getStatusColor(selectedAction.status)} text-white text-xs w-fit`}>
                          {selectedAction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {selectedAction.reviewed_at && <div>
                      <h4 className="font-medium mb-3 text-base">Review Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-col sm:flex-row sm:gap-2">
                          <span className="font-medium min-w-fit">Reviewed at:</span>
                          <span>{new Date(selectedAction.reviewed_at).toLocaleString()}</span>
                        </div>
                        {selectedAction.reviewed_by && <div className="flex flex-col sm:flex-row sm:gap-2">
                            <span className="font-medium min-w-fit">Reviewed by:</span>
                            <span className="break-all">{selectedAction.reviewed_by}</span>
                          </div>}
                      </div>
                    </div>}
                </div>
                
                {selectedAction.admin_notes && <div>
                    <h4 className="font-medium mb-3 text-base">Admin Notes</h4>
                    <div className="bg-muted/50 p-3 rounded-lg border text-sm">
                      {selectedAction.admin_notes}
                    </div>
                  </div>}
                
                {isAdmin && selectedAction.status === 'Pending' && <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="notes" className="text-base font-medium">Admin Notes (Optional)</Label>
                      <Textarea id="notes" value={actionNotes} onChange={e => setActionNotes(e.target.value)} placeholder="Add any notes about this decision..." rows={3} className="mt-2 resize-none" />
                    </div>
                  </div>}
              </div>
              
              <div className="flex-shrink-0 pt-4 border-t">
                {isAdmin && selectedAction.status === 'Pending' ? <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={processingAction} className="order-3 sm:order-1">
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={processingAction} className="order-2">
                      {processingAction ? 'Processing...' : 'Reject'}
                    </Button>
                    <Button onClick={handleApprove} disabled={processingAction} className="bg-green-600 hover:bg-green-700 order-1 sm:order-3">
                      {processingAction ? 'Processing...' : 'Approve'}
                    </Button>
                  </div> : <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                      Close
                    </Button>
                  </div>}
              </div>
            </>}
        </DialogContent>
      </Dialog>
    </>;
};