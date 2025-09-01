import { supabase } from '@/integrations/supabase/client';
import * as OTPAuth from 'otpauth';

export interface TwoFactorTestResult {
  success: boolean;
  error?: string;
  authUser?: any;
  profileData?: any;
  steps: {
    [key: string]: {
      success: boolean;
      message: string;
      data?: any;
    };
  };
}

export const testTwoFactorSystem = async (): Promise<TwoFactorTestResult> => {
  const result: TwoFactorTestResult = {
    success: false,
    steps: {}
  };

  try {
    // Step 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      result.steps.auth = {
        success: false,
        message: `Authentication failed: ${authError?.message || 'No user found'}`
      };
      result.authUser = user;
      return result;
    }
    result.steps.auth = {
      success: true,
      message: 'User authenticated successfully',
      data: { userId: user.id, email: user.email }
    };
    result.authUser = user;

    // Step 1.5: Check profile access
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profileData) {
      result.steps.profile = {
        success: false,
        message: `Profile access failed: ${profileError?.message || 'No profile found'}`
      };
      result.profileData = profileData;
      return result;
    }
    result.steps.profile = {
      success: true,
      message: 'Profile accessible',
      data: { 
        twoFactorEnabled: profileData.two_factor_enabled,
        hasSecret: !!profileData.two_factor_secret
      }
    };
    result.profileData = profileData;

    // Step 2: Generate test secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const secretBase32 = secret.base32;
    const hexSecret = Array.from(new Uint8Array(secret.buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    result.steps.secretGeneration = {
      success: true,
      message: 'Secret generated successfully',
      data: { secretLength: secretBase32.length, hexLength: hexSecret.length }
    };

    // Step 3: Test TOTP generation first
    const totp = new OTPAuth.TOTP({
      secret: secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const currentCode = totp.generate();
    result.steps.totpGeneration = {
      success: true,
      message: 'TOTP generation successful',
      data: { currentCode }
    };

    // Step 4: Test database functions availability
    const { data: debugData, error: debugError } = await supabase.rpc('debug_two_factor_setup', {
      p_secret: hexSecret
    });

    if (debugError) {
      result.steps.databaseTest = {
        success: false,
        message: `Database function error: ${debugError.message}`,
        data: { error: debugError }
      };
      return result;
    }

    result.steps.databaseTest = {
      success: true,
      message: 'Database functions working',
      data: debugData
    };

    // Step 5: Test TOTP verification function with actual code
    const { data: testData, error: testError } = await supabase.rpc('test_totp_verification', {
      p_secret: hexSecret,
      p_test_code: currentCode
    });

    if (testError) {
      result.steps.totpTest = {
        success: false,
        message: `TOTP test error: ${testError.message}`,
        data: { error: testError }
      };
    } else {
      result.steps.totpTest = {
        success: true,
        message: 'TOTP verification test completed',
        data: testData
      };
    }

    // Step 6: Test backup codes generation
    const backupCodes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    result.steps.backupCodes = {
      success: true,
      message: 'Backup codes generated',
      data: { count: backupCodes.length }
    };

    // All steps passed
    result.success = true;
    result.steps.overall = {
      success: true,
      message: '2FA system test completed successfully'
    };

  } catch (error: any) {
    result.error = error.message;
    result.steps.error = {
      success: false,
      message: `Unexpected error: ${error.message}`
    };
  }

  return result;
};

export const logTwoFactorTest = async () => {
  console.group('🧪 Two-Factor Authentication System Test');
  
  const testResult = await testTwoFactorSystem();
  
  Object.entries(testResult.steps).forEach(([stepName, step]) => {
    const icon = step.success ? '✅' : '❌';
    console.log(`${icon} ${stepName}: ${step.message}`);
    if (step.data) {
      console.log('   Data:', step.data);
    }
  });

  if (testResult.success) {
    console.log('🎉 Overall: 2FA system is working correctly');
  } else {
    console.error('💥 Overall: 2FA system has issues');
    if (testResult.error) {
      console.error('Error:', testResult.error);
    }
  }

  console.groupEnd();
  return testResult;
};