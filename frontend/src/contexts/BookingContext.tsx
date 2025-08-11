import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Booking {
  id: string;
  customerId: string;
  driverId?: string;
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  vehicleType: 'economy' | 'premium' | 'luxury';
  status: 'requested' | 'accepted' | 'on-trip' | 'completed' | 'cancelled';
  fare: {
    estimated: number;
    actual?: number;
  };
  createdAt: Date;
  completedAt?: Date;
  rating?: number;
}

interface BookingContextType {
  bookings: Booking[];
  currentBooking: Booking | null;
  createBooking: (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  acceptBooking: (bookingId: string, driverId: string) => void;
  cancelBooking: (bookingId: string) => void;
  getBookingHistory: (userId: string, userType: 'customer' | 'driver') => Booking[];
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      customerId: 'customer1',
      driverId: 'driver1',
      pickup: {
        address: 'Connaught Place, New Delhi',
        coordinates: [77.2167, 28.6333]
      },
      destination: {
        address: 'India Gate, New Delhi',
        coordinates: [77.2295, 28.6129]
      },
      vehicleType: 'economy',
      status: 'completed',
      fare: {
        estimated: 150,
        actual: 145
      },
      createdAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 85800000),
      rating: 5
    }
  ]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  const createBooking = (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: Date.now().toString(),
      createdAt: new Date(),
      status: 'requested'
    };
    
    setBookings(prev => [...prev, newBooking]);
    setCurrentBooking(newBooking);
  };

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId
          ? {
              ...booking,
              status,
              completedAt: status === 'completed' ? new Date() : booking.completedAt
            }
          : booking
      )
    );

    if (currentBooking?.id === bookingId) {
      setCurrentBooking(prev =>
        prev
          ? {
              ...prev,
              status,
              completedAt: status === 'completed' ? new Date() : prev.completedAt
            }
          : null
      );
    }
  };

  const acceptBooking = (bookingId: string, driverId: string) => {
    setBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, driverId, status: 'accepted' }
          : booking
      )
    );

    if (currentBooking?.id === bookingId) {
      setCurrentBooking(prev =>
        prev ? { ...prev, driverId, status: 'accepted' } : null
      );
    }
  };

  const cancelBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'cancelled');
    if (currentBooking?.id === bookingId) {
      setCurrentBooking(null);
    }
  };

  const getBookingHistory = (userId: string, userType: 'customer' | 'driver') => {
    if (userType === 'customer') {
      return bookings.filter(booking => booking.customerId === userId);
    } else {
      return bookings.filter(booking => booking.driverId === userId);
    }
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        currentBooking,
        createBooking,
        updateBookingStatus,
        acceptBooking,
        cancelBooking,
        getBookingHistory
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};