
import { PanelAccessGuard } from '@/components/PanelAccessGuard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfileUpdateRequests } from '@/hooks/useProfileUpdateRequests';
import { ProfileUpdateRequestsPanel } from '@/components/ProfileUpdateRequestsPanel';
import { Users, Settings } from 'lucide-react';

export const StaffPanel = () => {
  const { canApproveVoters } = usePermissions();
  const { requests: profileUpdateRequests } = useProfileUpdateRequests();

  if (!canApproveVoters) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to access the staff panel.</p>
        </CardContent>
      </Card>
    );
  }

  const pendingProfileRequests = profileUpdateRequests.filter(r => r.status === 'Pending').length;

  return (
    <PanelAccessGuard panelName="Staff Panel">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Staff Panel</h2>
            {pendingProfileRequests > 0 && (
              <Badge variant="destructive" className="px-3 py-1">
                {pendingProfileRequests} Profile Requests Pending
              </Badge>
            )}
          </div>
        </div>

      {/* Staff Panel - Profile Updates Only */}
      <Tabs defaultValue="profile-updates" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="profile-updates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Profile Update Requests
            {pendingProfileRequests > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {pendingProfileRequests}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile-updates" className="space-y-4">
          <ProfileUpdateRequestsPanel />
        </TabsContent>
      </Tabs>
    </div>
    </PanelAccessGuard>
  );
};