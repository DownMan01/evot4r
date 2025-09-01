import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Smartphone, AlertTriangle } from 'lucide-react';
import { usePanelAccessControl } from '@/hooks/usePanelAccessControl';

interface PanelAccessGuardProps {
  children: ReactNode;
  panelName: string;
}

export const PanelAccessGuard = ({ children, panelName }: PanelAccessGuardProps) => {
  const { isPanelAccessDenied, canAccessPanels } = usePanelAccessControl();

  if (!isPanelAccessDenied && canAccessPanels) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-warning/20 bg-warning/5">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 p-3 rounded-full bg-warning/10">
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl text-foreground">
            Desktop Access Required
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Administrative Interface Restriction
          </p>
        </CardHeader>

        <CardContent className="space-y-6 text-left">
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              The{' '}
              <span className="font-semibold text-foreground">{panelName}</span>{' '}
              is restricted to desktop devices to ensure secure and efficient
              administrative operations. This restriction is implemented for the
              following critical reasons:
            </p>
          </div>

          <div className="flex items-center justify-center space-x-6 py-4 bg-muted/10 rounded-lg">
            <div className="flex flex-col items-center space-y-2">
              <Smartphone className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                Current Device
              </span>
              <span className="text-xs text-destructive">Restricted</span>
            </div>
            <div className="text-muted-foreground text-xl">→</div>
            <div className="flex flex-col items-center space-y-2">
              <Monitor className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-primary">
                Desktop Required
              </span>
              <span className="text-xs text-green-600">Full Access</span>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <p className="mb-3 font-medium text-foreground text-sm">
              Alternative Access Options:
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  Elections and results viewing
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  Candidate information and profiles
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  User account settings
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-muted/40">
              <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> For security reasons, this panel can only be accessed
               using a desktop or laptop computer. Please switch to continue with administrative tasks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
