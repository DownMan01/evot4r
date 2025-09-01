import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProfileUpdateRequests } from '@/hooks/useProfileUpdateRequests';
import { usePermissions } from '@/hooks/usePermissions';
import { ListViewSkeleton } from '@/components/UnifiedLoadingSkeleton';
import { RefreshButton } from '@/components/ui/refresh-button';
import { SecureImage } from '@/components/ui/SecureImage';
import { Users, Clock, CheckCircle, XCircle, MessageSquare, Calendar, Mail, GraduationCap, Eye, Filter } from 'lucide-react';

interface ModernProfileUpdateRequestsPanelProps {
  searchTerm: string;
  statusFilter: string;
}

export const ModernProfileUpdateRequestsPanel = ({
  searchTerm,
  statusFilter
}: ModernProfileUpdateRequestsPanelProps) => {
  const { requests, loading, approveRequest, rejectRequest, refetch } = useProfileUpdateRequests();
  const { canApproveVoters } = usePermissions();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  if (!canApproveVoters) {
    return null;
  }

  // Filter requests based on search and status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requested_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingRequests = filteredRequests.filter(req => req.status === 'Pending');

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    await approveRequest(requestId, notes);
    setProcessingId(null);
    setNotes('');
    setSelectedRequest(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    await rejectRequest(requestId, notes);
    setProcessingId(null);
    setNotes('');
    setSelectedRequest(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'Approved':
        return <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case 'Rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return null;
    }
  };

  const openDetailsDialog = (request: any) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Profile Update Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingRequests.length} pending
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredRequests.length} of {requests.length} requests
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
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'All' 
                  ? 'Try adjusting your filters to see more results.' 
                  : 'No profile update requests have been submitted yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="border-border/30 hover:border-border transition-colors">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {request.full_name || 'Unknown User'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              ID: {request.student_id || 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(request.requested_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-4">
                          {request.requested_email && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-1">
                                <Mail className="h-3 w-3 text-blue-500" />
                                Email Change Request
                              </Label>
                              <div className="text-sm p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">From: {request.current_email || 'Not set'}</p>
                                <p className="font-medium text-foreground">To: {request.requested_email}</p>
                              </div>
                            </div>
                          )}

                          {request.requested_year_level && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-1">
                                <GraduationCap className="h-3 w-3 text-green-500" />
                                Year Level Change Request
                              </Label>
                              <div className="text-sm p-3 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">From: {request.current_year_level || 'Not set'}</p>
                                <p className="font-medium text-foreground">To: {request.requested_year_level}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {request.admin_notes && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-orange-500" />
                              Admin Notes
                            </Label>
                            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                              {request.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-auto w-full">
                        {/* More Details Button */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openDetailsDialog(request)}
                          className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/50"
                        >
                          <Eye className="h-4 w-4" />
                          More Details
                        </Button>

                        {request.status === 'Pending' && (
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="flex items-center gap-2 bg-success hover:bg-success/90 text-white"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Profile Update Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>Are you sure you want to approve this profile update request?</p>
                                  <div className="space-y-2">
                                    <Label htmlFor="approve-notes">Admin Notes (Optional)</Label>
                                    <Textarea 
                                      id="approve-notes"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Add any notes about this approval..."
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      onClick={() => handleApprove(request.id)}
                                      disabled={processingId === request.id}
                                      className="bg-success hover:bg-success/90"
                                    >
                                      {processingId === request.id ? 'Approving...' : 'Approve'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="flex items-center gap-2"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Profile Update Request</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>Are you sure you want to reject this profile update request?</p>
                                  <div className="space-y-2">
                                    <Label htmlFor="reject-notes">Reason for Rejection</Label>
                                    <Textarea 
                                      id="reject-notes"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Please provide a reason for rejection..."
                                      required
                                    />
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                                      Cancel
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleReject(request.id)}
                                      disabled={processingId === request.id || !notes.trim()}
                                    >
                                      {processingId === request.id ? 'Rejecting...' : 'Reject'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Profile Update Request Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRequest.id_image_url && (
                    <div className="flex items-center gap-4">
                      <SecureImage 
                        bucket="student-ids"
                        path={selectedRequest.id_image_url}
                        alt="Student ID" 
                        className="w-20 h-20 object-cover rounded-lg border"
                        showError={true}
                        fallback={
                          <div className="w-20 h-20 bg-muted rounded-lg border flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No Image</span>
                          </div>
                        }
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{selectedRequest.full_name}</h3>
                        <p className="text-muted-foreground">ID: {selectedRequest.student_id}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Course</Label>
                      <p className="text-muted-foreground">{selectedRequest.course || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Current Year</Label>
                      <p className="text-muted-foreground">{selectedRequest.year_level || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Gender</Label>
                      <p className="text-muted-foreground">{selectedRequest.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Registration Status</Label>
                      <p className="text-muted-foreground">{selectedRequest.registration_status || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Requested Date:</span>
                    <span className="text-muted-foreground">
                      {new Date(selectedRequest.requested_at).toLocaleString()}
                    </span>
                  </div>

                  {selectedRequest.reviewed_at && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Reviewed Date:</span>
                      <span className="text-muted-foreground">
                        {new Date(selectedRequest.reviewed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {selectedRequest.requested_email && (
                    <div className="space-y-2">
                      <Label className="font-medium">Email Change:</Label>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">From: {selectedRequest.current_email || 'Not set'}</p>
                        <p className="text-sm font-medium">To: {selectedRequest.requested_email}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.requested_year_level && (
                    <div className="space-y-2">
                      <Label className="font-medium">Year Level Change:</Label>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">From: {selectedRequest.current_year_level || 'Not set'}</p>
                        <p className="text-sm font-medium">To: {selectedRequest.requested_year_level}</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.admin_notes && (
                    <div className="space-y-2">
                      <Label className="font-medium">Admin Notes:</Label>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{selectedRequest.admin_notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};