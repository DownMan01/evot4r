import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOptimizedElections } from '@/hooks/useOptimizedElections';
import { usePermissions } from '@/hooks/usePermissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Users, BarChart3, CheckCircle } from 'lucide-react';
import { calculateProgressPhilippine, formatPhilippineDateTime } from '@/utils/dateUtils';

export const ElectionProgressPanel = () => {
  const { elections, loading } = useOptimizedElections({ limit: 50, refetchInterval: 30000 });
  const { canViewVotingProgress } = usePermissions();

  if (!canViewVotingProgress) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <BarChart3 className="h-4 w-4 text-green-600" />;
      case 'Upcoming':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'Upcoming':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
      case 'Completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    return calculateProgressPhilippine(startDate, endDate) * 100;
  };

  const formatDate = (dateString: string) => {
    return formatPhilippineDateTime(dateString, 'MMM dd, h:mm a');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Election Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : elections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No elections found.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {elections.slice(0, 8).map((election) => {
              const progress = calculateProgress(election.start_date, election.end_date);
              
              return (
                <div key={election.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(election.status)}
                      <h4 className="font-medium truncate">{election.title}</h4>
                    </div>
                    {getStatusBadge(election.status)}
                  </div>

                  {election.status === 'Active' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Start
                      </p>
                      <p className="font-medium">{formatDate(election.start_date)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        End
                      </p>
                      <p className="font-medium">{formatDate(election.end_date)}</p>
                    </div>
                  </div>

                  {election.eligible_voters && election.eligible_voters !== 'All Courses' && (
                    <div className="text-sm">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Eligible Voters
                      </p>
                      <p className="font-medium">{election.eligible_voters}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};