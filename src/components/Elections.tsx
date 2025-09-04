import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { usePendingActions } from '@/hooks/usePendingActions';
import { useOptimizedElections } from '@/hooks/useOptimizedElections';
import { VotingInterface } from '@/components/VotingInterface';
import { CandidateCard } from '@/components/CandidateCard';
import { CreateElectionForm } from '@/components/CreateElectionForm';
import { ListViewSkeleton } from '@/components/UnifiedLoadingSkeleton';
import { PaginationControls } from '@/components/PaginationControls';
import { Calendar, Clock, Users, Vote, BarChart3, Search, MapPin, RefreshCw, Eye } from 'lucide-react';
import { SecureImage } from '@/components/ui/SecureImage';
import { formatPhilippineDateTime } from '@/utils/dateUtils';
interface Election {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  eligible_voters: string | null;
  cover_image_url: string | null;
  show_results_to_voters: boolean;
}
export const Elections = () => {
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [showVotingDialog, setShowVotingDialog] = useState(false);
  const [showCandidatesDialog, setShowCandidatesDialog] = useState(false);
  const [electionCandidates, setElectionCandidates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [votingLoading, setVotingLoading] = useState(false);
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { canViewResults, canViewElection, isStaff, canVote, canManageElections } = usePermissions();
  const { publishResultsRequest } = usePendingActions();
  const { toast } = useToast();
  
  const itemsPerPage = 6;
  const offset = (currentPage - 1) * itemsPerPage;

  const { 
    elections, 
    loading, 
    error, 
    totalCount, 
    refetch, 
    hasNextPage, 
    hasPreviousPage 
  } = useOptimizedElections({
    limit: itemsPerPage,
    offset,
    status: statusFilter,
    refetchInterval: 0, // Disable auto-polling
    userRole: isStaff || canManageElections ? 'Admin' : 'Voter'
  });

  // Check which elections the user has already voted in
  useEffect(() => {
    const checkVotedElections = async () => {
      if (!user?.id || !canVote) return;
      
      try {
        const { data: votingSessions } = await supabase
          .from('voting_sessions')
          .select('election_id')
          .eq('voter_id', user.id)
          .eq('has_voted', true);
        
        if (votingSessions) {
          setVotedElections(new Set(votingSessions.map(session => session.election_id)));
        }
      } catch (error) {
        console.error('Error checking voted elections:', error);
      }
    };

    checkVotedElections();
  }, [user?.id, canVote, elections]);

  // Filter by search term only (permissions already handled in query)
  const filteredElections = elections.filter(election => {
    const matchesSearch = !searchTerm || 
      election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.eligible_voters?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-success text-success-foreground';
      case 'Upcoming':
        return 'bg-primary text-primary-foreground';
      case 'Completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const formatDate = (dateString: string) => {
    return formatPhilippineDateTime(dateString, 'yyyy MMM dd, h:mm a');
  };

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
  const handleStartVoting = async (election: Election) => {
    if (!canVote) {
      console.error('User does not have voting permissions');
      toast({
        title: "Access Denied",
        description: "Only voters can cast votes in elections.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      console.error('User not authenticated');
      toast({
        title: "Authentication Required",
        description: "You must be logged in to vote.",
        variant: "destructive"
      });
      return;
    }

    setVotingLoading(true);

    try {
      // Use the new safe voting session function
      const { data: sessionResult, error: sessionError } = await supabase.rpc('create_voting_session_safe', {
        p_election_id: election.id
      });
      
      const result = sessionResult as { success: boolean; error: string | null; session_token: string | null };
      
      if (sessionError || !result?.success) {
        console.error('Cannot create voting session:', sessionError || result?.error);
        toast({
          title: "Voting Session Error",
          description: result?.error || "Failed to create voting session. You may have already voted in this election.",
          variant: "destructive"
        });
        return;
      }

      // Fetch election with positions and candidates using explicit foreign key
      const { data, error } = await supabase
        .from('elections')
        .select(`
          *,
          positions!positions_election_id_fkey (
            id,
            title,
            description,
            candidates (
              id,
              full_name,
              bio,
              image_url,
              position_id
            )
          )
        `)
        .eq('id', election.id)
        .single();
        
      if (error) {
        console.error('Failed to fetch election details:', error);
        toast({
          title: "Error Loading Election",
          description: "Failed to load election details. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedElection(data);
      setShowVotingDialog(true);
      
      toast({
        title: "Voting Session Started",
        description: "You can now cast your votes for this election.",
      });
    } catch (error) {
      console.error('Unexpected error starting voting:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setVotingLoading(false);
    }
  };
  const handleViewCandidates = async (election: Election) => {
    try {
      // Fetch candidates for this election with their position information
      const { data, error } = await supabase
        .from('candidates')
        .select(`
          id,
          full_name,
          bio,
          image_url,
          why_vote_me,
          jhs_school,
          jhs_graduation_year,
          shs_school,
          shs_graduation_year,
          partylist,
          positions!candidates_position_id_fkey(
            title
          )
        `)
        .eq('election_id', election.id);
        
      if (error) {
        console.error('Failed to fetch candidates:', error);
        return;
      }
      
      const formattedCandidates = data?.map((candidate: any) => ({
        id: candidate.id,
        full_name: candidate.full_name,
        bio: candidate.bio,
        image_url: candidate.image_url,
        why_vote_me: candidate.why_vote_me,
        jhs_school: candidate.jhs_school,
        jhs_graduation_year: candidate.jhs_graduation_year,
        shs_school: candidate.shs_school,
        shs_graduation_year: candidate.shs_graduation_year,
        partylist: candidate.partylist,
        position_title: candidate.positions?.title || 'Unknown Position',
        election_title: election.title,
        election_status: election.status
      })) || [];
      
      // Sort candidates by position hierarchy
      const sortedCandidates = formattedCandidates.sort((a, b) => {
        const rankA = getPositionRank(a.position_title);
        const rankB = getPositionRank(b.position_title);
        
        // If positions have different ranks, sort by rank
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        
        // If same position rank, sort alphabetically by name
        return a.full_name.localeCompare(b.full_name);
      });
      
      setElectionCandidates(sortedCandidates);
      setSelectedElection(election);
      setShowCandidatesDialog(true);
    } catch (error) {
      console.error('Error viewing candidates:', error);
    }
  };

  const handleVoteComplete = () => {
    setShowVotingDialog(false);
    setSelectedElection(null);
    // Update voted elections state to reflect the new vote
    if (selectedElection) {
      setVotedElections(prev => new Set([...prev, selectedElection.id]));
    }
  };
  if (loading && elections.length === 0) {
    return <ListViewSkeleton />;
  }
  return <div className="space-y-4 lg:space-y-6 pb-4 lg:pb-0 w-full">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg lg:text-2xl font-bold"></h2>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full lg:w-40 h-10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background border border-border">
              <SelectItem value="all">All Elections</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 w-full lg:w-auto">
            <CreateElectionForm />
            <RefreshButton
              onClick={refetch}
              loading={loading}
              disabled={loading}
              className="flex-1 lg:flex-initial"
              text="Refresh Data"
              mobileText="Refresh"
            />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search elections by title, description, or eligible voters..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-2">Failed to load elections</p>
          <Button onClick={refetch} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {!loading && filteredElections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              {searchTerm ? 'No elections match your search' : statusFilter === 'all' ? 'No elections available' : `No ${statusFilter.toLowerCase()} elections`}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'Check back later for upcoming elections'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
           <div className="space-y-3 lg:space-y-6">
             {filteredElections.map(election => (
               <Card key={election.id} className="overflow-hidden hover:shadow-lg transition-shadow mx-0">
                 {election.cover_image_url && (
                   <div className="relative h-32 lg:h-48 w-full">
                  <SecureImage 
                    bucket="election-covers"
                    path={election.cover_image_url}
                    alt={election.title}
                    className="w-full h-full object-cover"
                    showError={true}
                    fallback={null}
                  />
                     <div className="absolute inset-0 bg-black/20" />
                   </div>
                 )}
                  <CardHeader className="pb-2 lg:pb-4 p-4 lg:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Mobile: Stack title and badge vertically */}
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3 mb-2">
                          <CardTitle className="text-base lg:text-xl font-semibold leading-tight text-left">
                            {election.title}
                          </CardTitle>
                          <Badge className={`${getStatusColor(election.status)} w-fit text-xs self-start`}>
                            {election.status}
                          </Badge>
                        </div>
                       {election.description && (
                         <p className="text-sm lg:text-base text-muted-foreground mb-3 line-clamp-2 lg:line-clamp-3">
                           {election.description}
                         </p>
                       )}
                       <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                         <MapPin className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                         <span className="truncate">Eligible: {election.eligible_voters || 'All Courses'}</span>
                       </div>
                     </div>
                   </div>
                 </CardHeader>
                  <CardContent className="pt-0 p-4 lg:p-6 lg:pt-0">
                    {/* Mobile: Stack dates vertically, Desktop: Side by side */}
                    <div className="grid gap-2 lg:grid-cols-2 lg:gap-4 mb-4">
                     <div className="flex items-center gap-2 text-xs lg:text-sm">
                       <Calendar className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground flex-shrink-0" />
                       <span className="truncate">Starts: {formatDate(election.start_date)}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs lg:text-sm">
                       <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground flex-shrink-0" />
                       <span className="truncate">Ends: {formatDate(election.end_date)}</span>
                     </div>
                   </div>
                   
                    {/* Mobile: Full width buttons with better spacing */}
                    <div className="flex flex-col gap-2 lg:flex-row lg:gap-2 lg:flex-wrap w-full">
                     <Button 
                       variant="outline" 
                       onClick={() => handleViewCandidates(election)}
                       className="w-full lg:w-auto flex items-center justify-center gap-2 h-10 lg:h-10 text-sm"
                     >
                       <Eye className="h-4 w-4" />
                       <span>View Candidates</span>
                     </Button>
                     
                     {election.status === 'Active' && canVote && (
                       <Button 
                         onClick={() => handleStartVoting(election)} 
                         className="w-full lg:w-auto flex items-center justify-center gap-2 h-10 lg:h-10 text-sm"
                         disabled={votingLoading || votedElections.has(election.id)}
                         variant={votedElections.has(election.id) ? "outline" : "default"}
                       >
                         <Vote className="h-4 w-4" />
                         <span>
                           {votingLoading ? 'Starting...' : votedElections.has(election.id) ? 'Already Voted' : 'Cast Vote'}
                         </span>
                       </Button>
                     )}
                     
                     {election.status === 'Upcoming' && (
                       <Button variant="outline" disabled className="w-full lg:w-auto h-10 lg:h-10 text-sm">
                         Election not yet started
                       </Button>
                     )}
                     
                     {election.status === 'Completed' && canViewResults(election.status, election.show_results_to_voters) && (
                       <Button 
                         variant="outline"
                         onClick={() => {
                           const searchParams = new URLSearchParams(window.location.search);
                           searchParams.set('tab', 'results');
                           searchParams.set('election', election.id);
                           window.history.pushState({}, '', `${window.location.pathname}?${searchParams}`);
                           window.location.reload();
                         }}
                         className="w-full lg:w-auto flex items-center justify-center gap-2 h-10 lg:h-10 text-sm"
                       >
                         <BarChart3 className="h-4 w-4" />
                         <span>View Results</span>
                       </Button>
                     )}
                     
                      {/* Staff can request to publish results for completed elections where results aren't visible to voters */}
                      {isStaff && election.status === 'Completed' && !election.show_results_to_voters && (
                       <Button 
                         variant="outline" 
                         onClick={() => publishResultsRequest(election.id)} 
                         className="w-full lg:w-auto flex items-center justify-center gap-2 h-11 lg:h-10 text-xs lg:text-sm"
                       >
                         <BarChart3 className="h-4 w-4" />
                         <span>Request to Publish Results</span>
                       </Button>
                     )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              loading={loading}
            />
          )}
        </>
      )}

      {/* Candidates Dialog */}
      <Dialog open={showCandidatesDialog} onOpenChange={setShowCandidatesDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidates for {selectedElection?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {electionCandidates.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No candidates found for this election</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {electionCandidates.map(candidate => (
                  <CandidateCard 
                    key={candidate.id} 
                    candidate={candidate}
                    showElectionInfo={false}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Voting Dialog */}
      <Dialog open={showVotingDialog} onOpenChange={setShowVotingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cast Your Vote</DialogTitle>
          </DialogHeader>
          {selectedElection && <VotingInterface election={selectedElection as any} onVoteComplete={handleVoteComplete} />}
        </DialogContent>
      </Dialog>
    </div>;
};