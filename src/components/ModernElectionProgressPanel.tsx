import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useOptimizedElections } from '@/hooks/useOptimizedElections';
import { usePermissions } from '@/hooks/usePermissions';
import { ListViewSkeleton } from '@/components/UnifiedLoadingSkeleton';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Calendar, Clock, Users, BarChart3, CheckCircle, Eye, Vote } from 'lucide-react';
import { SecureImage } from '@/components/ui/SecureImage';

interface ModernElectionProgressPanelProps {
  searchTerm: string;
  statusFilter: string;
}

export const ModernElectionProgressPanel = ({
  searchTerm,
  statusFilter
}: ModernElectionProgressPanelProps) => {
  const { elections, loading, refetch } = useOptimizedElections({ limit: 50, refetchInterval: 30000 });
  const { canViewVotingProgress } = usePermissions();
  const [selectedElection, setSelectedElection] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  if (!canViewVotingProgress) {
    return null;
  }

  // Filter elections based on search and status
  const filteredElections = elections.filter(election => {
    const matchesSearch = !searchTerm || 
      election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || election.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <BarChart3 className="h-4 w-4 text-success" />;
      case 'Upcoming':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'Upcoming':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Upcoming</Badge>;
      case 'Completed':
        return <Badge className="bg-muted/50 text-muted-foreground border-muted">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / totalDuration) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openDetailsDialog = (election: any) => {
    setSelectedElection(election);
    setShowDetailsDialog(true);
  };

  const activeElections = filteredElections.filter(e => e.status === 'Active').length;
  const upcomingElections = filteredElections.filter(e => e.status === 'Upcoming').length;

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Election Progress
              <div className="flex gap-2 ml-2">
                {activeElections > 0 && (
                  <Badge className="bg-success/10 text-success border-success/20 text-xs">
                    {activeElections} Active
                  </Badge>
                )}
                {upcomingElections > 0 && (
                  <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">
                    {upcomingElections} Upcoming
                  </Badge>
                )}
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredElections.length} of {elections.length} elections
              </span>
              <RefreshButton 
                onClick={refetch}
                loading={loading}
                size="sm"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <ListViewSkeleton />
          ) : filteredElections.length === 0 ? (
            <div className="text-center py-12">
              <Vote className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No elections found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'All'
                  ? 'Try adjusting your filters to see more results.' 
                  : 'No elections have been created yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredElections.map((election) => {
                const progress = calculateProgress(election.start_date, election.end_date);
                
                return (
                  <Card key={election.id} className="border-border/30 hover:border-border transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(election.status)}
                              <h4 className="font-semibold text-lg line-clamp-1">{election.title}</h4>
                            </div>
                            {getStatusBadge(election.status)}
                          </div>

                          {election.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {election.description}
                            </p>
                          )}

                          {election.status === 'Active' && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">Progress</span>
                                <span className="text-muted-foreground">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2 bg-muted" />
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Start Date
                              </p>
                              <p className="font-medium">{formatDateShort(election.start_date)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                End Date
                              </p>
                              <p className="font-medium">{formatDateShort(election.end_date)}</p>
                            </div>
                            {election.eligible_voters && election.eligible_voters !== 'All Courses' && (
                              <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Eligible Voters
                                </p>
                                <p className="font-medium text-xs">{election.eligible_voters}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-auto w-full">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openDetailsDialog(election)}
                            className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/50"
                          >
                            <Eye className="h-4 w-4" />
                            More Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Election Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedElection && (
            <div className="space-y-6">
              {/* Election Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedElection.title}</CardTitle>
                    {getStatusBadge(selectedElection.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedElection.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-muted-foreground mt-1">{selectedElection.description}</p>
                    </div>
                  )}

                  {selectedElection.cover_image_url && (
                    <div>
                      <span className="font-medium">Cover Image:</span>
                      <div className="mt-2">
                        
                        {/*  <img 
                          src={selectedElection.cover_image_url} 
                          alt="Election cover" 
                          className="w-full max-w-md h-32 object-cover rounded-lg border"
                        />*/}

                  <SecureImage 
                    bucket="election-covers"
                    path={selectedElection.cover_image_url}
                    alt="Election Cover"
                    className="w-full max-w-md h-32 object-cover rounded-lg border"
                    showError={true}
                    fallback={null}
                  />

                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Start Date:</span>
                      <p className="text-muted-foreground">{formatDate(selectedElection.start_date)}</p>
                    </div>
                    <div>
                      <span className="font-medium">End Date:</span>
                      <p className="text-muted-foreground">{formatDate(selectedElection.end_date)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Eligible Voters:</span>
                      <p className="text-muted-foreground">{selectedElection.eligible_voters || 'All Courses'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Show Results to Voters:</span>
                      <p className="text-muted-foreground">{selectedElection.show_results_to_voters ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Information */}
              {selectedElection.status === 'Active' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Election Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Time Progress</span>
                        <span className="text-muted-foreground">
                          {calculateProgress(selectedElection.start_date, selectedElection.end_date)}%
                        </span>
                      </div>
                      <Progress 
                        value={calculateProgress(selectedElection.start_date, selectedElection.end_date)} 
                        className="h-3" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Time Remaining:</span>
                        <p className="text-muted-foreground">
                          {(() => {
                            const now = new Date();
                            const end = new Date(selectedElection.end_date);
                            const diff = end.getTime() - now.getTime();
                            
                            if (diff <= 0) return 'Election ended';
                            
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            
                            if (days > 0) return `${days} days, ${hours} hours`;
                            return `${hours} hours`;
                          })()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p className="text-muted-foreground">
                          {(() => {
                            const start = new Date(selectedElection.start_date);
                            const end = new Date(selectedElection.end_date);
                            const diff = end.getTime() - start.getTime();
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            
                            if (days > 0) return `${days} days, ${hours} hours`;
                            return `${hours} hours`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Created:</span>
                      <p className="text-muted-foreground">{formatDate(selectedElection.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <p className="text-muted-foreground">{formatDate(selectedElection.updated_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
