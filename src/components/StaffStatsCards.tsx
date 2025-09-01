import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStaffStats } from "@/hooks/useStaffStats";
import { Users, Vote, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const StaffStatsCards = () => {
  const { stats, loading } = useStaffStats();

  const statCards = [
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: Clock,
      description: "Profile updates awaiting approval",
      color: "text-orange-600"
    },
    {
      title: "Total Voters",
      value: stats.totalVoters,
      icon: Users,
      description: "Approved registered voters",
      color: "text-blue-600"
    },
    {
      title: "Active Elections",
      value: stats.activeElections,
      icon: Vote,
      description: "Currently running elections",
      color: "text-green-600"
    },
    {
      title: "My Pending Actions",
      value: stats.staffPendingActions,
      icon: CheckCircle,
      description: "Your requests awaiting admin approval",
      color: "text-purple-600"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-muted-foreground truncate">
                {stat.title.replace(' ', '\n')}
              </CardTitle>
              <IconComponent className={`h-3 w-3 ${stat.color} flex-shrink-0`} />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-lg lg:text-xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};