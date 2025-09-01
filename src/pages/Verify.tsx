import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  QrCode,
  Calendar,
  FileText,
  Users,
  ShieldCheck,
  Vote
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useVoteReceipt } from '@/hooks/useVoteReceipt';

interface VerificationData {
  receipt_id: string;
  election_id: string;
  election_title: string;
  selected_candidates: Array<{ position: string; candidate: string }>;
  voting_date: string;
  created_at: string;
  is_valid: boolean;
}

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { loading, verifyReceipt } = useVoteReceipt();

  const receiptId = searchParams.get('receiptId');
  const token = searchParams.get('token');

  const performVerification = useCallback(async () => {
    if (!receiptId || !token) {
      setError('Missing receipt ID or verification token in URL');
      return;
    }

    const result = await verifyReceipt(receiptId, token);

    if (result.success && result.data) {
      setVerificationData(result.data as VerificationData);
    } else {
      setError(result.error || 'Verification failed');
    }
  }, [receiptId, token, verifyReceipt]);

  useEffect(() => {
    performVerification();
  }, [performVerification]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Verifying your vote receipt...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-muted-foreground">Please check your QR code or contact your election officer and try again.</p>
            <Button asChild variant="outline">
              <Link to="/">Go Back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verificationData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-3 md:p-6 mobile-full-height">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4 px-2">
          <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-primary tracking-tight">Vote Verified</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Your vote has been successfully verified and recorded. See the verified receipt details below.
          </p>
        </div>

        <Card className="border border-primary/20 shadow-sm rounded-2xl mx-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Election Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 pt-0">
            {[
              { icon: <Vote className="h-4 w-4 text-primary" />, label: 'Election Name', value: verificationData.election_title },
              { icon: <ShieldCheck className="h-4 w-4 text-primary" />, label: 'Election ID', value: verificationData.election_id, mono: true },
              { icon: <Calendar className="h-4 w-4 text-primary" />, label: 'Voting Date', value: formatDate(verificationData.voting_date) },
              { icon: <QrCode className="h-4 w-4 text-primary" />, label: 'Receipt ID', value: verificationData.receipt_id, mono: true }
            ].map(({ icon, label, value, mono }, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <Badge variant="outline" className="bg-primary/5 text-xs">{label}</Badge>
                </div>
                <p className={`text-base ${mono ? 'font-mono text-sm text-muted-foreground' : 'font-semibold'}`}>{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-primary/20 shadow-sm rounded-2xl mx-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Users className="h-5 w-5 text-primary" />
              Selected Candidates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
            {verificationData.selected_candidates
              .filter(item => item.candidate !== 'Unknown')
              .map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-colors ${
                  idx % 2 === 0 ? 'bg-primary/5 border-primary/10' : 'bg-secondary/40 border-secondary/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Badge className="text-xs bg-primary/10 text-primary border border-primary/20">
                      {item.position}
                    </Badge>
                    <p className="font-semibold text-lg">{item.candidate}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
              </div>
              ))}
          </CardContent>
        </Card>

        <Card className="border border-primary/20 shadow-sm rounded-2xl mx-2">
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6 text-center">
            <div className="mx-auto h-12 w-12 md:h-14 md:w-14 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold">Verification Complete</h3>
              <p className="text-muted-foreground text-xs md:text-sm">
                Verified on {formatDate(verificationData.created_at)}
              </p>
            </div>
            <Alert className="bg-primary/5 border-primary/20 text-left">
              <CheckCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs md:text-sm">
                <strong>Your vote is secure and anonymous.</strong> This confirmation proves your selections were recorded accurately without exposing your identity.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="text-center px-2">
          <Button asChild className="rounded-full px-6 py-2 text-sm md:text-base shadow-md hover:shadow-lg transition touch-manipulation w-full sm:w-auto">
            <Link to="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Verify;
