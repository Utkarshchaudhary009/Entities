"use client";

import { useEffect } from "react";
import { NotificationToggle } from "@/components/profile/notification-toggle";
import { BackButton } from "@/components/ui/back-button";
import { useUserPreferenceStore } from "@/stores/user-preference.store";

export default function NotificationsPage() {
  const {
    preferences,
    isLoading,
    savingField,
    fetchPreferences,
    updatePreference,
  } = useUserPreferenceStore();

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return (
    <div className="flex flex-col h-full bg-card min-h-[500px]">
      <div className="flex items-center p-4 border-b">
        <BackButton fallbackHref="/profile" />
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
      </div>

      <div className="p-4 px-6 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Communication Channels
        </h3>

        <NotificationToggle
          id="notifyPush"
          label="Push Notifications"
          description="Receive order updates and offers on your device."
          checked={preferences?.notifyPush ?? false}
          onChange={(v) => updatePreference("notifyPush", v)}
          isLoading={isLoading || savingField === "notifyPush"}
        />

        <NotificationToggle
          id="notifyEmail"
          label="Email Notifications"
          description="Get emails for order confirmations and marketing."
          checked={preferences?.notifyEmail ?? false}
          onChange={(v) => updatePreference("notifyEmail", v)}
          isLoading={isLoading || savingField === "notifyEmail"}
        />

        <NotificationToggle
          id="notifySms"
          label="SMS Notifications"
          description="Get text messages for delivery tracking."
          checked={preferences?.notifySms ?? false}
          onChange={(v) => updatePreference("notifySms", v)}
          isLoading={isLoading || savingField === "notifySms"}
        />

        <NotificationToggle
          id="notifyInApp"
          label="In-App Notifications"
          description="Show notification badges within the app."
          checked={preferences?.notifyInApp ?? false}
          onChange={(v) => updatePreference("notifyInApp", v)}
          isLoading={isLoading || savingField === "notifyInApp"}
        />
      </div>
    </div>
  );
}
