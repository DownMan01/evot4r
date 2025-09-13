import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Upload, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { ImageWithLoader } from '@/components/ui/ImageWithLoader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface DuplicateCheckResult {
  email_exists: boolean;
  student_id_exists: boolean;
  has_duplicates: boolean;
}

interface SignupFormData {
  fullName: string;
  email: string;
  studentId: string;
  course: string;
  yearLevel: string;
  gender: string;
  password: string;
  confirmPassword: string;
  idFile: File | null;
}
interface MultiStepSignupFormProps {
  onBackToLogin: () => void;
}
export const MultiStepSignupForm = ({
  onBackToLogin
}: MultiStepSignupFormProps) => {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    studentId: '',
    course: '',
    yearLevel: '',
    gender: '',
    password: '',
    confirmPassword: '',
    idFile: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const {
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const steps = [{
    id: 1,
    title: 'Personal Info'
  }, {
    id: 2,
    title: 'Academic Details'
  }, {
    id: 3,
    title: 'Account Security'
  }, {
    id: 4,
    title: 'Verification'
  }];
  const handleInputChange = (field: keyof SignupFormData, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullName.trim()) {
          toast({
            title: "Error",
            description: "Please enter your full name",
            variant: "destructive"
          });
          return false;
        }
        if (!formData.email.trim()) {
          toast({
            title: "Error",
            description: "Please enter your email address",
            variant: "destructive"
          });
          return false;
        }
        if (!formData.studentId.trim()) {
          toast({
            title: "Error",
            description: "Please enter your student ID",
            variant: "destructive"
          });
          return false;
        }
        return true;
      case 2:
        if (!formData.course) {
          toast({
            title: "Error",
            description: "Please select your course",
            variant: "destructive"
          });
          return false;
        }
        if (!formData.yearLevel) {
          toast({
            title: "Error",
            description: "Please select your year level",
            variant: "destructive"
          });
          return false;
        }
        if (!formData.gender) {
          toast({
            title: "Error",
            description: "Please select your gender",
            variant: "destructive"
          });
          return false;
        }
        return true;
      case 3:
        if (formData.password.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters",
            variant: "destructive"
          });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive"
          });
          return false;
        }
        return true;
      case 4:
        if (!formData.idFile) {
          toast({
            title: "Error",
            description: "Please upload your ID",
            variant: "destructive"
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setLoading(true);
    setPreviewLoading(true);
    
    try {
      // Check for duplicate email or student ID before proceeding
      const { data: duplicateCheck, error: duplicateError } = await supabase
        .rpc('check_duplicate_user', {
          p_email: formData.email,
          p_student_id: formData.studentId
        });

      if (duplicateError) {
        toast({
          title: "Validation Error",
          description: "Unable to validate account information. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const checkResult = duplicateCheck as unknown as DuplicateCheckResult;
      if (checkResult?.has_duplicates) {
        let errorMessage = "Account creation failed: ";
        if (checkResult.email_exists) {
          errorMessage += "Email already exists. ";
        }
        if (checkResult.student_id_exists) {
          errorMessage += "Student ID already exists. ";
        }
        errorMessage += "Please use different credentials.";
        
        toast({
          title: "Duplicate Account",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // Upload ID file
      let idImageUrl = '';
      if (formData.idFile) {
        const fileExt = formData.idFile.name.split('.').pop();
        const fileName = `${formData.studentId}-${Date.now()}.${fileExt}`;
        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage.from('student-ids').upload(fileName, formData.idFile);
        if (uploadError) {
          toast({
            title: "Upload Error",
            description: "Failed to upload ID image",
            variant: "destructive"
          });
          return;
        }
        // Store just the path, not the full URL for security
        idImageUrl = fileName;
      }

      const result = await signUp(formData.email, formData.studentId, formData.password, formData.fullName, {
        course: formData.course,
        year_level: formData.yearLevel,
        gender: formData.gender,
        id_image_url: idImageUrl
      });
      
      if (result.error) {
        // Handle specific Supabase auth errors
        let errorMessage = result.error.message || "An error occurred during registration";
        
        if (errorMessage.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please use a different email or try logging in.";
        } else if (errorMessage.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (errorMessage.includes("Password")) {
          errorMessage = "Password must be at least 6 characters long.";
        }
        
        toast({
          title: "Registration Error",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account Created",
          description: "Your account has been created successfully. Please wait for approval from the administrator."
        });
        navigate('/success');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setPreviewLoading(false);
    }
  };
  const renderStepIndicator = () => {
    const isMobile = useIsMobile();
    
    return (
      <div className={cn(
        "flex items-center justify-center mb-6 sm:mb-8", 
        isMobile ? "space-x-1" : "space-x-2"
      )}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "step-indicator flex items-center justify-center rounded-full border-2 transition-all duration-300",
              isMobile ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm",
              currentStep > step.id 
                ? 'bg-success border-success text-success-foreground' 
                : currentStep === step.id 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'bg-background border-border text-muted-foreground'
            )}>
              {currentStep > step.id ? (
                <Check className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              ) : (
                step.id
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 transition-colors duration-300",
                isMobile ? "w-6 mx-1" : "w-12 mx-2",
                currentStep > step.id ? 'bg-success' : 'bg-border'
              )} />
            )}
          </div>
        ))}
      </div>
    );
  };
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" type="text" placeholder="Enter your full name" value={formData.fullName} onChange={e => handleInputChange('fullName', e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="Enter your email address" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" type="text" placeholder="Enter your student ID" value={formData.studentId} onChange={e => handleInputChange('studentId', e.target.value)} required />
            </div>
          </div>;
      case 2:
        return <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select value={formData.course} onValueChange={value => handleInputChange('course', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your course" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="Bachelor of Science in Criminology">Bachelor of Science in Criminology</SelectItem>
                <SelectItem value="Bachelor of Secondary Education">Bachelor of Secondary Education</SelectItem>
                <SelectItem value="Bachelor of Science in Social Works">Bachelor of Science in Social Works</SelectItem>
                <SelectItem value="Bachelor of Science in Business Administration">Bachelor of Science in Business Administration</SelectItem>
                <SelectItem value="Bachelor of Elementary Education">Bachelor of Elementary Education</SelectItem>
                <SelectItem value="Bachelor of Science in Accountancy">Bachelor of Science in Accountancy</SelectItem>
                <SelectItem value="Bachelor of Science in Information Technology">Bachelor of Science in Information Technology</SelectItem>
                 <SelectItem value="Bachelor of Physical Education">Bachelor of Physical Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="yearLevel">Year Level</Label>
              <Select value={formData.yearLevel} onValueChange={value => handleInputChange('yearLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={value => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>;
      case 3:
        return <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={e => handleInputChange('confirmPassword', e.target.value)} required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>;
      case 4:
        return <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="idUpload">Upload Your ID</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input id="idUpload" type="file" accept="image/*" onChange={e => handleInputChange('idFile', e.target.files?.[0] || null)} className="hidden" required />
                 <Button 
                    type="button" 
                    variant="outline" 
                    size="upload"
                    className="w-full border-dashed" 
                    onClick={() => document.getElementById('idUpload')?.click()}
                  >
               <div className="flex flex-col items-center justify-center space-y-2 w-full">
                <Upload className="h-6 w-6 flex-shrink-0" />
                  <span className="text-sm text-center whitespace-normal break-words max-w-full px-1">
                    {formData.idFile 
                    ? formData.idFile.name.length > 30 
                    ? `${formData.idFile.name.substring(0, 30)}...` 
                    : formData.idFile.name
                    : 'Choose ID image'
                      }
                  </span>
              </div>
                </Button>
                </div>
                {formData.idFile && (
                  <div className="relative w-20 h-20">
                    <ImageWithLoader
                      src={URL.createObjectURL(formData.idFile)} 
                      alt="ID Preview" 
                      className="w-full h-full object-cover rounded border"
                      containerClassName="w-full h-full"
                      loaderSize="sm"
                      minLoadingTime={300}
                    />
                    <Dialog open={showPreview} onOpenChange={setShowPreview}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          className="absolute top-1 right-1 h-6 w-6 p-0 z-20"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <ImageWithLoader
                          src={URL.createObjectURL(formData.idFile)} 
                          alt="ID Full View" 
                          className="w-full h-auto rounded"
                          loaderSize="md"
                          minLoadingTime={400}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Upload a clear photo of your student ID for verification
              </p>
            </div>
          </div>;
      default:
        return null;
    }
  };
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
        <div className="relative flex items-center justify-center mb-2">
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "default"}
            onClick={onBackToLogin} 
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
            Create Account
          </CardTitle>
        </div>
        <p className={cn(
          "text-muted-foreground",
          isMobile ? "text-xs" : "text-sm"
        )}>
          {steps[currentStep - 1]?.title} - Step {currentStep} of {steps.length}
        </p>
      </CardHeader>
      
      <CardContent className={cn(
        isMobile ? "px-4 pb-4" : "px-6 pb-6"
      )}>
        {renderStepIndicator()}
        
        <div className="step-transition">
          {renderStep()}
        </div>
        
        <div className={cn(
          "flex justify-between mt-6",
          isMobile ? "space-x-2" : "space-x-3"
        )}>
          {currentStep > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep} 
              className="flex-1 hover-scale"
              size={isMobile ? "sm" : "default"}
            >
              <ArrowLeft className={cn(
                "mr-2",
                isMobile ? "h-3 w-3" : "h-4 w-4"
              )} />
              Previous
            </Button>
          )}
          
          {currentStep < steps.length ? (
            <Button 
              type="button" 
              onClick={nextStep} 
              className={cn(
                "bg-primary hover:bg-primary/90 hover-scale",
                currentStep === 1 ? 'w-full' : 'flex-1'
              )}
              size={isMobile ? "sm" : "default"}
            >
              Next
              <ArrowRight className={cn(
                "ml-2",
                isMobile ? "h-3 w-3" : "h-4 w-4"
              )} />
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleSubmit} 
              className="flex-1 bg-primary hover:bg-primary/90 hover-scale" 
              disabled={loading}
              size={isMobile ? "sm" : "default"}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
