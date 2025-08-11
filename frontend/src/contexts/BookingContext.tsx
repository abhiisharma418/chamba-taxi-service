import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RidesAPI } from '../lib/api';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';

export interface Booking {
  id: string;
  customerId: string;
  driverId?: string;
  pickup: { address: string; coordinates: [number, number] };
  destination: { address: string; coordinates: [number, number] };
  vehicleType: 'economy' | 'premium' | 'luxury' | 'car' | 'bike';
  status: 'requested' | 'accepted' | 'on-trip' | 'completed' | 'cancelled' | 'arriving';
  fare: { estimated: number; actual?: number };
  paymentStatus?: 'none' | 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  paymentId?: string;
  createdAt: Date;
  completedAt?: Date;
  rating?: number;
}

interface BookingContextType {
  bookings: Booking[];
  currentBooking: Booking | null;
  createBooking: (bookingData: { pickup: Booking['pickup']; destination: Booking['destination']; vehicleType: 'car'|'bike' }) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => Promise<void>;
  getBookingHistory: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps { children: ReactNode; }

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const getBookingHistory = async () => {
    const res = await RidesAPI.history();
    setBookings(res.data as any);
  };

  useEffect(() => { getBookingHistory().catch(()=>{}); }, []);

  useEffect(() => {
    if (!user) return;
    const sock = io((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000', { auth: { userId: user.id } });
    setSocket(sock);
    sock.on('ride:status', async (payload: any) => {
      try {
        if (payload?.rideId) {
          const res = await RidesAPI.get(payload.rideId);
          const ride = res.data as any as Booking;
          setCurrentBooking(prev => (prev && prev.id === ride.id ? ride : prev));
          setBookings(prev => {
            const exists = prev.some(b => b.id === ride.id);
            if (!exists) return [ride, ...prev];
            return prev.map(b => (b.id === ride.id ? ride : b));
          });
        } else {
          await getBookingHistory();
        }
      } catch {}
    });
    return () => { sock.disconnect(); setSocket(null); };
  }, [user]);

  const createBooking = async (bookingData: { pickup: Booking['pickup']; destination: Booking['destination']; vehicleType: 'car'|'bike' }) => {
    const res = await RidesAPI.create({ pickup: bookingData.pickup, destination: bookingData.destination, vehicleType: bookingData.vehicleType, regionType: 'city' });
    const ride = res.data;
    setCurrentBooking(ride);
    await getBookingHistory();
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    await RidesAPI.updateStatus(bookingId, status);
    await getBookingHistory();
    if (currentBooking?.id === bookingId) {
      const r = await RidesAPI.get(bookingId);
      setCurrentBooking(r.data);
    }
  };

  return (
    <BookingContext.Provider value={{ bookings, currentBooking, createBooking, updateBookingStatus, getBookingHistory }}>
      {children}
    </BookingContext.Provider>
  );
};