import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | 'election_upcoming'
    | 'election_active'
    | 'election_submitted'
    | 'election_approved'
    | 'election_rejected'
    | 'voter_registration'
    | 'profile_update_request'
    | 'admin_task'
    | 'candidate_added'
    | 'results_published'
    | string;
  read: boolean;
  created_at: string;
  data?: any;
  priority: 'low' | 'medium' | 'high' | string;
  link_url?: string;
}


export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const hasFetched = useRef(false);
  const seenIds = useRef<Set<string>>(new Set());
  const lastFetchTime = useRef<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  // Keep a single channel instance to avoid rapid connect/close loops
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const addNotification = (notification: Notification) => {
    if (seenIds.current.has(notification.id)) return;

    seenIds.current.add(notification.id);
    setNotifications(prev => [notification, ...prev.slice(0, 19)]);

    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { data, error } = await supabase.rpc('mark_notification_read', { p_id: id });
      if (!error && data) {
        setNotifications(prev =>
          prev.map(notif => {
            if (notif.id === id && !notif.read) {
              setUnreadCount(count => Math.max(0, count - 1));
              return { ...notif, read: true };
            }
            return notif;
          })
        );
      }
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data, error } = await supabase.rpc('mark_all_notifications_read');
      if (!error) {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const createNotification = async (
    title: string,
    message: string,
    type: string,
    priority: string = 'low',
    recipientUserId?: string,
    targetRoles?: ('Voter' | 'Staff' | 'Administrator')[],
    data?: any,
    linkUrl?: string
  ) => {
    try {
      const { data: result, error } = await supabase.rpc('create_notification_any_role', {
        p_title: title,
        p_message: message,
        p_type: type,
        p_priority: priority,
        p_recipient_user_id: recipientUserId || null,
        p_target_roles: targetRoles || null,
        p_data: data || null,
        p_link_url: linkUrl || null
      });
      
      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    seenIds.current.clear();
  };

  const fetchInitialNotifications = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: Notification[] = (data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        created_at: n.created_at,
        data: n.data || undefined,
        priority: (n.priority || 'low') as any,
        link_url: n.link_url || undefined,
        read: Boolean(n.read_at),
      }));

      // Track seen ids and unread count
      seenIds.current = new Set(mapped.map(n => n.id));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
      
      // Update last fetch time for polling
      if (mapped.length > 0) {
        lastFetchTime.current = mapped[0].created_at;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch only new notifications since last fetch
  const fetchNewNotifications = useCallback(async () => {
    if (!user || !profile || !lastFetchTime.current) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .gt('created_at', lastFetchTime.current)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Notification[] = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          created_at: n.created_at,
          data: n.data || undefined,
          priority: (n.priority || 'low') as any,
          link_url: n.link_url || undefined,
          read: Boolean(n.read_at),
        }));

        // Add new notifications and update last fetch time
        mapped.forEach(addNotification);
        lastFetchTime.current = mapped[0].created_at;
      }
    } catch (error) {
      console.error('Error fetching new notifications:', error);
    }
  }, [user, profile]);

  // Setup polling for new notifications
  const startPolling = useCallback(() => {
    if (!user || !profile) return;
    
    // Clear existing interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Poll every 30 seconds
    pollingInterval.current = setInterval(() => {
      fetchNewNotifications();
    }, 30000);
  }, [user, profile, fetchNewNotifications]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  const setupListeners = () => {
    const channels: any[] = [];
    if (!user || !profile) {
      if (channelRef.current) {
        try { supabase.removeChannel(channelRef.current); } catch {}
        channelRef.current = null;
      }
      return channels;
    }

    const channelName = `notifications`;

    // Reuse channel if already subscribed
    // @ts-ignore topic exists on realtime channel
    if (channelRef.current && (channelRef.current as any).topic === channelName) {
      channels.push(channelRef.current);
      return channels;
    }

    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        const n = payload.new as any;
        // RLS ensures we only receive allowed rows
        addNotification({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          created_at: n.created_at,
          data: n.data || undefined,
          priority: (n.priority || 'low') as any,
          link_url: n.link_url || undefined,
          read: Boolean(n.read_at),
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, payload => {
        const n = payload.new as any;
        setNotifications(prev => prev.map(p => p.id === n.id ? ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          created_at: n.created_at,
          data: n.data || undefined,
          priority: (n.priority || 'low') as any,
          link_url: n.link_url || undefined,
          read: Boolean(n.read_at),
        }) : p));
        // Adjust unread count if it became read
        if (n.read_at) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
      })
      .subscribe();

    channelRef.current = channel;
    channels.push(channel);
    return channels;
  };

  useEffect(() => {
    const channels = setupListeners();
    
    // Start polling when user is authenticated
    if (user && profile) {
      startPolling();
    }
    
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
      stopPolling();
    };
  }, [user, profile, startPolling, stopPolling]);

  useEffect(() => {
    if (user && profile && !hasFetched.current) {
      hasFetched.current = true;
      fetchInitialNotifications();
    }
  }, [user, profile]);

  return {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    refetch: fetchInitialNotifications,
    fetchNewNotifications,
    hasUnread: unreadCount > 0,
    createNotification
  };
};
