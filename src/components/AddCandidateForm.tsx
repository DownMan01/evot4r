import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Plus, UserPlus, Upload, User, GraduationCap, MessageSquare, FileText, Camera, UsersIcon, Users } from 'lucide-react';

// Position hierarchy ranking system
const getPositionRank = (positionTitle: string): number => {
  const normalizedTitle = positionTitle.toUpperCase().trim();
  
  // Define position hierarchy (lower number = higher rank)
  const positionRanks: { [key: string]: number } = {
    // University/College Level
    'PRESIDENT': 1,
    'V-PRESIDENT': 2,
    'VICE-PRESIDENT': 2,
    'INTERNAL VICE-PRESIDENT': 3,
    'EXTERNAL VICE-PRESIDENT': 4,
    'SECRETARY': 5,
    'TREASURER': 6,
    'AUDITOR': 7,
    'BUSINESS MANAGER': 8,
    'BUSINESS MANAGER 1': 8,
    'BUSINESS MANAGER 2': 9,
    'PROJECT MANAGER 1': 10,
    'PROJECT MANAGER 2': 11,
    'S. I. O.': 12,
    'STUDENT INFORMATION OFFICER (S.I.O.)': 12,
    'P. I. O.': 12,
    'PUBLIC INFORMATION OFFICER (P.I.O.)': 12,
    'MUSE': 13,
    'ESCORT': 14,
    'SRGT @ ARMS': 15,
    'SERGEANT AT ARMS (SRGT @ ARMS)': 15,
    
    // Regional/Provincial Level
    'SENATOR': 20,
    'GOVERNOR': 21,
    'V-GOVERNOR': 22,
    'VICE-GOVERNOR': 22,
    
    // Representatives
    '1ST YEAR REPRESENTATIVE': 30,
    '2ND YEAR REPRESENTATIVE': 31,
    '3RD YEAR REPRESENTATIVE': 32,
    '4TH YEAR REPRESENTATIVE': 33,
    // Backwards compatibility (old labels)
    'REPRESENTATIVES 1': 30,
    'REPRESENTATIVES 2': 31,
    'REPRESENTATIVES 3': 32,
    'REPRESENTATIVES 4': 33,
    'REPRESENTATIVE 1': 30,
    'REPRESENTATIVE 2': 31,
    'REPRESENTATIVE 3': 32,
    'REPRESENTATIVE 4': 33,
  };
  
  // Check for exact matches first
  if (positionRanks[normalizedTitle]) {
    return positionRanks[normalizedTitle];
  }
  
  // Check for partial matches for variations
  for (const [key, rank] of Object.entries(positionRanks)) {
    if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
      return rank;
    }
  }
  
  // Default rank for unknown positions (will appear at the end)
  return 999;
};

interface Election {
  id: string;
  title: string;
}

interface Position {
  id: string;
  title: string;
  election_id: string;
  max_candidates: number;
  current_candidates?: number;
}

export const AddCandidateForm = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [whyVoteMe, setWhyVoteMe] = useState('');
  const [partylist, setPartylist] = useState('');
  const [jhsSchool, setJhsSchool] = useState('');
  const [jhsGraduationYear, setJhsGraduationYear] = useState('');
  const [shsSchool, setShsSchool] = useState('');
  const [shsGraduationYear, setShsGraduationYear] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { isStaff, isAdmin } = usePermissions();

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElection) {
      fetchPositions(selectedElection);
    } else {
      setPositions([]);
      setSelectedPosition('');
    }
  }, [selectedElection]);

  const fetchElections = async () => {
    const { data, error } = await supabase
      .from('elections')
      .select('id, title')
      .eq('status', 'Upcoming')
      .order('start_date', { ascending: true });

    if (error) {
      // Error fetching elections
    } else {
      setElections(data || []);
    }
  };

  const fetchPositions = async (electionId: string) => {
    try {
      // First get positions - don't sort by title since we'll sort by rank
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('id, title, election_id, max_candidates')
        .eq('election_id', electionId);

      if (positionsError) {
        console.error('Error fetching positions:', positionsError);
        return;
      }

      // Then get candidate counts for each position
      const positionsWithCount = await Promise.all(
        (positionsData || []).map(async (position) => {
          const { count, error: countError } = await supabase
            .from('candidates')
            .select('*', { count: 'exact', head: true })
            .eq('position_id', position.id);

          if (countError) {
            console.error('Error counting candidates:', countError);
            return { ...position, current_candidates: 0 };
          }

          return { ...position, current_candidates: count || 0 };
        })
      );

      // Sort positions by hierarchy rank (highest rank first)
      const sortedPositions = positionsWithCount.sort((a, b) => {
        const rankA = getPositionRank(a.title);
        const rankB = getPositionRank(b.title);
        return rankA - rankB;
      });

      console.log('Positions with counts (sorted by rank):', sortedPositions);
      setPositions(sortedPositions);
    } catch (error) {
      console.error('Error in fetchPositions:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('candidate-profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Return just the path, not the full URL for security
      return filePath;
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setProfileImage(file);
    setImageLoading(true);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check max candidates constraint
      const selectedPos = positions.find(p => p.id === selectedPosition);
      if (selectedPos && selectedPos.current_candidates && selectedPos.current_candidates >= selectedPos.max_candidates) {
        toast({
          title: "Cannot Add Candidate",
          description: `This position already has the maximum number of candidates allowed (${selectedPos.max_candidates}).`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      let imageUrl = '';
      
      // Upload image if provided
      if (profileImage) {
        const uploadedUrl = await handleImageUpload(profileImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const candidateData = {
        election_id: selectedElection,
        position_id: selectedPosition,
        full_name: fullName,
        bio: bio || null,
        image_url: imageUrl || null,
        why_vote_me: whyVoteMe || null,
        partylist: partylist || null,
        jhs_school: jhsSchool || null,
        jhs_graduation_year: jhsGraduationYear ? parseInt(jhsGraduationYear) : null,
        shs_school: shsSchool || null,
        shs_graduation_year: shsGraduationYear ? parseInt(shsGraduationYear) : null
      };

      // Both staff and admins can add candidates directly (no approval needed)
      const { error } = await supabase
        .from('candidates')
        .insert(candidateData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Candidate added successfully",
      });

      // Reset form
      setSelectedElection('');
      setSelectedPosition('');
      setFullName('');
      setBio('');
      setWhyVoteMe('');
      setPartylist('');
      setJhsSchool('');
      setJhsGraduationYear('');
      setShsSchool('');
      setShsGraduationYear('');
      setProfileImage(null);
      setImagePreview('');
      setShowDialog(false);
    } catch (error: any) {
      console.error('Candidate addition error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add candidate",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isStaff && !isAdmin) {
    return null;
  }

  return (
    <div>
      <Button onClick={() => setShowDialog(true)} className="flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Add Candidate
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Add New Candidate
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Upload Section */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-primary" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      {imageLoading ? (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                        </div>
                      ) : imagePreview ? (
                        <AvatarImage src={imagePreview} alt="Preview" />
                      ) : (
                        <AvatarFallback className="text-lg bg-gradient-to-br from-primary/10 to-primary/20">
                          {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-8 w-8" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <Label htmlFor="profileImage" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-colors">
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload Photo"}
                      </div>
                    </Label>
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      JPG, PNG or GIF (max 5MB)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="election" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Election
                  </Label>
                  <Select value={selectedElection} onValueChange={setSelectedElection} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select an election" />
                    </SelectTrigger>
                    <SelectContent>
                      {elections.map((election) => (
                        <SelectItem key={election.id} value={election.id}>
                          {election.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="position" className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Position
                  </Label>
                  <Select 
                    value={selectedPosition} 
                    onValueChange={setSelectedPosition} 
                    disabled={!selectedElection}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => {
                        const isFull = position.current_candidates && position.current_candidates >= position.max_candidates;
                        return (
                          <SelectItem 
                            key={position.id} 
                            value={position.id}
                            disabled={isFull}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span>{position.title}</span>
                              <span className={`text-xs ml-2 ${isFull ? 'text-destructive' : 'text-muted-foreground'}`}>
                                ({position.current_candidates || 0}/{position.max_candidates})
                                {isFull && ' - Full'}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter candidate's full name"
                    className="mt-1"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Educational Background */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Educational Background
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jhsSchool">Junior High School</Label>
                  <Input
                    id="jhsSchool"
                    value={jhsSchool}
                    onChange={(e) => setJhsSchool(e.target.value)}
                    placeholder="School name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="jhsGraduationYear">JHS Graduation Year</Label>
                  <Select value={jhsGraduationYear} onValueChange={setJhsGraduationYear}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select graduation year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: new Date().getFullYear() + 10 - 1980 + 1 }, (_, i) => {
                        const year = new Date().getFullYear() + 10 - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="shsSchool">Senior High School</Label>
                  <Input
                    id="shsSchool"
                    value={shsSchool}
                    onChange={(e) => setShsSchool(e.target.value)}
                    placeholder="School name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="shsGraduationYear">SHS Graduation Year</Label>
                  <Select value={shsGraduationYear} onValueChange={setShsGraduationYear}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select graduation year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: new Date().getFullYear() + 10 - 1980 + 1 }, (_, i) => {
                        const year = new Date().getFullYear() + 10 - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Information */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Campaign Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="partylist" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Partylist (Optional)
                  </Label>
                  <Input
                    id="partylist"
                    value={partylist}
                    onChange={(e) => setPartylist(e.target.value)}
                    placeholder="Enter partylist affiliation (if any)"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your background, achievements, and qualifications..."
                    rows={4}
                    className="mt-1 resize-none"
                  />
                </div>
                <div>
                  <Label htmlFor="whyVoteMe">Why should people vote for you?</Label>
                  <Textarea
                    id="whyVoteMe"
                    value={whyVoteMe}
                    onChange={(e) => setWhyVoteMe(e.target.value)}
                    placeholder="Share your vision, goals, and what makes you the best candidate for this position..."
                    rows={4}
                    className="mt-1 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowDialog(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || uploading || !selectedElection || !selectedPosition || !fullName.trim()}
                className="px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    {uploading ? 'Uploading...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Candidate
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};