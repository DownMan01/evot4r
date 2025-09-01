import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Dialog } from '@/components/ui/dialog';
import { Eye, UserCheck, UserX } from 'lucide-react';
import { SecureImage } from '@/components/ui/SecureImage';

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

interface UserDetailsDialogProps {
  user: User;
  onStatusUpdate?: (userId: string, status: 'Approved' | 'Rejected') => void;
  adminNotes?: Record<string, string>;
  setAdminNotes?: (notes: Record<string, string>) => void;
  loading?: boolean;
  userManagementLoading?: boolean;
}

// Remove the getImageUrl function as we'll use SecureImage component instead

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Administrator':
      return 'bg-purple-500';
    case 'Staff':
      return 'bg-blue-500';
    case 'Voter':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Approved':
      return 'bg-green-500';
    case 'Rejected':
      return 'bg-red-500';
    case 'Pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export const UserDetailsDialog = ({
  user,
  onStatusUpdate,
  adminNotes = {},
  setAdminNotes = () => {},
  loading = false,
  userManagementLoading = false
}: UserDetailsDialogProps) => {
  const hasStudentIdImage = user.id_image_url;
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            User Details - {user.full_name || 'No Name'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Badge className={`${getRoleColor(user.role)} text-white`}>
              {user.role}
            </Badge>
            <Badge className={`${getStatusColor(user.registration_status)} text-white`}>
              {user.registration_status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Student ID:</label>
                <p className="text-sm mt-1">{user.student_id || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email:</label>
                <p className="text-sm mt-1 break-words">{user.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Course:</label>
                <p className="text-sm mt-1">{user.course || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Year Level:</label>
                <p className="text-sm mt-1">{user.year_level || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gender:</label>
                <p className="text-sm mt-1">{user.gender || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Registered:</label>
                <p className="text-sm mt-1">{new Date(user.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {user.id_image_url && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Student ID Image:</label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowImageModal(true)} 
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View Full Size
                </Button>
              </div>
              <div className="border p-4 bg-muted/30 rounded-lg">
                <SecureImage 
                  bucket="student-ids"
                  path={user.id_image_url}
                  alt="Student ID" 
                  className="w-full max-w-md mx-auto rounded border cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => setShowImageModal(true)}
                  showError={true}
                  fallback={
                    <div className="w-full h-48 bg-muted flex items-center justify-center rounded">
                      <p className="text-muted-foreground">No image available</p>
                    </div>
                  }
                />
              </div>
            </div>
          )}
          
          {onStatusUpdate && user.registration_status === 'Pending' && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Admin Notes (Optional):
                </label>
                <Textarea 
                  placeholder="Add any notes about this decision..." 
                  value={adminNotes[user.user_id] || ''} 
                  onChange={(e) => setAdminNotes({ ...adminNotes, [user.user_id]: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button 
                  onClick={() => onStatusUpdate(user.user_id, 'Approved')} 
                  disabled={loading || userManagementLoading} 
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <UserCheck className="h-4 w-4" />
                  Approve User
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onStatusUpdate(user.user_id, 'Rejected')} 
                  disabled={loading || userManagementLoading} 
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white hover:text-white border-red-600 hover:border-red-500"
                >
                  <UserX className="h-4 w-4" />
                  Reject User
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Full Size Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Student ID Image - {user.full_name || 'No Name'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            <SecureImage 
              bucket="student-ids"
              path={user.id_image_url}
              alt="Student ID Full Size" 
              className="max-w-full max-h-[70vh] object-contain rounded border"
              showError={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
