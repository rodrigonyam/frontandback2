import axios, { AxiosResponse } from 'axios';
import {
  ApiResponse,
  User,
  LoginData,
  RegisterData,
  Flight,
  Hotel,
  Car,
  Restaurant,
  Booking,
  FlightSearchParams,
  HotelSearchParams,
  CarSearchParams,
} from '../types';

// Default to 5050 to match backend default and avoid macOS Control Center on 5000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (data: LoginData): Promise<AxiosResponse<ApiResponse<{ user: User; token: string }>>> =>
    api.post('/auth/login', data),
  
  register: (data: RegisterData): Promise<AxiosResponse<ApiResponse<{ user: User; token: string }>>> =>
    api.post('/auth/register', data),
  
  getCurrentUser: (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.get('/auth/me'),
  
  logout: (): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.post('/auth/logout'),
  
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.put('/auth/profile', data),
};

// Flights API
export const flightsAPI = {
  search: (params: FlightSearchParams & { page?: number; limit?: number }): Promise<AxiosResponse<ApiResponse<{ flights: Flight[]; searchParams: any }>>> =>
    api.get('/flights/search', { params }),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse<{ flight: Flight }>>> =>
    api.get(`/flights/${id}`),
  
  book: (data: any): Promise<AxiosResponse<ApiResponse<{ booking: Booking }>>> =>
    api.post('/flights/book', data),
  
  searchAirports: (query: string): Promise<AxiosResponse<ApiResponse<{ airports: any[] }>>> =>
    api.get('/flights/airports/search', { params: { q: query } }),
};

// Hotels API
export const hotelsAPI = {
  search: (params: HotelSearchParams & { page?: number; limit?: number; minPrice?: number; maxPrice?: number; rating?: number; amenities?: string }): Promise<AxiosResponse<ApiResponse<{ hotels: Hotel[]; searchParams: any }>>> =>
    api.get('/hotels/search', { params }),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<{ hotel: Hotel }>>> =>
    api.get(`/hotels/${id}`),
  
  book: (data: any): Promise<AxiosResponse<ApiResponse<{ booking: Booking }>>> =>
    api.post('/hotels/book', data),
};

// Cars API
export const carsAPI = {
  search: (params: Partial<CarSearchParams> & { page?: number; limit?: number; category?: string; transmission?: string; minPrice?: number; maxPrice?: number }): Promise<AxiosResponse<ApiResponse<{ cars: Car[]; searchParams: any }>>> =>
    api.get('/cars/search', { params }),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<{ car: Car }>>> =>
    api.get(`/cars/${id}`),
  
  book: (data: any): Promise<AxiosResponse<ApiResponse<{ booking: Booking }>>> =>
    api.post('/cars/book', data),
};

// Restaurants API
export const restaurantsAPI = {
  search: (params: { location: string; cuisine?: string; priceRange?: string; rating?: number; features?: string; page?: number; limit?: number }): Promise<AxiosResponse<ApiResponse<{ restaurants: Restaurant[]; searchParams: any }>>> =>
    api.get('/restaurants/search', { params }),
  
  getNearby: (params: { lat: number; lng: number; radius?: number; cuisine?: string; priceRange?: string; rating?: number; page?: number; limit?: number }): Promise<AxiosResponse<ApiResponse<{ restaurants: Restaurant[]; searchParams: any }>>> =>
    api.get('/restaurants/nearby', { params }),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse<{ restaurant: Restaurant }>>> =>
    api.get(`/restaurants/${id}`),
};

// Bookings API
export const bookingsAPI = {
  getAll: (params: { type?: string; status?: string; page?: number; limit?: number }): Promise<AxiosResponse<ApiResponse<{ bookings: Booking[] }>>> =>
    api.get('/bookings', { params }),
  
  getById: (id: string): Promise<AxiosResponse<ApiResponse<{ booking: Booking }>>> =>
    api.get(`/bookings/${id}`),
  
  cancel: (id: string): Promise<AxiosResponse<ApiResponse<{ booking: Booking }>>> =>
    api.delete(`/bookings/${id}`),
  
  getByReference: (reference: string): Promise<AxiosResponse<ApiResponse<{ booking: Booking }>>> =>
    api.get(`/bookings/reference/${reference}`),
  
  getStats: (): Promise<AxiosResponse<ApiResponse<{ summary: any }>>> =>
    api.get('/bookings/stats/summary'),
};

// Users API
export const usersAPI = {
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
    api.put('/users/profile', data),
  
  updatePreferences: (data: { currency?: string; language?: string; notifications?: boolean }): Promise<AxiosResponse<ApiResponse<{ preferences: any }>>> =>
    api.put('/users/preferences', data),
  
  updatePassport: (data: { number: string; expiryDate: string; countryOfIssue: string }): Promise<AxiosResponse<ApiResponse<{ passport: any }>>> =>
    api.put('/users/passport', data),
  
  deleteAccount: (password: string): Promise<AxiosResponse<ApiResponse<null>>> =>
    api.delete('/users/account', { data: { password } }),
  
  getDashboard: (): Promise<AxiosResponse<ApiResponse<{ dashboard: any }>>> =>
    api.get('/users/dashboard'),
};

export default api;