import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Settings, CheckCircle } from 'lucide-react';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { useAuth } from '@/hooks/useAuth';
import { TwoFactorSetup } from './TwoFactorSetup';
import { TwoFactorVerification } from './TwoFactorVerification';

export const SecuritySettings = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const { twoFactorEnabled, loading } = useTwoFactor();
  const { profile } = useAuth();

  const handleDisable2FA = () => {
    setShowVerification(true);
  };

  const handleVerificationSuccess = async () => {
    setShowVerification(false);
    window.location.reload();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 sm:p-4 border rounded-lg">
            {/* Info + status */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Two-Factor Authentication</h3>
                {twoFactorEnabled ? (
                  <Badge
                    variant="default"
                    className="bg-success text-success-foreground flex items-center"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled
                  ? 'Your account is protected with two-factor authentication'
                  : 'Add an extra layer of security to your account'}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:shrink-0">
              {twoFactorEnabled ? (
                <Button
                  variant="outline"
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Processing...' : 'Disable'}
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSetup(true)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>

          {profile?.role === 'Administrator' && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                As an administrator, enabling 2FA is strongly recommended to protect
                sensitive system operations.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <TwoFactorSetup
        open={showSetup}
        onOpenChange={setShowSetup}
        onComplete={() => {
          window.location.reload();
        }}
      />

      <TwoFactorVerification
        open={showVerification}
        onOpenChange={setShowVerification}
        onVerified={handleVerificationSuccess}
        actionType="disable_2fa"
        title="Disable Two-Factor Authentication"
        description="Please verify your identity to disable 2FA"
      />
    </>
  );
};
