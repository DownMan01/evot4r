import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StepUpVerification } from '@/components/StepUpVerification';

interface Candidate {
  id: string;
  full_name: string;
  bio: string | null;
  image_url: string | null;
  position_title: string;
  election_title: string;
  election_status: string;
  election_id: string;
  position_id: string;
  why_vote_me?: string | null;
  jhs_school?: string | null;
  jhs_graduation_year?: number | null;
  shs_school?: string | null;
  shs_graduation_year?: number | null;
  partylist?: string | null;
}

interface Election {
  id: string;
  title: string;
  status: string;
}

interface Position {
  id: string;
  title: string;
  election_id: string;
}

interface EditCandidateFormProps {
  candidate: Candidate;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditCandidateForm = ({ candidate, open, onClose, onSuccess }: EditCandidateFormProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [elections, setElections] = useState<Election[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(candidate.image_url);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    election_id: candidate.election_id,
    position_id: candidate.position_id,
    full_name: candidate.full_name,
    bio: candidate.bio || '',
    why_vote_me: candidate.why_vote_me || '',
    partylist: candidate.partylist || '',
    jhs_school: candidate.jhs_school || '',
    jhs_graduation_year: candidate.jhs_graduation_year || '',
    shs_school: candidate.shs_school || '',
    shs_graduation_year: candidate.shs_graduation_year || '',
  });

  useEffect(() => {
    if (open) {
      fetchElections();
    }
  }, [open]);

  useEffect(() => {
    if (formData.election_id) {
      fetchPositions(formData.election_id);
    }
  }, [formData.election_id]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('id, title, status')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const fetchPositions = async (electionId: string) => {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('id, title, election_id')
        .eq('election_id', electionId)
        .order('title');

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setImageLoading(true);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageLoading(false);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${candidate.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('candidate-profiles')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Return just the path, not the full URL for security
      return filePath;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = candidate.image_url;
      
      if (selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const updateData: any = {
        election_id: formData.election_id,
        position_id: formData.position_id,
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim() || null,
        why_vote_me: formData.why_vote_me.trim() || null,
        partylist: formData.partylist.trim() || null,
        jhs_school: formData.jhs_school.trim() || null,
        jhs_graduation_year: formData.jhs_graduation_year ? parseInt(formData.jhs_graduation_year.toString()) : null,
        shs_school: formData.shs_school.trim() || null,
        shs_graduation_year: formData.shs_graduation_year ? parseInt(formData.shs_graduation_year.toString()) : null,
        image_url: imageUrl,
      };

      const { error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating candidate:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update candidate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleVerifiedSubmit = () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Candidate</DialogTitle>
          <DialogDescription>
            Update candidate information and profile details.
          </DialogDescription>
        </DialogHeader>

        {/* Warning for Active/Completed elections */}
        {(candidate.election_status === 'Active' || candidate.election_status === 'Completed') && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Notice:</strong> This election is {candidate.election_status.toLowerCase()}. 
              Candidate editing has been disabled for security and integrity purposes.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="space-y-4">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                {imageLoading ? (
                  <div className="h-full w-full flex items-center justify-center bg-muted">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    <AvatarImage 
                      src={previewUrl || undefined} 
                      alt="Candidate preview"
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      {formData.full_name ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CN'}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('candidate-image')?.click()}
                    disabled={uploading || candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  
                  {previewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeImage}
                      disabled={uploading || candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Upload a clear photo (max 5MB). JPG, PNG supported.
                </p>
                
                <input
                  id="candidate-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Election Selection */}
            <div className="space-y-2">
              <Label htmlFor="election">Election *</Label>
              <Select
                value={formData.election_id}
                onValueChange={(value) => setFormData({ ...formData, election_id: value, position_id: '' })}
                required
                disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an election" />
                </SelectTrigger>
                <SelectContent>
                  {elections.map((election) => (
                    <SelectItem key={election.id} value={election.id}>
                      {election.title} ({election.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position Selection */}
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select
                value={formData.position_id}
                onValueChange={(value) => setFormData({ ...formData, position_id: value })}
                required
                disabled={!formData.election_id || candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter candidate's full name"
              required
              disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
            />
          </div>

          {/* Biography */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about the candidate's background, experience, and qualifications..."
              rows={4}
              className="resize-none"
              disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
            />
          </div>

          {/* Partylist */}
          <div className="space-y-2">
            <Label htmlFor="partylist">Partylist (Optional)</Label>
            <Input
              id="partylist"
              value={formData.partylist}
              onChange={(e) => setFormData({ ...formData, partylist: e.target.value })}
              placeholder="Enter partylist affiliation (if any)"
              disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
            />
          </div>

          {/* Why Vote Me */}
          <div className="space-y-2">
            <Label htmlFor="why_vote_me">Why should people vote for you?</Label>
            <Textarea
              id="why_vote_me"
              value={formData.why_vote_me}
              onChange={(e) => setFormData({ ...formData, why_vote_me: e.target.value })}
              placeholder="Share your vision, goals, and what makes you the right choice..."
              rows={4}
              className="resize-none"
              disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
            />
          </div>

          {/* Educational Background */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-lg font-semibold mb-4">Educational Background</h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Junior High School */}
                <div className="space-y-4">
                  <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Junior High School
                  </h5>
                   <div className="space-y-2">
                     <Label htmlFor="jhs_school">School Name</Label>
                     <Input
                       id="jhs_school"
                       value={formData.jhs_school}
                       onChange={(e) => setFormData({ ...formData, jhs_school: e.target.value })}
                       placeholder="Enter JHS school name"
                       disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="jhs_graduation_year">Graduation Year</Label>
                     <Input
                       id="jhs_graduation_year"
                       type="number"
                       min="1990"
                       max="2030"
                       value={formData.jhs_graduation_year}
                       onChange={(e) => setFormData({ ...formData, jhs_graduation_year: e.target.value })}
                       placeholder="e.g., 2020"
                       disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
                     />
                   </div>
                 </div>

                 {/* Senior High School */}
                 <div className="space-y-4">
                   <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                     Senior High School
                   </h5>
                   <div className="space-y-2">
                     <Label htmlFor="shs_school">School Name</Label>
                     <Input
                       id="shs_school"
                       value={formData.shs_school}
                       onChange={(e) => setFormData({ ...formData, shs_school: e.target.value })}
                       placeholder="Enter SHS school name"
                       disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="shs_graduation_year">Graduation Year</Label>
                     <Input
                       id="shs_graduation_year"
                       type="number"
                       min="1990"
                       max="2030"
                       value={formData.shs_graduation_year}
                       onChange={(e) => setFormData({ ...formData, shs_graduation_year: e.target.value })}
                       placeholder="e.g., 2022"
                       disabled={candidate.election_status === 'Active' || candidate.election_status === 'Completed'}
                     />
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            
            {(candidate.election_status === 'Active' || candidate.election_status === 'Completed') ? (
              <Button
                disabled
                className="min-w-[120px] opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Update Disabled
              </Button>
            ) : (
              <StepUpVerification
                onVerified={handleVerifiedSubmit}
                actionType="edit_candidate"
                title="Verify Identity"
                description="Please verify your identity to edit this candidate."
              >
                <Button
                  type="button"
                  disabled={loading || uploading || !formData.full_name.trim() || !formData.election_id || !formData.position_id}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Candidate
                    </>
                  )}
                </Button>
              </StepUpVerification>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};