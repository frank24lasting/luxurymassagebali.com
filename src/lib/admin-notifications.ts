import toast from 'react-hot-toast';

type AudioWindow = Window & typeof globalThis & { readonly webkitAudioContext?: typeof AudioContext };

export function playOrderSound() {
  const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const now = ctx.currentTime;
  const notes = [880, 988, 1175];

  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.16);
    gain.gain.setValueAtTime(0.0001, now + index * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.28, now + index * 0.16 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.16 + 0.14);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now + index * 0.16);
    oscillator.stop(now + index * 0.16 + 0.15);
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function getAdminToken() {
  const { supabase } = await import('@/lib/supabase');
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export async function requestBrowserNotificationPermission() {
  playOrderSound();

  if (!('Notification' in window)) {
    toast.success('Sound admin aktif');
    return false;
  }

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') {
    toast.success('Sound admin aktif. Browser notification belum diizinkan.');
    return false;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast.success('Sound dan browser notification aktif. Web Push belum didukung browser ini.');
    return false;
  }

  try {
    const token = await getAdminToken();
    if (!token) throw new Error('Admin session not found');

    const keyResponse = await fetch('/api/admin-push-subscriptions', { headers: { Authorization: `Bearer ${token}` } });
    const keyData = await keyResponse.json().catch(() => ({}));
    if (!keyResponse.ok || !keyData.publicKey) {
      toast.success('Sound dan browser notification aktif. Push server belum dikonfigurasi.');
      return false;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription = existingSubscription || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
    });

    const saveResponse = await fetch('/api/admin-push-subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscription }),
    });
    const saveData = await saveResponse.json().catch(() => ({}));
    if (!saveResponse.ok) throw new Error(saveData.error || 'Failed to save push subscription');

    toast.success('Sound dan push notification admin aktif');
    return true;
  } catch (error) {
    toast.success('Sound dan browser notification aktif. Push server perlu env VAPID + service role.');
    return false;
  }
}

export function showOrderNotification(customerName = 'Customer baru') {
  toast.success(`Ada order masuk!! ${customerName}`, { duration: 7000 });
  playOrderSound();

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Ada order masuk!!', {
      body: `${customerName} baru membuat appointment.`,
      icon: '/favicon.svg',
      tag: 'luxury-massage-bali-new-appointment',
    });
  }
}
