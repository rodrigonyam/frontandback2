export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  passport?: {
    number: string;
    expiryDate: string;
    countryOfIssue: string;
  };
  preferences: {
    currency: string;
    language: string;
    notifications: boolean;
  };
  isEmailVerified: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  _id: string;
  user: string;
  type: 'flight' | 'hotel' | 'car' | 'restaurant';
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  currency: string;
  bookingDetails: any;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    country: string;
    date: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    city: string;
    country: string;
    date: string;
    terminal?: string;
  };
  duration: string;
  aircraft: string;
  price: number;
  currency: string;
  availableSeats: number;
  class: 'economy' | 'business' | 'first';
  baggage: {
    carry: string;
    checked: string;
  };
}

export interface Hotel {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  rating: number;
  images: string[];
  amenities: string[];
  roomTypes: {
    type: string;
    price: number;
    currency: string;
    available: number;
    maxGuests: number;
    description: string;
  }[];
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
  currency: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  category: 'economy' | 'compact' | 'midsize' | 'fullsize' | 'luxury' | 'suv';
  transmission: 'manual' | 'automatic';
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  doors: number;
  airConditioning: boolean;
  image: string;
  pricePerDay: number;
  currency: string;
  available: boolean;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    phone?: string;
    website?: string;
    email?: string;
  };
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  images: string[];
  features: string[];
  description: string;
  distance?: number;
}

export interface SearchParams {
  origin?: string;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  departureDate?: string;
  returnDate?: string;
  guests?: number;
  rooms?: number;
  passengers?: number;
  pickupDate?: string;
  dropoffDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface FlightSearchParams {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  class?: 'economy' | 'business' | 'first';
}

export interface HotelSearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
}

export interface CarSearchParams {
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  dropoffDate?: string;
}