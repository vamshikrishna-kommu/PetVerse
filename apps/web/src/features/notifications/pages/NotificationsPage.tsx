import React, { useState, useEffect } from 'react';
import {
  useNotificationFeed,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  Filter,
  AlertTriangle,
  Shield,
  Info,
  Radio,
  BellRing,
  CheckCircle,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { cn } from '@/shared/utils/cn';
import { pushNotifications } from '@/shared/lib/pushNotifications';
import { toast } from 'sonner';

dayjs.extend(relativeTime);

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pushStatus, setPushStatus] = useState<string>('default');
  const [subscribing, setSubscribing] = useState(false);

  const { data: notifications, isLoading } = useNotificationFeed();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  useEffect(() => {
    if (pushNotifications.isSupported()) {
      setPushStatus(pushNotifications.getPermissionState());
    } else {
      setPushStatus('unsupported');
    }
  }, []);

  const handleEnablePush = async () => {
    setSubscribing(true);
    const res = await pushNotifications.requestPermissionAndSubscribe();
    setSubscribing(false);
    if (res.success) {
      setPushStatus('granted');
      toast.success('Push notifications enabled successfully!');
    } else {
      setPushStatus(pushNotifications.getPermissionState());
      toast.error(res.error || 'Failed to enable push notifications');
    }
  };

  const handleDisablePush = async () => {
    const ok = await pushNotifications.unsubscribe();
    if (ok) {
      setPushStatus('default');
      toast.info('Push notifications disabled');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted">Loading notifications...</div>;
  }

  const list = notifications || [];
  const filteredList = filter === 'unread' ? list.filter((n) => !n.isRead) : list;
  const unreadCount = list.filter((n) => !n.isRead).length;

  return (
    <div className="container-page max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-8 h-8 text-primary" /> Notifications
          </h1>
          <p className="text-muted text-sm mt-1">Stay informed about your pets' health, reminders, and alerts.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-2 hover:bg-surface-3 text-foreground text-xs font-semibold rounded-xl border border-border transition disabled:opacity-60"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" /> Mark all as read
          </button>
        )}
      </div>

      {/* Push Notification Banner */}
      {pushStatus !== 'unsupported' && (
        <div className="card p-4 bg-gradient-to-r from-primary/5 via-surface-2 to-surface-2 border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                Push Notifications
                {pushStatus === 'granted' ? (
                  <span className="badge bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                    Active
                  </span>
                ) : pushStatus === 'denied' ? (
                  <span className="badge bg-danger/10 text-danger border-danger/20 text-[10px]">
                    Blocked in Browser
                  </span>
                ) : (
                  <span className="badge bg-surface-3 text-muted text-[10px]">Disabled</span>
                )}
              </h4>
              <p className="text-xs text-muted mt-0.5">
                {pushStatus === 'granted'
                  ? 'You are receiving real-time alerts for vaccines, medications, and emergencies.'
                  : pushStatus === 'denied'
                  ? 'Notifications are blocked in your browser. Re-enable them in site permissions to receive alerts.'
                  : 'Enable instant browser push alerts for vital pet care schedules and emergency notices.'}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {pushStatus === 'granted' ? (
              <button
                onClick={handleDisablePush}
                className="px-3.5 py-1.5 text-xs font-medium text-muted hover:text-danger hover:bg-danger/10 border border-border rounded-xl transition"
              >
                Mute Push
              </button>
            ) : pushStatus === 'denied' ? (
              <span className="text-[11px] text-muted italic">Check browser settings</span>
            ) : (
              <button
                onClick={handleEnablePush}
                disabled={subscribing}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition disabled:opacity-60 flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                {subscribing ? 'Connecting...' : 'Enable Push Alerts'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition',
              filter === 'all'
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-surface-2 text-muted hover:text-foreground'
            )}
          >
            All ({list.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5',
              filter === 'unread'
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-surface-2 text-muted hover:text-foreground'
            )}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredList.length === 0 ? (
        <div className="card p-12 text-center border-2 border-dashed border-border">
          <Bell className="w-12 h-12 text-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No notifications found</h3>
          <p className="text-xs text-muted mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => (
            <div
              key={item._id}
              className={cn(
                'card p-4 transition-all flex items-start justify-between gap-4',
                !item.isRead ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-80'
              )}
            >
              <div className="flex gap-3.5 items-start">
                <div className="mt-1">
                  {item.priority === 'critical' || item.priority === 'emergency' ? (
                    <div className="p-2 bg-danger/10 text-danger rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (item.type as string) === 'vaccination' || (item.type as string) === 'medication' ? (
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <Shield className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-2 bg-primary/10 text-primary rounded-xl">
                      <Info className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    {item.title}
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    )}
                  </h4>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.body}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted mt-2 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {dayjs(item.createdAt).fromNow()}
                    </span>
                    <span className="capitalize badge bg-surface-2 text-foreground">
                      {item.type || 'System'}
                    </span>
                    {item.priority && (
                      <span className="capitalize badge bg-surface-2 text-muted">
                        Priority: {item.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!item.isRead && (
                <button
                  onClick={() => markReadMutation.mutate(item._id)}
                  title="Mark as read"
                  className="p-1.5 text-muted hover:text-foreground hover:bg-surface-2 rounded-lg transition shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}