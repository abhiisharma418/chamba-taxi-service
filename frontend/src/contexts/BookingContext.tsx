import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RidesAPI } from '../lib/api';

export interface Booking {
  id: string;
  customerId: string;
  driverId?: string;
  pickup: { address: string; coordinates: [number, number] };
  destination: { address: string; coordinates: [number, number] };
  vehicleType: 'economy' | 'premium' | 'luxury' | 'car' | 'bike';
  status: 'requested' | 'accepted' | 'on-trip' | 'completed' | 'cancelled' | 'arriving';
  fare: { estimated: number; actual?: number };
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  const getBookingHistory = async () => {
    const res = await RidesAPI.history();
    setBookings(res.data as any);
  };

  useEffect(() => { getBookingHistory().catch(()=>{}); }, []);

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