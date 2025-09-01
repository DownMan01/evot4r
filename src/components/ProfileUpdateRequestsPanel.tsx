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
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, CheckCircle, XCircle, MessageSquare, Calendar, Mail, GraduationCap } from 'lucide-react';
import { SecureImage } from '@/components/ui/SecureImage';

export const ProfileUpdateRequestsPanel = () => {
  const { requests, loading, approveRequest, rejectRequest } = useProfileUpdateRequests();
  const { canApproveVoters } = usePermissions();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  if (!canApproveVoters) {
    return null;
  }

  const pendingRequests = requests.filter(req => req.status === 'Pending');

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
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'Approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case 'Rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Profile Update Requests
          {pendingRequests.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingRequests.length} pending
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
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No profile update requests found.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {requests.slice(0, 10).map((request) => (
              <div key={request.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">
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

                <div className="grid lg:grid-cols-2 gap-3">
                  {request.requested_email && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email Change
                      </Label>
                      <div className="text-sm">
                        <p className="text-muted-foreground">From: {request.current_email || 'Not set'}</p>
                        <p className="font-medium">To: {request.requested_email}</p>
                      </div>
                    </div>
                  )}

                  {request.requested_year_level && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Year Level Change
                      </Label>
                      <div className="text-sm">
                        <p className="text-muted-foreground">From: {request.current_year_level || 'Not set'}</p>
                        <p className="font-medium">To: {request.requested_year_level}</p>
                      </div>
                    </div>
                  )}
                </div>

                {request.admin_notes && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Admin Notes
                    </Label>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {request.admin_notes}
                    </p>
                  </div>
                )}

                {request.status === 'Pending' && (
                  <div className="flex gap-2 pt-2">
                    {/* View Details Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                          <Users className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Voter Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                           <div className="flex items-center space-x-4">
                            {request.id_image_url && (
                              <SecureImage 
                                bucket="student-ids"
                                path={request.id_image_url}
                                alt="Student ID" 
                                className="w-16 h-16 object-cover rounded-lg border"
                                showError={true}
                                fallback={
                                  <div className="w-16 h-16 bg-muted rounded-lg border flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">No image</span>
                                  </div>
                                }
                              />
                            )}
                            <div>
                              <h3 className="font-semibold">{request.full_name}</h3>
                              <p className="text-sm text-muted-foreground">ID: {request.student_id}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="font-medium">Course</Label>
                              <p className="text-muted-foreground">{request.course || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Current Year</Label>
                              <p className="text-muted-foreground">{request.year_level || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Gender</Label>
                              <p className="text-muted-foreground">{request.gender || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Status</Label>
                              <p className="text-muted-foreground">{request.registration_status || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                              <Label className="font-medium">Email</Label>
                              <p className="text-muted-foreground">{request.email || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => setSelectedRequest(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
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
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => setSelectedRequest(request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};