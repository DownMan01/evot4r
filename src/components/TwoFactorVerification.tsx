import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { useAuth } from "@/hooks/useAuth";
import { Shield, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TwoFactorVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  actionType: string;
  title?: string;
  description?: string;
  studentId?: string;
  password?: string;
}

const DEFAULT_TITLE = "Two-Factor Authentication Required";
const DEFAULT_DESCRIPTION =
  "Please enter your 6-digit verification code or your 8-character backup code to continue";

export const TwoFactorVerification = ({
  open,
  onOpenChange,
  onVerified,
  actionType,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  studentId,
  password,
}: TwoFactorVerificationProps) => {
  // 6-digit code as array for individual inputs
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""));
  // Backup code as full string input
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const { verifyTwoFactor, createStepUpVerification, disableTwoFactor } =
    useTwoFactor();
  const { signIn } = useAuth();

  // Refs to each digit input for focus control
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Reset all states on close
  const resetState = () => {
    setCodeDigits(Array(6).fill(""));
    setBackupCode("");
    setError("");
    setIsVerifying(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  // Combine code digits into a string
  const getCode = () => codeDigits.join("");

  const handleVerify = async () => {
    const code = getCode();

    if (code.length !== 6 && backupCode.length !== 8) {
      setError(
        "Please enter a valid 6-digit code or an 8-character backup code."
      );
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      // Choose which code to verify
      const codeToVerify = code.length === 6 ? code : backupCode.toUpperCase();

      console.log('2FA Verification: Starting verification for action:', actionType);
      console.log('2FA Verification: Code type:', code.length === 6 ? '6-digit TOTP' : '8-char backup');

      if (actionType === "login" && studentId && password) {
        const result = await signIn(studentId, password, codeToVerify);

        if (result.error) {
          console.error('2FA Login Error:', result.error);
          setError(
            result.error.message || "Invalid verification code. Please try again."
          );
        } else {
          console.log('2FA Login: Success');
          onVerified();
          handleClose();
        }
      } else if (actionType === "disable_2fa") {
        const success = await disableTwoFactor(codeToVerify);
        if (success) {
          console.log('2FA Disable: Success');
          onVerified();
          handleClose();
        } else {
          console.error('2FA Disable: Failed');
          setError("Invalid verification code. Please try again.");
        }
      } else {
        const isValid = await verifyTwoFactor(codeToVerify);

        if (isValid) {
          console.log('2FA Step-up: Creating step-up verification for', actionType);
          await createStepUpVerification(actionType);
          onVerified();
          handleClose();
        } else {
          console.error('2FA Step-up: Verification failed');
          setError("Invalid verification code. Please try again.");
        }
      }
    } catch (error) {
      console.error('2FA Verification: Unexpected error:', error);
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle each digit input change
  const handleDigitChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/[^0-9]/g, ""); // only digits
    if (!val) {
      // clear current digit
      updateCodeDigit(idx, "");
      return;
    }
    updateCodeDigit(idx, val[0]); // only first digit

    // Move focus to next input if available
    if (idx < 5 && val.length > 0) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const updateCodeDigit = (idx: number, val: string) => {
    setCodeDigits((digits) => {
      const newDigits = [...digits];
      newDigits[idx] = val;
      return newDigits;
    });
  };

  // Handle backspace for inputs, move focus backward
  const handleDigitKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace" && codeDigits[idx] === "" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      updateCodeDigit(idx - 1, "");
      e.preventDefault();
    }
  };

  // Backup code input change
  const handleBackupCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "");
    setBackupCode(val.slice(0, 8));
  };

  // Handle enter key in backup code input
  const handleBackupKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (getCode().length === 6 || backupCode.length === 8)) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} aria-label={title}>
      <DialogContent className="max-w-md mx-4 lg:mx-0 max-h-[90vh] overflow-y-auto p-6 lg:p-8 bg-background rounded-2xl shadow-lg border">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-lg lg:text-xl font-semibold text-primary">
            <Shield className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0" aria-hidden="true" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="mt-2 mb-6 text-sm text-muted-foreground leading-relaxed text-center px-2">
          {description}
        </DialogDescription>

        {error && (
          <Alert
            variant="destructive"
            className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-3 text-destructive mx-1"
            role="alert"
          >
            <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" aria-hidden="true" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* 6 digit code input - Mobile optimized */}
        <div className="flex justify-center gap-2 lg:gap-4 px-2">
          {codeDigits.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(e, idx)}
              onKeyDown={(e) => handleDigitKeyDown(e, idx)}
              ref={(el) => (inputsRef.current[idx] = el)}
              className={`w-10 h-12 lg:w-12 lg:h-14 text-center text-xl lg:text-2xl font-semibold rounded-xl border ${
                error
                  ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                  : "border-input focus:border-primary focus:ring-primary/30"
              } bg-background focus:outline-none focus:ring-2 transition-all touch-manipulation`}
              aria-label={`Digit ${idx + 1}`}
              autoComplete="one-time-code"
              disabled={isVerifying}
            />
          ))}
        </div>

        {/* Backup code input - Mobile optimized */}
        <div className="mt-6 lg:mt-8 px-2">
          <Label
            htmlFor="backup-code"
            className="mb-3 block text-sm font-medium text-foreground text-center"
          >
            Or enter your 8-character backup code
          </Label>
          <Input
            id="backup-code"
            type="text"
            inputMode="text"
            placeholder="BACKUPCODE"
            value={backupCode}
            onChange={handleBackupCodeChange}
            onKeyDown={handleBackupKeyDown}
            maxLength={8}
            className="mx-auto max-w-xs rounded-xl border bg-background px-4 py-3 lg:px-5 text-center text-base lg:text-lg font-mono tracking-widest text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 h-12 lg:h-auto touch-manipulation"
            spellCheck={false}
            disabled={isVerifying}
            aria-describedby="backup-help"
          />
          <p
            id="backup-help"
            className="mt-2 text-center text-xs text-muted-foreground select-none px-4"
          >
            Use this if you don't have access to your authenticator app
          </p>
        </div>

        {/* Buttons - Mobile optimized */}
        <div className="mt-8 lg:mt-10 flex flex-col lg:flex-row gap-3 lg:gap-4 px-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 rounded-xl border h-11 lg:h-10 text-foreground hover:bg-accent focus:ring-2 focus:ring-primary/30 focus:ring-offset-0"
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={
              isVerifying ||
              (getCode().length !== 6 && backupCode.length !== 8)
            }
            className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-4 focus:ring-primary/40 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-primary/60 h-11 lg:h-10"
            aria-live="polite"
          >
            {isVerifying && (
              <svg
                className="mr-2 inline h-4 w-4 lg:h-5 lg:w-5 animate-spin text-primary-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};