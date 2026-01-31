import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  passport?: {
    number: string;
    expiryDate: Date;
    countryOfIssue: string;
  };
  preferences: {
    currency: string;
    language: string;
    notifications: boolean;
  };
  isEmailVerified: boolean;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  user: string;
  type: 'flight' | 'hotel' | 'car' | 'restaurant';
  bookingReference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  currency: string;
  bookingDetails: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    country: string;
    date: Date;
    terminal?: string;
  };
  arrival: {
    airport: string;
    city: string;
    country: string;
    date: Date;
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

export interface IHotel {
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
  checkIn: Date;
  checkOut: Date;
  pricePerNight: number;
  currency: string;
}

export interface ICar {
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
  pickupDate: Date;
  dropoffDate: Date;
}

export interface IRestaurant {
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
}

export interface ISearchQuery {
  destination?: string;
  origin?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  rooms?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  amenities?: string[];
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

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}