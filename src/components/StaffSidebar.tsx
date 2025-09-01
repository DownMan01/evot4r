import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Vote, 
  Users, 
  TrendingUp, 
  Settings as SettingsIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'elections', label: 'Elections', icon: Vote },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'results', label: 'Results', icon: TrendingUp },
  { id: 'staff-panel', label: 'Staff Panel', icon: Users },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const StaffSidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const { profile } = useAuth();

  return (
    <div className="w-64 bg-card/80 backdrop-blur-xl border-r border-border/50 h-screen flex flex-col shadow-xl">
      {/* Modern Logo Section */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-sm">E</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">evotar</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Staff Panel</p>
          </div>
        </div>
      </div>

      {/* Modern Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group text-sm",
                isActive 
                  ? "bg-gradient-primary text-primary-foreground shadow-lg scale-[1.02]" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:scale-[1.01]"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 transition-all duration-200",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary-foreground rounded-full opacity-80"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/30">
        <div className="text-xs text-muted-foreground text-center">
          <p>Staff Access</p>
          <p className="mt-1">© 2025 Evotar</p>
        </div>
      </div>
    </div>
  );
};