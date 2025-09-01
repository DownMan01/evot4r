import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Elections } from '@/components/Elections';
import { Candidates } from '@/components/Candidates';
import { Results } from '@/components/Results';
import { Settings } from '@/components/Settings';
import { Vote, Users, TrendingUp, SettingsIcon } from 'lucide-react';
import { MobileContentWrapper } from '@/components/ResponsiveLayout';

export const VoterDashboard = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('elections');

  return (
    <MobileContentWrapper>
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Voter Dashboard</h1>
            <p className="text-sm lg:text-base text-muted-foreground">Welcome back, {profile?.full_name}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tabs */}
          <TabsList className="hidden lg:grid w-full grid-cols-4">
            <TabsTrigger value="elections" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              <span>Elections</span>
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Candidates</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Results</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile welcome message */}
          {isMobile && (
            <div className="lg:hidden bg-gradient-primary/10 rounded-lg p-4 mb-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-primary mb-2">Welcome to Evotar</h2>
                <p className="text-sm text-muted-foreground">
                  Navigate using the menu below to access elections, candidates, results, and settings.
                </p>
              </div>
            </div>
          )}

          <TabsContent value="elections" className="mt-4 lg:mt-6 focus:outline-none">
            <Elections />
          </TabsContent>

          <TabsContent value="candidates" className="mt-4 lg:mt-6 focus:outline-none">
            <Candidates />
          </TabsContent>

          <TabsContent value="results" className="mt-4 lg:mt-6 focus:outline-none">
            <Results />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 lg:mt-6 focus:outline-none">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </MobileContentWrapper>
  );
};