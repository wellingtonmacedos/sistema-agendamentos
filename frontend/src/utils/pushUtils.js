import axios from 'axios';

const urlBase64ToUint8Array = (base64String) => {
  if (!base64String) {
    throw new Error('VAPID public key is missing or invalid');
  }
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPush = async (role = 'ADMIN', metadata = {}) => {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error('Push notifications not supported');
        }

        const registration = await navigator.serviceWorker.ready;

        // Get VAPID key (Use public endpoint if client)
        const keyUrl = role === 'CLIENT' ? '/api/public/push/vapid-public-key' : '/api/push/vapid-public-key';
        
        const response = await axios.get(keyUrl);
        
        // Validation of response structure
        if (!response.data || !response.data.publicKey) {
            console.error('Invalid VAPID response:', response.data);
            throw new Error('Failed to retrieve VAPID key from server');
        }

        const publicKey = response.data.publicKey;
        
        // Validate key format/content
        if (typeof publicKey !== 'string' || publicKey.length === 0) {
             console.error('Empty/Invalid VAPID key:', publicKey);
             throw new Error('VAPID public key is empty or invalid format');
        }

        let convertedVapidKey;
        try {
            convertedVapidKey = urlBase64ToUint8Array(publicKey);
        } catch (e) {
            console.error('VAPID Key conversion failed:', e);
            throw new Error('Invalid VAPID Key encoding');
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });

        // Send to server
        const subscribeUrl = role === 'CLIENT' ? '/api/public/push/subscribe' : '/api/push/subscribe';
        
        await axios.post(subscribeUrl, {
            subscription: subscription,
            role,
            ...metadata
        });

        return true;
    } catch (error) {
        console.error('Push Subscription Error:', error);
        throw error;
    }
};

export const getPushPermissionState = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
};
