import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { usePendingActions } from '@/hooks/usePendingActions';
import { Plus, Calendar, Users, Vote, Upload, X } from 'lucide-react';

interface Position {
  title: string;
  description: string;
  max_candidates: number;
}

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

// Predefined position options - sorted by hierarchy rank
const UNSORTED_POSITION_OPTIONS = [
  'President',
  'Internal Vice-President',
  'External Vice-President',
  'Vice-President',
  'Secretary',
  'Treasurer',
  'Auditor',
  'Student Information Officer (S.I.O.)',
  'Public Information Officer (P.I.O.)',
  'Business Manager',
  'Business Manager 1',
  'Business Manager 2',
  'Project Manager 1',
  'Project Manager 2',
  'Senator',
  'Governor',
  'Vice-Governor',
  '1st Year Representative',
  '2nd Year Representative',
  '3rd Year Representative',
  '4th Year Representative',
  'Muse',
  'Escort',
  'Sergeant at Arms (Srgt @ Arms)'
];

// Sort positions by hierarchy rank
const POSITION_OPTIONS = UNSORTED_POSITION_OPTIONS.sort((a, b) => {
  const rankA = getPositionRank(a);
  const rankB = getPositionRank(b);
  return rankA - rankB;
});

// Course options
const COURSE_OPTIONS = [
  'All Courses',
  'Bachelor of Science in Criminology',
  'Bachelor of Secondary Education',
  'Bachelor of Science in Social Works',
  'Bachelor of Science in Business Administration',
  'Bachelor of Elementary Education',
  'Bachelor of Science in Accountancy',
  'Bachelor of Science in Information Technology',
  'Bachelor of Physical Education'
];

// Max candidates options
const MAX_CANDIDATES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const CreateElectionForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageLoading, setCoverImageLoading] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [eligibleVoters, setEligibleVoters] = useState('All Courses');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [positions, setPositions] = useState<Position[]>([{ title: '', description: '', max_candidates: 1 }]);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { isStaff, isAdmin } = usePermissions();
  const { createElectionRequest } = usePendingActions();

  const addPosition = () => {
    setPositions([...positions, { title: '', description: '', max_candidates: 1 }]);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImageLoading(true);
      
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImagePreview(reader.result as string);
        setCoverImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  const uploadCoverImage = async (electionId: string): Promise<string | null> => {
    if (!coverImage) return null;

    const fileExt = coverImage.name.split('.').pop();
    const fileName = `${electionId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('election-covers')
      .upload(filePath, coverImage, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    // Return just the path, not the full URL for security
    return filePath;
  };

  const updatePosition = (index: number, field: keyof Position, value: string | number) => {
    const updated = positions.map((pos, i) => 
      i === index ? { ...pos, [field]: value } : pos
    );
    setPositions(updated);
  };

  const removePosition = (index: number) => {
    if (positions.length > 1) {
      setPositions(positions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isAdmin) {
        // Admin can create elections directly
        const electionData = {
          title,
          description,
          eligible_voters: eligibleVoters,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
        };

        const { data: electionResult, error: electionError } = await supabase
          .from('elections')
          .insert(electionData)
          .select()
          .single();

        if (electionError) throw electionError;

        // Upload cover image if provided
        let coverImageUrl = null;
        if (coverImage) {
          coverImageUrl = await uploadCoverImage(electionResult.id);
          await supabase
            .from('elections')
            .update({ cover_image_url: coverImageUrl })
            .eq('id', electionResult.id);
        }

        // Create positions
        if (positions.length > 0) {
          const positionsData = positions
            .filter(pos => pos.title.trim())
            .map(pos => ({
              election_id: electionResult.id,
              title: pos.title,
              description: pos.description,
              max_candidates: pos.max_candidates
            }));

          const { error: positionsError } = await supabase
            .from('positions')
            .insert(positionsData);

          if (positionsError) throw positionsError;
        }

        toast({
          title: "Success",
          description: "Election created successfully",
        });
      } else if (isStaff) {
        // Staff must request approval - upload image immediately and store URL
        const electionData: any = {
          title,
          description,
          eligible_voters: eligibleVoters,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          positions: positions.filter(pos => pos.title.trim())
        };

        // Upload cover image immediately if provided
        if (coverImage) {
          // Generate a temporary unique filename for the pending election
          const fileExt = coverImage.name.split('.').pop();
          const tempFileName = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('election-covers')
            .upload(tempFileName, coverImage, { upsert: true });

          if (uploadError) {
            throw uploadError;
          }

          // Store just the path, not the full URL for security
          electionData.cover_image_filename = coverImage.name;
          electionData.cover_image_url = tempFileName;
          electionData.temp_image_path = tempFileName; // Store temp path for cleanup/rename
        }

        const success = await createElectionRequest(electionData);
        if (success) {
          toast({
            title: "Request Submitted",
            description: "Your election creation request has been submitted for approval",
          });
        }
      }

      // Reset form
      setTitle('');
      setDescription('');
      setCoverImage(null);
      setCoverImagePreview(null);
      setEligibleVoters('All Courses');
      setStartDate('');
      setEndDate('');
      setPositions([{ title: '', description: '', max_candidates: 1 }]);
      setShowDialog(false);
    } catch (error: any) {
      console.error('Election creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create election",
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
        <Plus className="h-4 w-4" />
        Create Election
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Election</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Election Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Student Council Elections 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the election purpose and details..."
                  rows={3}
                />
              </div>

             <div className="space-y-2">
  <Label htmlFor="cover-image" className="text-sm font-medium text-foreground">
    Election Cover Photo
  </Label>

  {coverImagePreview ? (
    <div className="relative">
      {coverImageLoading ? (
        <div className="w-full h-40 bg-muted rounded-lg border flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <img
          src={coverImagePreview}
          alt="Cover preview"
          className="w-full h-40 object-cover rounded-lg border animate-fade-in"
          loading="lazy"
        />
      )}
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="absolute top-2 right-2"
        onClick={removeCoverImage}
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  ) : (
    <label
      htmlFor="cover-image"
      className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/30 transition"
    >
      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-1">
        Click to upload election cover photo
      </p>
      <span className="text-xs text-muted-foreground">(PNG, JPG, JPEG)</span>
      <Input
        id="cover-image"
        type="file"
        accept="image/*"
        onChange={handleCoverImageChange}
        className="hidden"
      />
    </label>
  )}
</div>


              <div>
                <Label htmlFor="eligible-voters">Eligible Voters</Label>
                <Select value={eligibleVoters} onValueChange={setEligibleVoters}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select eligible voters" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_OPTIONS.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Positions</h3>
                <Button type="button" onClick={addPosition} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Position
                </Button>
              </div>

              {/* Positions in a scrollable container with max height */}
              <div className="max-h-96 overflow-y-auto border rounded-lg p-2 space-y-3">
                {positions.map((position, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Position {index + 1}</h4>
                        {positions.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removePosition(index)}
                            variant="outline"
                            size="sm"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <Label>Position Title</Label>
                          <Select 
                            value={position.title} 
                            onValueChange={(value) => updatePosition(index, 'title', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a position" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {POSITION_OPTIONS.map((option) => {
                                // Check if this position is already selected in another position card
                                const isAlreadySelected = positions.some((pos, i) => 
                                  i !== index && pos.title === option
                                );
                                
                                return (
                                  <SelectItem 
                                    key={option} 
                                    value={option}
                                    disabled={isAlreadySelected}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span>{option}</span>
                                      {isAlreadySelected && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          (Already selected)
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Max Candidates</Label>
                          <Select 
                            value={position.max_candidates.toString()} 
                            onValueChange={(value) => updatePosition(index, 'max_candidates', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select max candidates" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {MAX_CANDIDATES_OPTIONS.map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <Textarea
                            value={position.description}
                            onChange={(e) => updatePosition(index, 'description', e.target.value)}
                            placeholder="Describe the role and responsibilities..."
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Show helpful message when no positions */}
              {positions.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                  <Vote className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No positions added yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add Position" to get started</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : (isAdmin ? 'Create Election' : 'Submit for Approval')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};