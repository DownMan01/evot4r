import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Eye, ArrowLeft } from 'lucide-react';
import { useUserAppeal, AppealFormData } from '@/hooks/useUserAppeal';
import { ImageWithLoader } from '@/components/ui/ImageWithLoader';

interface AppealFormProps {
  userId: string;
  currentProfile: {
    student_id: string | null;
    full_name: string | null;
    course: string | null;
    year_level: string | null;
    gender: string | null;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

export const AppealForm = ({ userId, currentProfile, onCancel, onSuccess }: AppealFormProps) => {
  const [formData, setFormData] = useState<AppealFormData>({
    studentId: currentProfile.student_id || '',
    fullName: currentProfile.full_name || '',
    course: currentProfile.course || '',
    yearLevel: currentProfile.year_level || '',
    gender: currentProfile.gender || '',
    idFile: null
  });

  const [imageLoading, setImageLoading] = useState(false);
  const { submitAppeal, isLoading } = useUserAppeal();

  const handleInputChange = (field: keyof AppealFormData, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.studentId.trim()) return false;
    if (!formData.fullName.trim()) return false;
    if (!formData.course) return false;
    if (!formData.yearLevel) return false;
    if (!formData.gender) return false;
    if (!formData.idFile) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const success = await submitAppeal(userId, formData);
    if (success) {
      onSuccess();
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={onCancel} className="p-1 h-auto">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl text-primary flex-1">
            Submit Appeal
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Update your information and resubmit for review
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="appealFullName">Full Name</Label>
          <Input 
            id="appealFullName" 
            type="text" 
            placeholder="Enter your full name" 
            value={formData.fullName} 
            onChange={e => handleInputChange('fullName', e.target.value)} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="appealStudentId">Student ID</Label>
          <Input 
            id="appealStudentId" 
            type="text" 
            placeholder="Enter your student ID" 
            value={formData.studentId} 
            onChange={e => handleInputChange('studentId', e.target.value)} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="appealCourse">Course</Label>
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
          <Label htmlFor="appealYearLevel">Year Level</Label>
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
          <Label htmlFor="appealGender">Gender</Label>
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
        
        <div className="space-y-2">
          <Label htmlFor="appealIdUpload">Upload New ID</Label>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input 
                id="appealIdUpload" 
                type="file" 
                accept="image/*" 
                onChange={e => handleInputChange('idFile', e.target.files?.[0] || null)} 
                className="hidden" 
                required 
              />
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-20 border-dashed" 
                onClick={() => document.getElementById('appealIdUpload')?.click()}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm">
                    {formData.idFile ? 
                      (formData.idFile.name.length > 20 ? 
                        formData.idFile.name.substring(0, 20) + '...' : 
                        formData.idFile.name
                      ) : 
                      'Choose new ID image'
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
                <Dialog>
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
            Upload a clear, updated photo of your student ID
          </p>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="flex-1 bg-primary hover:bg-primary-600" 
            disabled={isLoading || !validateForm()}
          >
            {isLoading ? 'Submitting...' : 'Submit Appeal'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
