import * as OTPAuth from 'otpauth';

export interface TOTPDebugInfo {
  currentTime: number;
  timeStep: number;
  timeWindow: number;
  generatedCode: string;
  secretLength: number;
  algorithm: string;
}

export const generateDebugTOTP = (secret: string): TOTPDebugInfo => {
  const now = Date.now();
  const timeStep = Math.floor(now / 1000 / 30);
  
  // Create TOTP object with same settings as backend
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });

  const generatedCode = totp.generate();

  return {
    currentTime: now,
    timeStep,
    timeWindow: timeStep,
    generatedCode,
    secretLength: secret.length,
    algorithm: 'SHA1',
  };
};

export const validateTOTPCode = (secret: string, code: string): boolean => {
  try {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    // Check current time window and ±2 windows for clock drift
    const now = Math.floor(Date.now() / 1000);
    for (let i = -2; i <= 2; i++) {
      const timeWindow = Math.floor(now / 30) + i;
      const expectedCode = totp.generate({ timestamp: timeWindow * 30 * 1000 });
      if (expectedCode === code) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error validating TOTP code:', error);
    return false;
  }
};

export const logTOTPDebugInfo = (secret: string, userCode: string) => {
  try {
    const debugInfo = generateDebugTOTP(secret);
    const isValid = validateTOTPCode(secret, userCode);
    
    console.group('🔐 2FA Debug Information');
    console.log('Current Time:', new Date(debugInfo.currentTime).toISOString());
    console.log('Time Step:', debugInfo.timeStep);
    console.log('Generated Code:', debugInfo.generatedCode);
    console.log('User Code:', userCode);
    console.log('Code Valid:', isValid);
    console.log('Secret Length:', debugInfo.secretLength);
    console.log('Algorithm:', debugInfo.algorithm);
    
    // Convert secret to hex for comparison with database
    const secretBuffer = OTPAuth.Secret.fromBase32(secret).buffer;
    const hexSecret = Array.from(new Uint8Array(secretBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log('Secret (Base32):', secret);
    console.log('Secret (Hex):', hexSecret);
    console.log('Secret (Hex Length):', hexSecret.length);
    
    // Generate codes for surrounding time windows
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    
    console.log('Time Window Codes:');
    const now = Math.floor(Date.now() / 1000);
    for (let i = -3; i <= 3; i++) {
      const timeWindow = Math.floor(now / 30) + i;
      const code = totp.generate({ timestamp: timeWindow * 30 * 1000 });
      const label = i === 0 ? 'CURRENT' : i < 0 ? `${Math.abs(i)} step(s) ago` : `${i} step(s) ahead`;
      const match = code === userCode ? ' ← MATCHES USER CODE!' : '';
      console.log(`  ${label}: ${code}${match}`);
    }
    console.groupEnd();
    
    return { debugInfo, isValid, hexSecret };
  } catch (error) {
    console.error('Error generating debug info:', error);
    return null;
  }
};

// Test TOTP with multiple algorithms and settings
export const testTOTPCompatibility = (secret: string, userCode: string) => {
  const tests = [
    { algorithm: 'SHA1', digits: 6, period: 30, name: 'Standard TOTP' },
    { algorithm: 'SHA256', digits: 6, period: 30, name: 'SHA256 TOTP' },
    { algorithm: 'SHA512', digits: 6, period: 30, name: 'SHA512 TOTP' },
    { algorithm: 'SHA1', digits: 8, period: 30, name: '8-digit TOTP' },
    { algorithm: 'SHA1', digits: 6, period: 60, name: '60s period TOTP' },
  ];

  console.group('🧪 TOTP Compatibility Test');
  console.log('Testing user code:', userCode);
  console.log('Secret:', secret);
  
  tests.forEach(test => {
    try {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
        algorithm: test.algorithm as any,
        digits: test.digits,
        period: test.period,
      });
      
      const generatedCode = totp.generate();
      const matches = generatedCode === userCode;
      
      console.log(`${test.name}: ${generatedCode} ${matches ? '✅ MATCH' : '❌'}`);
    } catch (error) {
      console.log(`${test.name}: Error - ${error}`);
    }
  });
  
  console.groupEnd();
};