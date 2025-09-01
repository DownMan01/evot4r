import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { CheckSquare, Vote, Calendar, Users, Settings, BarChart3 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { CreateElectionForm } from '@/components/CreateElectionForm';
import { AddCandidateForm } from '@/components/AddCandidateForm';

interface QuickStats {
  activeElections: number;
  totalVotes: number;
  userVotedInActive: boolean;
  nextElectionDate?: string;
  canVoteInActiveElection: boolean;
  activeElectionEligibility?: string;
}

export const DashboardOverview = () => {
  const [stats, setStats] = useState<QuickStats>({ 
    activeElections: 0, 
    totalVotes: 0, 
    userVotedInActive: false,
    canVoteInActiveElection: false,
    activeElectionEligibility: undefined
  });
  const [loading, setLoading] = useState(true);
  const { canVote, isStaff, isAdmin } = usePermissions();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Get active elections count and details
      const { data: activeElectionsData, count: activeElections } = await supabase
        .from('elections')
        .select('id, title, eligible_voters, status', { count: 'exact' })
        .eq('status', 'Active');

      // Get total votes count
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      let userVotedInActive = false;
      let canVoteInActiveElection = false;
      let activeElectionEligibility = undefined as string | undefined;

      if (canVote) {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          // Get user profile to check course eligibility
          const { data: profile } = await supabase
            .from('profiles')
            .select('course, registration_status')
            .eq('user_id', user.user.id)
            .single();

          const activeIds = (activeElectionsData ?? []).map((e: any) => e.id).filter(Boolean);

          if (activeIds.length > 0) {
            const { count: votedCount, error: votedErr } = await supabase
              .from('voting_sessions')
              .select('*', { count: 'exact', head: true })
              .eq('voter_id', user.user.id)
              .eq('has_voted', true)
              .in('election_id', activeIds as string[]);

            if (!votedErr) {
              userVotedInActive = (votedCount ?? 0) > 0;
            } else {
              // If the count query failed for some reason, fall back to fetching sessions
              const { data: fallbackSessions } = await supabase
                .from('voting_sessions')
                .select('has_voted, election_id')
                .eq('voter_id', user.user.id);

              userVotedInActive = (fallbackSessions ?? []).some((s: any) => s.has_voted === true && activeIds.includes(s.election_id));
            }
          } else {
            // no active elections, user can't have voted in one
            userVotedInActive = false;
          }

          // --- UPDATED: eligibility across all active elections (not just the first) ---
          if (profile && profile.registration_status === 'Approved' && activeElectionsData && activeElectionsData.length > 0) {
            // If any active election allows All Courses, user is eligible
            const anyAllowsAll = activeElectionsData.some((e: any) => e.eligible_voters === 'All Courses');

            if (anyAllowsAll) {
              canVoteInActiveElection = true;
              activeElectionEligibility = 'All Courses';
            } else {
              // If any active election lists the user's course explicitly, they're eligible
              const eligibleForAny = activeElectionsData.some((e: any) => e.eligible_voters === profile.course);

              if (eligibleForAny) {
                canVoteInActiveElection = true;
                activeElectionEligibility = `${profile.course} Course`;
              } else {
                canVoteInActiveElection = false;
                // show which courses the active elections accept (comma separated)
                const unique = Array.from(new Set(activeElectionsData.map((e: any) => e.eligible_voters)));
                activeElectionEligibility = `Not eligible (${unique.join(', ')} only)`;
              }
            }
          }
        }
      }

      // Get next upcoming election
      const { data: upcomingElections } = await supabase
        .from('elections')
        .select('start_date')
        .eq('status', 'Upcoming')
        .order('start_date', { ascending: true })
        .limit(1);

      setStats({
        activeElections: activeElections || 0,
        totalVotes: totalVotes || 0,
        userVotedInActive,
        nextElectionDate: upcomingElections?.[0]?.start_date,
        canVoteInActiveElection,
        activeElectionEligibility
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        <CardContent className="p-6 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-4 lg:space-y-6">
              <div className="space-y-3 lg:space-y-4">
                <h2 className="text-2xl lg:text-4xl font-bold text-foreground leading-tight">
                  Welcome to your dashboard
                </h2>
                <p className="text-muted-foreground text-base lg:text-xl leading-relaxed max-w-2xl">
                  Evotar ensures your electoral journey is secure, accessible, and transparent. Your voice matters.
                </p>
              </div>
              
              {/* Action Buttons for Staff/Admin */}
              <div className="flex flex-wrap gap-3">
                {(isStaff || isAdmin) && (
                  <>
                    <CreateElectionForm />
                    <AddCandidateForm />
                  </>
                )}
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg"
                      variant="outline"
                      className="px-6 lg:px-8 py-3 lg:py-4 text-base lg:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                      <span className="hidden sm:inline">Learn How It Works</span>
                      <span className="sm:hidden">Learn More</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-center mb-4">
                        How to Use Evotar - Voter Guide
                      </DialogTitle>
                      <DialogDescription className="text-center text-muted-foreground">
                        Everything you need to know about voting, viewing candidates, checking results, and managing your settings.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 mt-6">
                      {/* How to Vote */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Vote className="h-5 w-5 text-primary" />
                            How to Vote
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                            <p>Navigate to the <strong>Elections</strong> tab to see all available elections</p>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                            <p>Check the <Badge variant="success">Active</Badge> election if you are eligible to vote</p>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                             <p>Before you <Badge variant="default">Cast Vote</Badge> make sure to view the candidates</p>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                            <p>Review all candidates and their information carefully</p>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
                            <p>Select your preferred candidate and click the <Badge variant="default">Submit My Votes</Badge></p>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</div>
                            <p>Click <Badge variant="default">Submit My Votes</Badge>  to review your selected candidates</p>
                          </div>                     
                          
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">7</div>
                            <p>Review your selected candidates and either <Badge variant="outline">Change Selection</Badge> or <Badge variant="default">Confirm & Submit</Badge></p>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">8</div>
                            <p>To submit your vote, click <Badge variant="default">Confirm & Submit</Badge>, and a success message with a receipt will appear</p>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">9</div>
                            <p>Your vote is securely recorded and cannot be changed after you confirm & submit</p>
                          </div>
                          
                        </CardContent>
                      </Card>

                      {/* How to Check Candidates */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-primary" />
                            How to Check Candidates
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                            <p>Go to the <strong>Candidates</strong> tab to browse all candidates</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                            <p>Use filters to sort by election or search for specific candidates</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                            <p>Click on any candidate card to view their detailed biography and platform</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                            <p>Compare candidates before making your voting decision</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* How to See Results */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            How to See Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                            <p>Visit the <strong>Results</strong> tab to view election outcomes</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                            <p>Results are only visible for <Badge variant="secondary">Completed</Badge> elections when published by administrators</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                            <p>View detailed vote counts, percentages, and winning candidates</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                            <p>You can also view the result analytics</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                            <p>Results include transparent vote tallies ensuring electoral integrity</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* How Settings Work */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Settings className="h-5 w-5 text-primary" />
                            How Settings Work
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                            <p>Access <strong>Settings</strong> to manage your profile and preferences</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                            <p>Update your email address, year level, and security settings</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                            <p>Updating your email address and year level requires staff approval</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                            <p>View your recent activity</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Security Note */}
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <CheckSquare className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-primary mb-2">Security & Privacy</h4>
                              <p className="text-sm text-muted-foreground">
                                Your votes are strictly anonymous. Your identity is verified but never linked to your specific vote choices. 
                                The system ensures complete electoral integrity while protecting your privacy.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {/* Modern Illustration */}
            <div className="hidden lg:flex items-center justify-center flex-shrink-0">
              <div className="relative">
                <div className="w-72 h-56 bg-gradient-to-br from-primary/10 via-primary/20 to-primary/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-primary/20">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl">
                      <CheckSquare className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-primary">VOTE</div>
                    <div className="text-sm text-muted-foreground mt-2">Secure & Transparent</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Active Elections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activeElections}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Voting Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {canVote ? (
                stats.activeElections > 0 ? (
                  <Badge variant={stats.userVotedInActive ? "success" : "destructive"}>
                    {stats.userVotedInActive ? "Already Voted" : "Not Voted Yet"}
                  </Badge>
                ) : (
                  <Badge variant="outline">No Active Election</Badge>
                )
              ) : (
                <Badge variant="outline">
                  {isStaff ? "Staff - Cannot Vote" : isAdmin ? "Admin - Cannot Vote" : "Observer"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Status in active elections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Election Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {canVote ? (
                stats.activeElections > 0 ? (
                  // ❗ UPDATED: changed variant "success" -> "default" to match typical shadcn variants
                  <Badge variant={stats.canVoteInActiveElection ? "success" : "destructive"}>
                    {stats.canVoteInActiveElection ? "Eligible to Vote" : "Not Eligible"}
                  </Badge>
                ) : (
                  <Badge variant="outline">No Active Election</Badge>
                )
              ) : (
                <Badge variant="outline">
                  {isStaff ? "Staff Role" : isAdmin ? "Admin Role" : "Observer"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeElectionEligibility || "Course eligibility status"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next Election
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.nextElectionDate ? (
                <span className="font-medium">
                  {formatDate(stats.nextElectionDate)}
                </span>
              ) : (
                <span className="text-muted-foreground">None scheduled</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Upcoming events</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Card */}
      <Card className="border border-border/50 shadow-lg">
        <CardContent className="text-center py-16">
          <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center">
            {stats.activeElections > 0 ? (
              <Vote className="w-10 h-10 text-primary" />
            ) : (
              <CheckSquare className="w-10 h-10 text-primary" />
            )}
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            {stats.activeElections > 0 
              ? `${stats.activeElections} active election${stats.activeElections > 1 ? 's' : ''}`
              : 'No active elections'
            }
          </h3>
          <p className="text-muted-foreground text-lg">
            {stats.activeElections > 0 
              ? 'Make your voice heard by participating in voting'
              : 'Check back later for upcoming elections'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
