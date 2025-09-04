import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, LogIn, LogOut, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeAgoPhilippine, formatPhilippineDateTime } from '@/utils/dateUtils';

interface VoterActivity {
  id: string;
  timestamp: string;
  action: 'login' | 'logout';
  actor_name?: string;
  actor_username?: string;
  msg: string;
}

export const RecentVoterActivityPanel = () => {
  const [activities, setActivities] = useState<VoterActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { canViewVoterActivity } = usePermissions();

  useEffect(() => {
    if (!canViewVoterActivity) return;

    const fetchVoterActivity = async () => {
      try {
        setLoading(true);
        
        // Get all voter activities from audit_logs including login/logout and other voter activities
        const { data: auditData, error: auditError } = await supabase
          .from('audit_logs')
          .select(`
            id,
            timestamp,
            action,
            actor_id,
            actor_role,
            details,
            resource_type
          `)
          .eq('actor_role', 'Voter')
          .in('action', ['login', 'logout', 'profile_update_request', 'submit_appeal', 'view_election', 'view_candidates'])
          .order('timestamp', { ascending: false })
          .limit(20);

        let activities: VoterActivity[] = [];

        if (auditError) {
          console.error('Error fetching audit logs:', auditError);
          // Fallback to empty array if there's an error
          activities = [];
        } else if (auditData && auditData.length > 0) {
          // Process audit data
          activities = auditData.map(log => {
            const details = log.details as any;
            return {
              id: log.id,
              timestamp: log.timestamp,
              action: log.action as 'login' | 'logout',
              actor_name: details?.actor_name || 'Voter',
              actor_username: details?.actor_username || 'Unknown',
              msg: log.action === 'login' ? 'Login' : log.action === 'logout' ? 'Logout' : log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            };
          });
        } else {
          // No audit data found
          activities = [];
        }

        setActivities(activities);
      } catch (error) {
        console.error('Error fetching voter activity:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVoterActivity();

    // Refresh every 30 seconds
    const interval = setInterval(fetchVoterActivity, 30000);
    return () => clearInterval(interval);
  }, [canViewVoterActivity]);

  if (!canViewVoterActivity) {
    return null;
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (action: string) => {
    switch (action) {
      case 'login':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Login</Badge>;
      case 'logout':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Logout</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const timeAgo = formatTimeAgoPhilippine(timestamp);
    if (timeAgo.includes('ago') || timeAgo === 'just now') {
      return timeAgo;
    }
    // For older dates, show full date with Philippine time
    return formatPhilippineDateTime(timestamp, 'MMM dd, h:mm a');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Voter Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No recent voter activity found.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {activities.slice(0, 15).map((activity) => (
              <div key={activity.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium truncate">
                        {activity.actor_name || 'Unknown User'}
                      </span>
                    </div>
                    {getActivityBadge(activity.action)}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">
                      {activity.actor_username}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};