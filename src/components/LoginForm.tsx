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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const LoginForm = () => {
  const isMobile = useIsMobile();
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
      <Card className={cn(
        "w-full animate-fade-in",
        isMobile 
          ? "max-w-sm mx-2 rounded-xl shadow-lg" 
          : "max-w-md shadow-xl",
        "bg-card border-border"
      )}>
        <CardHeader className={cn(
          "text-center",
          isMobile ? "px-4 py-4 pb-2" : "px-6 py-6 pb-4"
        )}>
          <div className="relative flex items-center justify-center">
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "default"}
              onClick={() => setIsForgotPassword(false)}
              className={cn(
                "absolute left-0 p-1 h-auto hover-scale",
                isMobile && "min-w-8 min-h-8"
              )}
            >
              <ArrowLeft className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
            <CardTitle className={cn(
              "font-semibold text-primary text-center",
              isMobile ? "text-lg" : "text-xl"
            )}>
              Reset Password
            </CardTitle>
          </div>
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>
            Enter your email to receive password reset instructions
          </p>
        </CardHeader>
        <CardContent className={cn(
          isMobile ? "px-4 pb-4" : "px-6 pb-6"
        )}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label 
                htmlFor="resetEmail" 
                className={cn(
                  "font-medium",
                  isMobile ? "text-sm" : "text-sm"
                )}
              >
                Email Address
              </Label>
              <Input 
                id="resetEmail" 
                type="email" 
                placeholder="Enter your email address" 
                value={resetEmail} 
                onChange={e => setResetEmail(e.target.value)} 
                required 
                className={cn(
                  isMobile ? "h-12 text-base" : "h-10 text-sm"
                )}
                autoComplete="email"
              />
            </div>
            <Button 
              type="submit" 
              className={cn(
                "w-full bg-primary hover:bg-primary/90 font-medium hover-scale",
                isMobile ? "h-12 text-base" : "h-10 text-sm"
              )}
              disabled={isLoading}
              size={isMobile ? "default" : "sm"}
            >
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
    <Card className={cn(
      "w-full animate-fade-in",
      isMobile 
        ? "max-w-sm mx-2 rounded-xl shadow-lg border-0" 
        : "max-w-md shadow-xl border",
      "bg-card"
    )}>
      <CardHeader className={cn(
        "text-center",
        isMobile ? "px-4 py-4 pb-2" : "px-6 py-6 pb-4"
      )}>
        <CardTitle className={cn(
          "font-semibold text-primary",
          isMobile ? "text-lg" : "text-xl"
        )}>
          Vote Now!
        </CardTitle>
        <p className={cn(
          "text-muted-foreground",
          isMobile ? "text-xs" : "text-sm"
        )}>
          Every vote matters
        </p>
      </CardHeader>
      <CardContent className={cn(
        isMobile ? "px-4 pb-4" : "px-6 pb-6"
      )}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label 
              htmlFor="studentId" 
              className={cn(
                "font-medium",
                isMobile ? "text-sm" : "text-sm"
              )}
            >
              Student ID
            </Label>
            <Input 
              id="studentId" 
              type="text" 
              placeholder="Enter your student ID" 
              value={studentId} 
              onChange={e => setStudentId(e.target.value)} 
              required 
              className={cn(
                isMobile ? "h-12 text-base" : "h-10 text-sm"
              )}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="password" 
              className={cn(
                "font-medium",
                isMobile ? "text-sm" : "text-sm"
              )}
            >
              Password
            </Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className={cn(
                  "pr-12",
                  isMobile ? "h-12 text-base" : "h-10 text-sm"
                )}
                autoComplete="current-password"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent hover-scale",
                  isMobile && "min-w-12"
                )}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
                ) : (
                  <Eye className={isMobile ? "h-4 w-4" : "h-4 w-4"} />
                )}
              </Button>
            </div>
          </div>

          <div className="text-right pt-1">
            <button 
              type="button" 
              className={cn(
                "text-primary hover:underline transition-colors hover-scale",
                isMobile ? "text-sm" : "text-sm"
              )}
              onClick={() => setIsForgotPassword(true)}
            >
              Forgot your password?
            </button>
          </div>

          <Button 
            type="submit" 
            className={cn(
              "w-full bg-primary hover:bg-primary/90 font-medium hover-scale transition-all",
              isMobile ? "h-12 text-base" : "h-10 text-sm"
            )}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : 'Login'}
          </Button>

          <div className="text-center pt-2">
            <button 
              type="button" 
              className={cn(
                "text-primary hover:underline transition-colors hover-scale",
                isMobile ? "text-sm" : "text-sm"
              )}
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
