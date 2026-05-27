import { useEffect, useRef } from 'react';
import { API_BASE_URL, getAuthHeaders } from '../api/config';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { token, user } = useAuth();
  const lastMessageId = useRef(null);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));

  useEffect(() => {
    if (!token) return;

    // Request permission on mount
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkNewMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages/recent`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        if (data.length > 0) {
          const latest = data[0];
          
          // Only notify for INBOUND messages we haven't seen before
          if (latest.direction === 'inbound' && latest.id !== lastMessageId.current) {
            if (lastMessageId.current !== null) {
              triggerNotification(latest);
            }
            lastMessageId.current = latest.id;
          }
        }
      } catch (e) {
        console.error("Notification Poll Error:", e);
      }
    };

    const triggerNotification = (msg) => {
      // Play Sound
      audioRef.current.play().catch(e => console.log("Audio play blocked"));

      // Browser Alert
      if (Notification.permission === 'granted') {
        const n = new Notification(`New Message from ${msg.name || msg.phone_number}`, {
          body: msg.content,
          icon: '/favicon.ico'
        });
        n.onclick = () => {
          window.focus();
          // You could also navigate to /inbox here
        };
      }
    };

    const interval = setInterval(checkNewMessages, 5000);
    return () => clearInterval(interval);
  }, [token]);

  return null;
};
