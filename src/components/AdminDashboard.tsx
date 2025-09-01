import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DashboardContentSkeleton } from '@/components/UnifiedLoadingSkeleton';

export const AdminDashboard = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <DashboardContentSkeleton variant="admin" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administrator Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            System Settings
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            Manage Users
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Elections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Good</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Voters</span>
                <span className="text-sm font-medium">1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Staff Members</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Administrators</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <Button variant="outline" className="w-full">
                View All Users
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Database Status</span>
                <span className="text-sm font-medium text-success">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Authentication</span>
                <span className="text-sm font-medium text-success">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Backup Status</span>
                <span className="text-sm font-medium text-success">Up to date</span>
              </div>
              <Button variant="outline" className="w-full">
                System Diagnostics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrative Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" disabled>
              User Roles
            </Button>
            <Button variant="outline" disabled>
              Election Oversight
            </Button>
            <Button variant="outline" disabled>
              System Logs
            </Button>
            <Button variant="outline" disabled>
              Backup & Restore
            </Button>
            <Button variant="outline" disabled>
              Security Settings
            </Button>
            <Button variant="outline" disabled>
              Audit Trail
            </Button>
            <Button variant="outline" disabled>
              Platform Settings
            </Button>
            <Button variant="outline" disabled>
              API Management
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};