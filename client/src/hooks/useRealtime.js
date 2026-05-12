import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useRealtime() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5005', { withCredentials: true });
    const push = (type) => (payload) => setEvents((items) => [{ type, payload, at: new Date().toISOString() }, ...items].slice(0, 8));
    socket.on('coupon:created', push('Coupon created'));
    socket.on('coupon:claimed', push('Coupon claimed'));
    socket.on('coupon:redeemed', push('Coupon redeemed'));
    socket.on('fraud:blacklisted', push('Fraud blacklist'));
    return () => socket.disconnect();
  }, []);

  return events;
}

