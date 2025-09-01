import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AppealFormData {
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: string;
  gender: string;
  idFile: File | null;
}

export const useUserAppeal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const submitAppeal = async (userId: string, appealData: AppealFormData): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Upload new ID file if provided
      let idImageUrl = '';
      if (appealData.idFile) {
        const fileExt = appealData.idFile.name.split('.').pop();
        const fileName = `appeal-${appealData.studentId}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-ids')
          .upload(fileName, appealData.idFile);

        if (uploadError) {
          toast({
            title: "Upload Error",
            description: "Failed to upload ID image",
            variant: "destructive"
          });
          return false;
        }

        // Store just the path, not the full URL for security
        idImageUrl = fileName;
      }

      // Submit appeal using the database function
      const { error } = await supabase.rpc('submit_user_appeal', {
        p_user_id: userId,
        p_new_student_id: appealData.studentId,
        p_new_full_name: appealData.fullName,
        p_new_course: appealData.course,
        p_new_year_level: appealData.yearLevel,
        p_new_gender: appealData.gender,
        p_new_id_image_url: idImageUrl
      });

      if (error) {
        let errorMessage = error.message;
        if (errorMessage.includes('Student ID already exists')) {
          errorMessage = 'This Student ID is already registered by another user. Please use a different Student ID.';
        }
        
        toast({
          title: "Appeal Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Appeal Submitted",
        description: "Your appeal has been submitted successfully. Please wait for administrator review.",
        variant: "default"
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while submitting your appeal.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitAppeal,
    isLoading
  };
};