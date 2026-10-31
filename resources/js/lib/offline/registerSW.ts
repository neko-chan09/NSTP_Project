// resources/js/lib/offline/registerSW.ts
import { registerSW } from "virtual:pwa-register";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    registerSW({
      onNeedRefresh() {
        console.info("[PWA] New version available. Refresh to update.");
      },
      onOfflineReady() {
        console.info("[PWA] App is ready to work offline.");
      },
      immediate: true,
    });
  } catch (err) {
    console.warn("[PWA] SW registration failed:", err);
  }
}