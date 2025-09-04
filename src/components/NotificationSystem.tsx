import { useState } from 'react';
import {
  Bell, X, Check, Clock, AlertCircle, Vote, Users, UserCheck,
  Settings, TrendingUp, Trash2
} from 'lucide-react';
import { formatTimeAgoPhilippine, formatPhilippineDateTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export const NotificationSystem = () => {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotifications();
  const isMobile = useIsMobile();

  const getNotificationIcon = (type: string) => {
    const iconProps = "h-4 w-4";
    const iconMap: Record<string, JSX.Element> = {
      election_upcoming: <Clock className={`${iconProps} text-amber-600`} />,
      election_active: <Vote className={`${iconProps} text-blue-600`} />,
      election_approved: <Check className={`${iconProps} text-green-600`} />,
      election_rejected: <X className={`${iconProps} text-red-600`} />,
      voter_registration: <UserCheck className={`${iconProps} text-purple-600`} />,
      profile_update_request: <Settings className={`${iconProps} text-indigo-600`} />,
      admin_task: <AlertCircle className={`${iconProps} text-orange-600`} />,
      results_published: <TrendingUp className={`${iconProps} text-emerald-600`} />,
      candidate_added: <Users className={`${iconProps} text-cyan-600`} />,
    };
    return iconMap[type] || <AlertCircle className={`${iconProps} text-gray-600`} />;
  };

  const getPriorityStyles = (priority: string) => {
    const styles: Record<string, string> = {
      high: 'border-l-4 border-l-red-500',
      medium: 'border-l-4 border-l-amber-500',
      low: 'border-l-4 border-l-blue-500'
    };
    return styles[priority] || styles.low;
  };

  // Build message with Philippine time when possible
  const buildNotificationMessage = (n: any) => {
    try {
      if (n?.type === 'election_upcoming' && n?.data?.start_date) {
        const startLocal = formatPhilippineDateTime(n.data.start_date, 'MMM dd, yyyy h:mm a');
        const title = n?.data?.election_title || n?.title || 'the election';
        return `The election "${title}" is scheduled to begin on ${startLocal} PHT. Please review the positions and candidates in advance.`;
      }
      return n?.message ?? '';
    } catch {
      return n?.message ?? '';
    }
  };

  // Debug function to test clicks
  const handleTestClick = () => {
    console.log('Notification button clicked!', { open, unreadCount });
    setOpen(!open);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAll();
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  // Unified dropdown implementation for both mobile and desktop
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 md:h-10 md:w-10 rounded-full hover:bg-accent/50 transition-colors touch-manipulation p-0 min-h-0"
          type="button">
         <Bell
          className={cn(
          "h-5 w-5 md:h-6 md:w-6 transition-all duration-200",
          unreadCount > 0 && "animate-pulse text-primary"
          )}/>
          {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs min-w-[20px] animate-in zoom-in-50"
            >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
            )}
          {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full pointer-events-none" aria-hidden>
          <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={8}
        side={isMobile ? "bottom" : "bottom"}
        className={cn(
          "z-[100] shadow-xl border border-border/50 bg-background backdrop-blur-md",
          isMobile ? "w-[95vw] max-w-sm" : "w-96"
        )}
      >
        <div className={cn(
          "flex flex-col",
          isMobile ? "h-[80vh] max-h-[500px]" : "h-[500px]"
        )}>
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-3 md:p-4 pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base md:text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4 md:h-5 md:w-5" />
                  Notifications
                </div>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs px-2 py-1 h-6 touch-manipulation"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs px-2 py-1 h-6 touch-manipulation"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="p-3 md:p-4 pt-3">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary mx-auto mb-2"></div>
                    <p className="text-sm">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
                    <Bell className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium mb-1">No notifications</p>
                    <p className="text-xs">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "cursor-pointer hover:bg-accent/30 transition-colors relative touch-manipulation p-3",
                          !notification.read && "bg-primary/5",
                          getPriorityStyles(notification.priority)
                        )}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium leading-tight text-foreground text-sm">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                              {buildNotificationMessage(notification)}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgoPhilippine(notification.created_at)}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs px-2 py-0 h-5",
                                  notification.priority === 'high'
                                    ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950/30'
                                    : notification.priority === 'medium'
                                    ? 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950/30'
                                    : 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950/30'
                                )}
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer - Fixed */}
          {notifications.length > 0 && (
            <div className="flex-shrink-0 border-t border-border/50 pt-3 mt-3 px-3 md:px-4 pb-3 safe-area-bottom">
              <p className="text-xs text-center text-muted-foreground">
                Showing {notifications.length} of {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
