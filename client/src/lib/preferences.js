import { useSyncExternalStore } from "react";

import {
  DENSITY_STORAGE_KEY,
  MOTION_STORAGE_KEY,
  NOTIFICATION_DEFAULTS,
  NOTIFICATIONS_STORAGE_KEY,
} from "@/constants/settings";

/**
 * Preferences that outlive a visit.
 *
 * Density and motion are stamped onto `<html>` by the boot script for the same
 * reason the sidebar width is: they change layout, and a layout that corrects
 * itself after the first paint is a layout that flickers. Everything downstream
 * is then plain CSS — no component branches on either.
 *
 * Notification settings are ordinary state. Nothing renders differently because
 * of them, so there is nothing to get right before paint.
 */

const listeners = new Set();

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function announce() {
  for (const listener of listeners) listener();
}

const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — applied for the session, not beyond it */
  }
};

/* ---------------------------------------------------------------- density -- */

const densitySnapshot = () =>
  document.documentElement.dataset.density === "compact" ? "compact" : "comfortable";

export function useDensity() {
  return useSyncExternalStore(subscribe, densitySnapshot, () => "comfortable");
}

export function setDensity(value) {
  const root = document.documentElement;
  if (value === "compact") root.dataset.density = "compact";
  else delete root.dataset.density;

  write(DENSITY_STORAGE_KEY, value);
  announce();
}

/* ----------------------------------------------------------------- motion -- */

const motionSnapshot = () => document.documentElement.dataset.reduceMotion === "1";

export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, motionSnapshot, () => false);
}

/**
 * Forces reduced motion on, over and above what the system reports.
 *
 * It cannot force motion *back on* for someone whose operating system asked for
 * less — that request is theirs and outranks any switch in an application. So
 * this only ever adds, which is why the copy says "always reduce" rather than
 * offering a choice it could not honour.
 */
export function setReducedMotionPreference(enabled) {
  const root = document.documentElement;
  if (enabled) root.dataset.reduceMotion = "1";
  else delete root.dataset.reduceMotion;

  write(MOTION_STORAGE_KEY, enabled ? "1" : "0");
  announce();
}

/* ---------------------------------------------------------- notifications -- */

let notifications = null;

function readNotifications() {
  if (notifications) return notifications;
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) ?? "{}");
    notifications = { ...NOTIFICATION_DEFAULTS, ...stored };
  } catch {
    notifications = { ...NOTIFICATION_DEFAULTS };
  }
  return notifications;
}

export function useNotificationSettings() {
  return useSyncExternalStore(subscribe, readNotifications, () => NOTIFICATION_DEFAULTS);
}

export function setNotificationSetting(id, enabled) {
  notifications = { ...readNotifications(), [id]: enabled };
  write(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  announce();
}
