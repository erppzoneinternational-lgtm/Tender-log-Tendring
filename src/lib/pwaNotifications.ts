export type DeviceNotificationState =
  | 'unsupported'
  | 'ios_needs_homescreen'
  | 'default'
  | 'granted'
  | 'denied';

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneMatch = window.matchMedia?.(
    '(display-mode: standalone)'
  )?.matches;
  const iosStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone
  );
  return Boolean(standaloneMatch || iosStandalone);
}

export function getDeviceNotificationState(): DeviceNotificationState {
  if (typeof window === 'undefined') return 'unsupported';
  const ua = window.navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua);

  if (!('Notification' in window)) {
    return isIos && !isStandalonePwa() ? 'ios_needs_homescreen' : 'unsupported';
  }

  return Notification.permission as DeviceNotificationState;
}

export async function registerPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator)
  ) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

export async function requestDeviceNotificationPermission(): Promise<DeviceNotificationState> {
  const current = getDeviceNotificationState();
  if (current === 'unsupported' || current === 'ios_needs_homescreen') {
    return current;
  }
  try {
    const result = await Notification.requestPermission();
    return result as DeviceNotificationState;
  } catch {
    return getDeviceNotificationState();
  }
}

export async function showDeviceNotification(params: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<boolean> {
  if (getDeviceNotificationState() !== 'granted') return false;

  const targetUrl = params.url || '/notifications';
  const uniqueTag = params.tag || `pzone-${Date.now()}`;

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active && typeof reg.showNotification === 'function') {
        await reg.showNotification(params.title, {
          body: params.body,
          icon: '/Favicon.png',
          badge: '/Favicon.png',
          tag: uniqueTag,
          data: { url: targetUrl },
        });
        return true;
      }
    } catch {
      // Fall through to standard Notification constructor below
    }
  }

  try {
    const n = new Notification(params.title, {
      body: params.body,
      icon: '/Favicon.png',
      tag: uniqueTag,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = targetUrl;
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}
