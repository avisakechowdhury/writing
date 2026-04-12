import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'writeanon_push_prompt_dismissed';

const PushPromptBanner: React.FC = () => {
  const { user } = useAuth();
  const { isSupported, permission, requestPermission, subscribe } = useNotifications();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  if (!user || !isSupported || dismissed) {
    return null;
  }

  if (permission === 'denied') {
    return null;
  }

  const handleEnable = async () => {
    setBusy(true);
    try {
      const ok = permission === 'granted' ? true : await requestPermission();
      if (ok) {
        await subscribe();
        localStorage.setItem(STORAGE_KEY, '1');
        setDismissed(true);
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
            Turn on notifications for writing streaks, likes, and comments — even when WriteAnon is closed.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1');
            setDismissed(true);
          }}
          className="p-2 text-neutral-500 hover:bg-white/80 rounded-lg"
          aria-label="Dismiss"
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
