import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Settings, Users, Vote, BarChart3, Clock, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CreateElectionForm } from '@/components/CreateElectionForm';
import { AddCandidateForm } from '@/components/AddCandidateForm';

interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  totalElections: number;
  activeElections: number;
  pendingActions: number;
  totalVotes: number;
  activeElectionVotes: number;
}

export const AdminOverview = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingUsers: 0,
    totalElections: 0,
    activeElections: 0,
    pendingActions: 0,
    totalVotes: 0,
    activeElectionVotes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get pending users
      const { count: pendingUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('registration_status', 'Pending');

      // Get total elections
      const { count: totalElections } = await supabase
        .from('elections')
        .select('*', { count: 'exact', head: true });

      // Get active elections
      const { count: activeElections } = await supabase
        .from('elections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');

      // Get pending actions
      const { count: pendingActions } = await supabase
        .from('pending_actions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      // Get total votes
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      // Get votes for active elections only
      const activeElectionsForVotes = await supabase
        .from('elections')
        .select('id')
        .eq('status', 'Active');
      
      const activeElectionIds = activeElectionsForVotes.data?.map(e => e.id) || [];
      
      let activeElectionVotes = 0;
      if (activeElectionIds.length > 0) {
        const { count: voteCount } = await supabase
          .from('voting_sessions')
          .select('*', { count: 'exact', head: true })
          .in('election_id', activeElectionIds)
          .eq('has_voted', true); 
        activeElectionVotes = voteCount || 0;
      }

      setStats({
        totalUsers: totalUsers || 0,
        pendingUsers: pendingUsers || 0,
        totalElections: totalElections || 0,
        activeElections: activeElections || 0,
        pendingActions: pendingActions || 0,
        totalVotes: totalVotes || 0,
        activeElectionVotes
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-2">
      {/* Welcome Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        <CardContent className="p-6 md:p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-4 md:space-y-6">
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  Administrator Dashboard
                </h2>
                <p className="text-muted-foreground text-base md:text-lg lg:text-xl leading-relaxed max-w-2xl">
                  Complete platform oversight with advanced security controls and comprehensive election management tools.
                </p>
              </div>
              
              {/* Management Actions */}
              <div className="flex flex-wrap gap-3">
                   <div className="hidden md:flex gap-3">
                          <CreateElectionForm />
                          <AddCandidateForm />
                   </div>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const searchParams = new URLSearchParams(window.location.search);
                          searchParams.set('tab', 'admin-panel');
                          window.history.pushState({}, '', `${window.location.pathname}?${searchParams}`);
                          window.location.reload();
                        }}
                        className="flex items-center gap-2"
                      >
                  <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Admin Panel
                </Button>
              </div>
            </div>
            
            {/* Modern Illustration - Hidden on mobile */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <div className="w-80 h-64 bg-gradient-to-br from-primary/10 via-primary/20 to-primary/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-primary/20">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl">
                      <Shield className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-primary">ADMIN</div>
                    <div className="text-sm text-muted-foreground mt-2">Secure Control</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
               <Users className="h-4 w-4 text-primary" />
               Users
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-primary">{loading ? '...' : stats.totalUsers}</div>
             <p className="text-xs text-muted-foreground">Total registered</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <span className="sm:hidden">Pending</span>
              <span className="hidden sm:inline">Pending Users</span>
              </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-warning">{loading ? '...' : stats.pendingUsers}</div>
             <Badge variant={stats.pendingUsers > 0 ? "destructive" : "secondary"} className="text-xs mt-1">
               {stats.pendingUsers > 0 ? "Review Needed" : "All Clear"}
             </Badge>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
               <Vote className="h-4 w-4 text-success" />
               Elections
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-success">{loading ? '...' : stats.totalElections}</div>
             <p className="text-xs text-muted-foreground">Total created</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-success" />
              <span className="sm:hidden">Active</span>
              <span className="hidden sm:inline">Active Election</span>
              </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-success">{loading ? '...' : stats.activeElections}</div>
             <p className="text-xs text-muted-foreground">Currently running</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium flex items-center gap-2">
               <UserCheck className="h-4 w-4 text-accent-foreground" />
               Staff Reqs
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-accent-foreground">{loading ? '...' : stats.pendingActions}</div>
             <Badge variant={stats.pendingActions > 0 ? "destructive" : "secondary"} className="text-xs mt-1">
               {stats.pendingActions > 0 ? "Pending" : "None"}
             </Badge>
           </CardContent>
         </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Vote className="h-4 w-4 text-info" />
                Votes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">{loading ? '...' : stats.activeElectionVotes}</div>
              <p className="text-xs text-muted-foreground">In active elections</p>
            </CardContent>
          </Card>
      </div>

      {/* System Status Card */}
      <Card className="border border-border/50 shadow-lg">
        <CardContent className="text-center py-8 md:py-12 lg:py-16 px-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-success/10 rounded-full mx-auto mb-4 md:mb-6 flex items-center justify-center">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-success" />
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2 md:mb-3">
            {(stats.pendingUsers + stats.pendingActions) > 0 
              ? `${stats.pendingUsers + stats.pendingActions} item${(stats.pendingUsers + stats.pendingActions) > 1 ? 's' : ''} need${(stats.pendingUsers + stats.pendingActions) === 1 ? 's' : ''} attention`
              : 'All systems operational'
            }
          </h3>
          <p className="text-muted-foreground text-base md:text-lg">
            {(stats.pendingUsers + stats.pendingActions) > 0 
              ? 'Check the Admin Panel for pending approvals and staff requests'
              : 'Platform is secure and running smoothly'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
