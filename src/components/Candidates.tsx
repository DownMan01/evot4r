import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { AddCandidateForm } from '@/components/AddCandidateForm';
import { CandidateCard } from '@/components/CandidateCard';
import { EditCandidateForm } from '@/components/EditCandidateForm';
import { useOptimizedCandidates } from '@/hooks/useOptimizedCandidates';
import { GridViewSkeleton } from '@/components/UnifiedLoadingSkeleton';
import { PaginationControls } from '@/components/PaginationControls';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, RefreshCw, Edit, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StepUpVerification } from '@/components/StepUpVerification';

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
    'P. I. O.': 12,
    'MUSE': 13,
    'ESCORT': 14,
    'SRGT @ ARMS': 15,
    
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
export const Candidates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [expandedElections, setExpandedElections] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 24;
  const offset = (currentPage - 1) * LIMIT;

  const { profile, canViewCandidatesForElection } = usePermissions();
  const { toast } = useToast();
  const { 
    candidates,
    loading,
    error,
    refetch,
    totalCount,
    hasNextPage,
    hasPreviousPage
  } = useOptimizedCandidates({
    searchTerm,
    limit: LIMIT,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  // Filter candidates based on permissions (memoized)
  const filteredCandidates = React.useMemo(() => {
    return candidates.filter(candidate => canViewCandidatesForElection(candidate.election_status));
  }, [candidates, canViewCandidatesForElection]);

  // Group and sort candidates by election (memoized)
  const candidatesByElection = React.useMemo(() => {
    const grouped = filteredCandidates.reduce((acc, candidate) => {
      const key = `${candidate.election_id}-${candidate.election_title}`;
      if (!acc[key]) {
        acc[key] = {
          election_id: candidate.election_id,
          election_title: candidate.election_title,
          election_status: candidate.election_status,
          candidates: []
        };
      }
      acc[key].candidates.push(candidate);
      return acc;
    }, {} as Record<string, { 
      election_id: string; 
      election_title: string; 
      election_status: string; 
      candidates: Candidate[]; 
    }>);

    // Sort within each election
    Object.keys(grouped).forEach(key => {
      grouped[key].candidates.sort((a, b) => {
        const rankA = getPositionRank(a.position_title);
        const rankB = getPositionRank(b.position_title);
        if (rankA !== rankB) return rankA - rankB;
        return a.full_name.localeCompare(b.full_name);
      });
    });

    return grouped;
  }, [filteredCandidates]);

  const electionKeys = React.useMemo(() => Object.keys(candidatesByElection), [candidatesByElection]);

  // Initialize expanded elections to show all elections open by default
  React.useEffect(() => {
    if (Object.keys(candidatesByElection).length > 0) {
      setExpandedElections(new Set(Object.keys(candidatesByElection)));
    }
  }, [JSON.stringify(Object.keys(candidatesByElection))]);
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };
  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      const {
        error
      } = await supabase.from('candidates').delete().eq('id', candidateId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Candidate deleted successfully"
      });
      refetch();
    } catch (error: any) {
      console.error('Error deleting candidate:', error);
      toast({
        title: "Error",
        description: "Failed to delete candidate",
        variant: "destructive"
      });
    }
  };

  const handleVerifiedDelete = (candidateId: string) => {
    handleDeleteCandidate(candidateId);
  };
  const toggleElectionExpanded = (electionKey: string) => {
    const newExpanded = new Set(expandedElections);
    if (newExpanded.has(electionKey)) {
      newExpanded.delete(electionKey);
    } else {
      newExpanded.add(electionKey);
    }
    setExpandedElections(newExpanded);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Upcoming':
        return 'bg-blue-500';
      case 'Completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };
  if (loading && candidates.length === 0) {
    return <GridViewSkeleton />;
  }
  return <div className="space-y-4 lg:space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg lg:text-2xl font-bold"></h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(profile?.role === 'Staff' || profile?.role === 'Administrator') && <AddCandidateForm />}
          <RefreshButton
            onClick={refetch}
            loading={loading}
            disabled={loading}
            className="flex-1 sm:flex-initial"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input 
          placeholder="Search candidates by name, position, election, or bio..." 
          value={searchTerm} 
          onChange={e => handleSearchChange(e.target.value)} 
          className="pl-10 h-10"
        />
      </div>

      {error && <div className="text-center py-8">
          <p className="text-destructive mb-2">Failed to load candidates</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>}

      {!loading && Object.keys(candidatesByElection).length === 0 ? <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              {searchTerm ? 'No candidates match your search' : 'No candidates available'}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'Candidates will appear here when elections are created'}
            </p>
          </CardContent>
        </Card> : <div className="space-y-4 lg:space-y-6">
          {Object.entries(candidatesByElection).map(([electionKey, electionData]) => {
        const isExpanded = expandedElections.has(electionKey);
        return <Card key={electionKey} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Collapsible open={isExpanded} onOpenChange={() => toggleElectionExpanded(electionKey)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4 lg:py-6">
                      <div className="flex items-center justify-between">
                        {/* Mobile: Stack vertically, Desktop: Horizontal */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 flex-1 min-w-0">
                          <CardTitle className="text-lg lg:text-xl truncate">{electionData.election_title}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${getStatusColor(electionData.election_status)} text-white text-xs lg:text-sm`}>
                              {electionData.election_status}
                            </Badge>
                            <Badge variant="outline" className="text-xs lg:text-sm">
                              {electionData.candidates.length} candidate{electionData.candidates.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {isExpanded ? <ChevronUp className="h-5 w-5 lg:h-6 lg:w-6" /> : <ChevronDown className="h-5 w-5 lg:h-6 lg:w-6" />}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 lg:pb-6">
                      {/* Mobile: Single column, Desktop: Multi-column grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                        {electionData.candidates.map(candidate => <div key={candidate.id} className="relative group">
                            <CandidateCard candidate={candidate} showElectionInfo={false} />
                            
                            {/* Action buttons for staff/admin - Mobile: Always visible, Desktop: Hover */}
                            {(profile?.role === 'Staff' || profile?.role === 'Administrator') && <div className="absolute top-2 right-2 flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                {/* Edit button - disabled for Active/Completed elections */}
                                <Button 
                                  size="icon" 
                                  variant="outline" 
                                  className={`h-9 w-9 lg:h-8 lg:w-8 bg-background/90 backdrop-blur-sm ${
                                    electionData.election_status === 'Active' || electionData.election_status === 'Completed' 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : ''
                                  }`}
                                  onClick={() => {
                                    if (electionData.election_status !== 'Active' && electionData.election_status !== 'Completed') {
                                      setEditingCandidate(candidate);
                                    }
                                  }}
                                  disabled={electionData.election_status === 'Active' || electionData.election_status === 'Completed'}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                {/* Delete button - disabled for Active/Completed elections */}
                                {electionData.election_status === 'Active' || electionData.election_status === 'Completed' ? (
                                  <Button 
                                    size="icon" 
                                    variant="outline" 
                                    className="h-9 w-9 lg:h-8 lg:w-8 bg-background/90 backdrop-blur-sm opacity-50 cursor-not-allowed"
                                    disabled
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="outline" className="h-9 w-9 lg:h-8 lg:w-8 bg-background/90 backdrop-blur-sm text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="mx-4 lg:mx-0">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {candidate.full_name}? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col lg:flex-row gap-2 lg:gap-0">
                                        <AlertDialogCancel className="w-full lg:w-auto">Cancel</AlertDialogCancel>
                                        <StepUpVerification
                                          onVerified={() => handleVerifiedDelete(candidate.id)}
                                          actionType="delete_candidate"
                                          title="Verify Identity"
                                          description="Please verify your identity to delete this candidate."
                                        >
                                          <AlertDialogAction 
                                            className="w-full lg:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </StepUpVerification>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>}
                          </div>)}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>;
      })}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        loading={loading}
      />
        </div>}

      {/* Edit Candidate Modal */}
      {editingCandidate && <EditCandidateForm candidate={editingCandidate} open={!!editingCandidate} onClose={() => setEditingCandidate(null)} onSuccess={() => {
      setEditingCandidate(null);
      refetch();
    }} />}
    </div>;
};