"use client";

export interface UserSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  desktopNotifications: true,
  showOnlineStatus: true,
  showReadReceipts: true,
};

export function getUserSettings(userId?: string): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const key = userId ? `chatconnect_settings_${userId}` : "chatconnect_settings_global";
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
        desktopNotifications:
          typeof parsed.desktopNotifications === "boolean"
            ? parsed.desktopNotifications
            : DEFAULT_SETTINGS.desktopNotifications,
        showOnlineStatus:
          typeof parsed.showOnlineStatus === "boolean"
            ? parsed.showOnlineStatus
            : DEFAULT_SETTINGS.showOnlineStatus,
        showReadReceipts:
          typeof parsed.showReadReceipts === "boolean"
            ? parsed.showReadReceipts
            : DEFAULT_SETTINGS.showReadReceipts,
      };
    }
  } catch (err) {
    console.error("Error reading user settings:", err);
  }
  return DEFAULT_SETTINGS;
}

export function saveUserSettings(
  userId: string | undefined,
  updates: Partial<UserSettings>
): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const current = getUserSettings(userId);
  const updated: UserSettings = { ...current, ...updates };
  const key = userId ? `chatconnect_settings_${userId}` : "chatconnect_settings_global";
  try {
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("chatconnect_settings_updated", { detail: updated })
    );
  } catch (err) {
    console.error("Error saving user settings:", err);
  }
  return updated;
}
