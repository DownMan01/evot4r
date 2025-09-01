import { ReactNode, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Clock, XCircle, CheckCircle, FileText } from 'lucide-react';
import { AppealForm } from './AppealForm';

interface RegistrationStatusGuardProps {
  children: ReactNode;
}

export const RegistrationStatusGuard = ({ children }: RegistrationStatusGuardProps) => {
  const { profile, signOut } = useAuth();
  const [showAppealForm, setShowAppealForm] = useState(false);

  if (!profile) {
    return null;
  }

  // If user is approved, show the normal content
  if (profile.registration_status === 'Approved') {
    return <>{children}</>;
  }

  // If user is rejected, show rejection message with appeal option
  if (profile.registration_status === 'Rejected') {
    if (showAppealForm) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
          <AppealForm 
            userId={profile.user_id}
            currentProfile={{
              student_id: profile.student_id,
              full_name: profile.full_name,
              course: profile.course,
              year_level: profile.year_level,
              gender: profile.gender
            }}
            onCancel={() => setShowAppealForm(false)}
            onSuccess={() => {
              setShowAppealForm(false);
              // The form will automatically switch to pending state after successful appeal
              window.location.reload(); // Refresh to show updated status
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Registration Rejected</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your registration has been rejected by the administrator.
            </p>
            <p className="text-sm text-muted-foreground">
              You can submit an appeal with updated credentials or contact the administrator for more information.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setShowAppealForm(true)}
                className="w-full bg-primary hover:bg-primary-600"
              >
                
                Submit Appeal
              </Button>
              <Button 
                onClick={signOut}
                variant="outline" 
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is pending approval, show pending message
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-warning/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-warning/10 rounded-full w-fit">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-xl text-warning">Registration Pending</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your account registration is currently under review by the administrator.
          </p>
          <p className="text-sm text-muted-foreground">
            You will receive access once your registration is approved. This process usually takes 24-48 hours.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={signOut}
              variant="outline" 
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};