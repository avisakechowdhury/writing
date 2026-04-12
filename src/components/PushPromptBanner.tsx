import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';
import { isWebPushClientConfigured } from '../config/push';

/** After a successful push subscribe, hide the banner permanently on this device. */
const STORAGE_PUSH_OK = 'writeanon_push_subscribed_ok';
/** Hide for this browser tab session only (user can see banner again next visit). */
const SESSION_DISMISS = 'writeanon_push_banner_dismiss_session';

const PushPromptBanner: React.FC = () => {
  const { user } = useAuth();
  const { isSupported, permission, requestPermission, subscribe } = useNotifications();
  const [sessionDismissed, setSessionDismissed] = useState(
    () => sessionStorage.getItem(SESSION_DISMISS) === '1'
  );
  const [permanentOk, setPermanentOk] = useState(
    () => localStorage.getItem(STORAGE_PUSH_OK) === '1'
  );
  const [busy, setBusy] = useState(false);

  const pushConfigured = isWebPushClientConfigured();

  useEffect(() => {
    setSessionDismissed(sessionStorage.getItem(SESSION_DISMISS) === '1');
    setPermanentOk(localStorage.getItem(STORAGE_PUSH_OK) === '1');
  }, []);

  if (!user || !isSupported || !pushConfigured || permanentOk || sessionDismissed) {
    return null;
  }

  if (permission === 'denied') {
    return null;
  }

  const handleEnable = async () => {
    setBusy(true);
    try {
      const permOk = permission === 'granted' ? true : await requestPermission({ quiet: true });
      if (!permOk) {
        toast.error('Notification permission is required for browser push.');
        return;
      }

      const subOk = await subscribe({ quiet: true });
      if (subOk) {
        localStorage.setItem(STORAGE_PUSH_OK, '1');
        setPermanentOk(true);
        toast.success('You will get likes, comments, and Time to Write alerts even when WriteAnon is closed.');
      } else {
        toast.error(
          'Could not finish push setup. Check your connection, or confirm VITE_VAPID_PUBLIC_KEY is set in the live site build.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <Bell className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-neutral-900 text-sm">Get browser reminders</p>
          <p className="text-sm text-neutral-600 mt-0.5">
            Likes, comments, and &quot;Time to Write&quot; nudges can appear when Chrome is closed or you&apos;re on another tab — after you enable below.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem(SESSION_DISMISS, '1');
            setSessionDismissed(true);
          }}
          className="p-2 text-neutral-500 hover:bg-white/80 rounded-lg"
          aria-label="Dismiss for this visit"
          title="Hide until next visit"
        >
          <X className="w-5 h-5" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleEnable()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Enable'}
        </button>
      </div>
    </div>
  );
};

export default PushPromptBanner;
