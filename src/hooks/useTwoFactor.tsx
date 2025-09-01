import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export const useTwoFactor = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const generateTwoFactorSetup = useCallback(async (): Promise<TwoFactorSetup | null> => {
    if (!profile) {
      toast({
        title: "Not signed in",
        description: "Please sign in to set up two-factor authentication",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      
      // Generate a random secret
      const secret = new OTPAuth.Secret({ size: 20 });
      const secretBase32 = secret.base32;
      
      // Create TOTP object
      const totp = new OTPAuth.TOTP({
        issuer: 'Evotar',
        label: profile.email || profile.full_name || 'User',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secret,
      });

      // Generate QR code URI
      const qrCode = totp.toString();

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      return {
        secret: secretBase32,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      console.error('Error generating 2FA setup:', error);
      toast({
        title: "Error",
        description: "Failed to generate 2FA setup",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const enableTwoFactor = useCallback(async (secret: string, verificationCode: string, backupCodes: string[]) => {
    if (!profile) {
      console.error('2FA Error: No profile found');
      return false;
    }

    try {
      setLoading(true);

      // Validate inputs
      if (!secret || !verificationCode || !backupCodes || backupCodes.length === 0) {
        throw new Error('Missing required parameters for 2FA setup');
      }

      // First verify the code client-side before saving to database
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });

      const isCodeValid = totp.validate({ token: verificationCode, window: 2 }) !== null;
      
      if (!isCodeValid) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Ensure we have a valid session before making calls
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('2FA Enable: No valid session');
        throw new Error('Authentication session expired');
      }

      // Save to database using new function (stores base32 directly)
      const { error: enableError } = await (supabase as any).rpc('enable_two_factor', {
        p_secret: secret,
        p_backup_codes: backupCodes,
      } as any);

      if (enableError) {
        console.error('2FA Enable Error:', enableError);
        throw new Error(`Failed to enable 2FA: ${enableError.message}`);
      }

      console.log('2FA: Secret and backup codes saved successfully');
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled",
      });
      return true;
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      const errorMessage = error?.message || 'Failed to enable two-factor authentication';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const disableTwoFactor = useCallback(async (verificationCode: string) => {
    if (!profile) {
      return false;
    }

    try {
      setLoading(true);

      // Ensure we have a valid session before making the RPC call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('2FA Disable: No valid session');
        toast({
          title: "Authentication Error",
          description: "Please log out and log back in",
          variant: "destructive",
        });
        return false;
      }

      // Verify code (for backup codes, database handles it; for TOTP, client-side verification)
      if (verificationCode.length === 6) {
        // TOTP code - verify client-side first
        if (profile.two_factor_secret) {
          const totp = new OTPAuth.TOTP({
            secret: OTPAuth.Secret.fromBase32(profile.two_factor_secret),
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
          });
          
          const isCodeValid = totp.validate({ token: verificationCode, window: 2 }) !== null;
          if (!isCodeValid) {
            toast({
              title: "Invalid Code",
              description: "The verification code is incorrect",
              variant: "destructive",
            });
            return false;
          }
        }
      }

      // Also check with database (for backup codes)
      const { data: isValid, error: verifyError } = await (supabase as any).rpc('verify_two_factor_code', {
        p_code: verificationCode
      } as any);

      if (verifyError || !isValid) {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect",
          variant: "destructive",
        });
        return false;
      }

      // Remove from database
      const { error } = await (supabase as any).rpc('disable_two_factor' as any);

      if (error) throw error;

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const verifyTwoFactor = useCallback(async (code: string): Promise<boolean> => {
    try {
      if (!code || code.trim() === '') {
        console.error('2FA Verify: Empty code provided');
        return false;
      }

      if (!profile?.user_id) {
        console.error('2FA Verify: No authenticated user');
        return false;
      }

      console.log('2FA Verify: Attempting to verify code of length:', code.length);

      // For 6-digit TOTP codes, verify client-side first
      if (code.length === 6 && profile.two_factor_secret) {
        const totp = new OTPAuth.TOTP({
          secret: OTPAuth.Secret.fromBase32(profile.two_factor_secret),
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
        });
        
        const isCodeValid = totp.validate({ token: code.trim(), window: 2 }) !== null;
        if (isCodeValid) {
          console.log('2FA Verify: TOTP verification successful');
          return true;
        }
      }

      // For backup codes or if TOTP failed, check database
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('2FA Verify: No valid session');
        return false;
      }

      const { data, error } = await (supabase as any).rpc('verify_two_factor_code', {
        p_code: code.trim()
      } as any);

      if (error) {
        console.error('Error verifying 2FA:', error);
        return false;
      }

      const isValid = data === true;
      console.log('2FA Verify: Database verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      return false;
    }
  }, [profile]);

  const createStepUpVerification = useCallback(async (actionType: string) => {
    if (!profile) return null;

    try {
      const sessionToken = crypto.randomUUID();
      
      const { error } = await supabase
        .from('step_up_verifications')
        .insert({
          user_id: profile.user_id,
          session_token: sessionToken,
          action_type: actionType,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

      if (error) throw error;
      return sessionToken;
    } catch (error) {
      console.error('Error creating step-up verification:', error);
      return null;
    }
  }, [profile]);

  return {
    loading,
    generateTwoFactorSetup,
    enableTwoFactor,
    disableTwoFactor,
    verifyTwoFactor,
    createStepUpVerification,
    canUseTwoFactor: Boolean(profile),
    twoFactorEnabled: profile?.two_factor_enabled || false,
  };
};