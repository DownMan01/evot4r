import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { QrCode, Shield, Key, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageWithLoader } from '@/components/ui/ImageWithLoader';

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const TwoFactorSetup = ({ open, onOpenChange, onComplete }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);

  const { generateTwoFactorSetup, enableTwoFactor, loading } = useTwoFactor();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      // reset dialog when closed
      setStep('generate');
      setSetupData(null);
      setVerificationCode('');
      setCopiedCodes(false);
    }
  }, [open]);

  const handleGenerateSetup = async () => {
    const data = await generateTwoFactorSetup();
    if (data) {
      setSetupData(data);
      setStep('verify');
    }
  };

  const handleVerifyCode = async () => {
    if (!setupData || !verificationCode) return;

    const success = await enableTwoFactor(
      setupData.secret,
      verificationCode,
      setupData.backupCodes
    );

    if (success) {
      setStep('backup');
    } else {
      toast({
        title: 'Verification failed',
        description: 'The code entered is invalid. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyBackupCodes = () => {
    if (!setupData) return;

    const codesText = setupData.backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast({
      title: 'Copied',
      description: 'Backup codes copied to clipboard',
    });
  };

  const handleComplete = () => {
    onOpenChange(false);
    onComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md lg:mx-0 max-h-[90vh] overflow-y-auto mx-0">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Shield className="h-5 w-5 text-primary flex-shrink-0" />
            Enable Two-Factor Authentication
          </DialogTitle>
        </DialogHeader>

        {/* Step 1 - Generate */}
        {step === 'generate' && (
          <div className="flex flex-col gap-5 text-center pb-2">
            <p className="text-sm text-muted-foreground">
              Protect your account with an extra layer of security. You’ll need an
              authenticator app (like Google Authenticator, Authy, or Microsoft
              Authenticator) to complete the setup.
            </p>
            <Button
              onClick={handleGenerateSetup}
              disabled={loading}
              className="h-11 sm:h-10"
            >
              {loading ? 'Generating...' : 'Start Setup'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 sm:h-10"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Step 2 - Verify */}
        {step === 'verify' && setupData && (
          <div className="flex flex-col gap-4 pb-2">
            <Card className="overflow-hidden w-full">
              <CardHeader className="pb-2 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <QrCode className="h-4 w-4 flex-shrink-0" />
                  Scan QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <div className="flex justify-center p-3 bg-background rounded-lg w-full">
                  <ImageWithLoader
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      setupData.qrCode
                    )}`}
                    alt="2FA QR Code"
                    className="w-36 h-36 sm:w-44 sm:h-44 border rounded-lg"
                    loaderSize="md"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Manual Entry Key
                  </Label>
                  <div className="flex items-center gap-2 w-full flex-wrap">
                    <Input
                      value={setupData.secret}
                      readOnly
                      className="font-mono text-xs sm:text-sm select-all flex-1 min-w-0"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 h-9 w-9 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.secret);
                        toast({
                          title: 'Copied',
                          description: 'Secret key copied to clipboard',
                        });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label
                htmlFor="verification-code"
                className="text-sm font-medium"
              >
                Enter 6-digit code from your authenticator app
              </Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, '').slice(0, 6)
                  )
                }
                className="text-center font-mono text-lg sm:text-xl tracking-widest h-12 sm:h-14"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep('generate')}
                className="flex-1 h-11 sm:h-10"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6 || loading}
                className="flex-1 h-11 sm:h-10"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 - Backup */}
        {step === 'backup' && setupData && (
          <div className="flex flex-col gap-4 pb-2">
            <div className="text-center space-y-3">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-success mx-auto" />
              <h3 className="font-semibold text-base sm:text-lg">
                2FA Enabled Successfully!
              </h3>
              <p className="text-sm text-muted-foreground px-2">
                Save these backup codes in a secure location
              </p>
            </div>

            <Card className="w-full">
              <CardHeader className="pb-2 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4 flex-shrink-0" />
                  Backup Recovery Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {setupData.backupCodes.map((code, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="justify-center font-mono text-xs sm:text-sm py-2 sm:py-1 select-all"
                    >
                      {code}
                    </Badge>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleCopyBackupCodes}
                  className="w-full h-11 sm:h-10"
                  disabled={copiedCodes}
                >
                  {copiedCodes ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All Codes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-muted p-3 rounded-lg mx-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Important:</strong> Store these codes safely. Each can
                only be used once to access your account if you lose your
                authenticator device.
              </p>
            </div>

            <Button onClick={handleComplete} className="w-full h-11 sm:h-10">
              Complete Setup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
