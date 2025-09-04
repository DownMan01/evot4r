import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MultiStepSignupForm } from './MultiStepSignupForm';
import { TwoFactorVerification } from './TwoFactorVerification';

export const LoginForm = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const { signIn, requiresTwoFactor, setRequiresTwoFactor } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });

        if (error) {
          toast({
            title: "Reset Failed",
            description: error.message,
            variant: "destructive",
            className: "bg-destructive text-destructive-foreground rounded-xl shadow-lg",
            duration: 5000,
          });
        } else {
          toast({
            title: "Reset Email Sent",
            description: "Check your inbox for password reset instructions.",
            className: "bg-primary text-primary-foreground rounded-xl shadow-lg",
            duration: 5000,
          });
          setIsForgotPassword(false);
          setResetEmail('');
        }
        setIsLoading(false);
        return;
      }

      const result = await signIn(studentId, password);

      if (result.error) {
        toast({
          title: "Authentication Error",
          description: result.error.message || "Something went wrong",
          variant: "destructive",
          className: "bg-destructive text-destructive-foreground rounded-xl shadow-lg",
          duration: 5000,
        });
      } else if (result.requiresTwoFactor) {
        // Show 2FA popup instead of redirect
        setShowTwoFactor(true);
      } else {
        toast({
          title: "Welcome Back!",
          description: "You've successfully logged in.",
          className: "bg-success text-success-foreground rounded-2xl shadow-xl backdrop-blur-sm",
          duration: 4000,
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
        className: "bg-destructive text-destructive-foreground rounded-xl shadow-lg",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorVerified = async () => {
    // This function is called when 2FA verification is successful
    // The TwoFactorVerification component handles the actual verification
    setShowTwoFactor(false);
    setRequiresTwoFactor(false);
    toast({
      title: "Welcome Back!",
      description: "You've successfully logged in with 2FA.",
      className: "bg-success text-success-foreground rounded-2xl shadow-xl backdrop-blur-sm",
      duration: 4000,
    });
    navigate('/dashboard');
  };

  const resetForm = () => {
    setPassword('');
    setStudentId('');
    setResetEmail('');
    setIsSignUp(false);
    setIsForgotPassword(false);
    setShowTwoFactor(false);
    setRequiresTwoFactor(false);
  };

  if (isForgotPassword) {
    return (
      <Card className="w-full max-w-md bg-card shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold text-primary flex items-center justify-center gap-2">
            <Button
             variant="ghost"
            size="icon-sm"
            onClick={() => setIsForgotPassword(false)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
            </Button>
            Reset Password
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive password reset instructions
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email Address</Label>
              <Input id="resetEmail" type="email" placeholder="Enter your email address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary-600" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Email'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (isSignUp) {
    return <MultiStepSignupForm onBackToLogin={() => setIsSignUp(false)} />;
  }

  return (
    <Card className="w-full max-w-md bg-card shadow-xl lg:shadow-xl md:shadow-2xl border-0 lg:border">
      <CardHeader className="text-center pb-4 lg:pb-6">
        <CardTitle className="text-lg lg:text-xl font-semibold text-primary">
          Vote Now!
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Every vote matters
        </p>
      </CardHeader>
      <CardContent className="px-4 lg:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentId" className="text-sm font-medium">Student ID</Label>
            <Input 
              id="studentId" 
              type="text" 
              placeholder="Enter your student ID" 
              value={studentId} 
              onChange={e => setStudentId(e.target.value)} 
              required 
              className="h-12 lg:h-10 text-base lg:text-sm"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="h-12 lg:h-10 text-base lg:text-sm pr-12"
                autoComplete="current-password"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="text-right pt-1">
            <button 
              type="button" 
              className="text-sm text-primary hover:underline active:text-primary-600" 
              onClick={() => setIsForgotPassword(true)}
            >
              Forgot your password?
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-600 h-12 lg:h-10 text-base lg:text-sm font-medium active:scale-[0.98] transition-transform" 
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : 'Login'}
          </Button>

          <div className="text-center pt-2">
            <button 
              type="button" 
              className="text-sm text-primary hover:underline active:text-primary-600" 
              onClick={() => setIsSignUp(true)}
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </CardContent>

      {/* 2FA Popup Dialog */}
      <TwoFactorVerification
        open={showTwoFactor}
        onOpenChange={setShowTwoFactor}
        onVerified={handleTwoFactorVerified}
        actionType="login"
        title="Two-Factor Authentication Required"
        description="Please enter your 6-digit verification code to complete login"
        studentId={studentId}
        password={password}
      />
    </Card>
  );
};
