import { Router, Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Booking from '../models/Booking';
import { IHotel } from '../types';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Mock hotel data
const mockHotels: IHotel[] = [
  {
    id: 'HTL001',
    name: 'Grand Plaza Hotel',
    location: {
      address: '123 Main Street',
      city: 'New York',
      country: 'USA',
      coordinates: { lat: 40.7128, lng: -74.0060 },
    },
    rating: 4.5,
    images: [
      'https://example.com/hotel1-1.jpg',
      'https://example.com/hotel1-2.jpg',
    ],
    amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Spa'],
    roomTypes: [
      {
        type: 'Standard Room',
        price: 199,
        currency: 'USD',
        available: 5,
        maxGuests: 2,
        description: 'Comfortable room with city view',
      },
      {
        type: 'Deluxe Suite',
        price: 399,
        currency: 'USD',
        available: 2,
        maxGuests: 4,
        description: 'Spacious suite with premium amenities',
      },
    ],
    checkIn: new Date('2024-02-15'),
    checkOut: new Date('2024-02-17'),
    pricePerNight: 199,
    currency: 'USD',
  },
  {
    id: 'HTL002',
    name: 'Seaside Resort',
    location: {
      address: '456 Beach Avenue',
      city: 'Los Angeles',
      country: 'USA',
      coordinates: { lat: 34.0522, lng: -118.2437 },
    },
    rating: 4.8,
    images: [
      'https://example.com/hotel2-1.jpg',
      'https://example.com/hotel2-2.jpg',
    ],
    amenities: ['Beach Access', 'WiFi', 'Pool', 'Restaurant', 'Parking'],
    roomTypes: [
      {
        type: 'Ocean View Room',
        price: 299,
        currency: 'USD',
        available: 8,
        maxGuests: 2,
        description: 'Room with stunning ocean views',
      },
    ],
    checkIn: new Date('2024-02-16'),
    checkOut: new Date('2024-02-18'),
    pricePerNight: 299,
    currency: 'USD',
  },
];

/**
 * @route   GET /api/hotels/search
 * @desc    Search for hotels
 * @access  Public
 */
router.get('/search', [
  query('destination').optional().isString(),
  query('checkIn').optional().isISO8601().withMessage('Valid check-in date is required when provided'),
  query('checkOut').optional().isISO8601().withMessage('Valid check-out date is required when provided'),
  query('guests').optional().isInt({ min: 1, max: 20 }).withMessage('Guests must be between 1 and 20'),
  query('rooms').optional().isInt({ min: 1, max: 10 }).withMessage('Rooms must be between 1 and 10'),
], optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation errors',
      errors: errors.array(),
    });
  }

  try {
    const {
      destination,
      checkIn,
      checkOut,
      guests = 2,
      rooms = 1,
      minPrice,
      maxPrice,
      rating,
      amenities
    } = req.query;

    let hotels = mockHotels.filter(hotel => {
      const matchesDestination = destination
        ? hotel.location.city.toLowerCase().includes((destination as string).toLowerCase()) ||
          hotel.location.country.toLowerCase().includes((destination as string).toLowerCase())
        : true;
      
      let matchesPrice = true;
      if (minPrice) matchesPrice = hotel.pricePerNight >= parseFloat(minPrice as string);
      if (maxPrice) matchesPrice = matchesPrice && hotel.pricePerNight <= parseFloat(maxPrice as string);
      
      let matchesRating = true;
      if (rating) matchesRating = hotel.rating >= parseFloat(rating as string);
      
      let matchesAmenities = true;
      if (amenities) {
        const requestedAmenities = (amenities as string).split(',');
        matchesAmenities = requestedAmenities.every(amenity => 
          hotel.amenities.some(hotelAmenity => 
            hotelAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        );
      }

      return matchesDestination && matchesPrice && matchesRating && matchesAmenities;
    });

    hotels.sort((a, b) => a.pricePerNight - b.pricePerNight);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedHotels = hotels.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      data: {
        hotels: paginatedHotels,
        searchParams: {
          destination,
          checkIn,
          checkOut,
          guests,
          rooms,
        },
      },
      pagination: {
        page,
        limit,
        total: hotels.length,
        totalPages: Math.ceil(hotels.length / limit),
      },
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching hotels',
    });
  }
}));

/**
 * @route   POST /api/hotels/book
 * @desc    Book a hotel
 * @access  Private
 */
router.post('/book', authenticate, [
  body('hotelId').notEmpty().withMessage('Hotel ID is required'),
  body('roomType').notEmpty().withMessage('Room type is required'),
  body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  body('guests').isInt({ min: 1 }).withMessage('Number of guests is required'),
  body('rooms').isInt({ min: 1 }).withMessage('Number of rooms is required'),
  body('guestDetails').isArray({ min: 1 }).withMessage('Guest details are required'),
], asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation errors',
      errors: errors.array(),
    });
  }

  try {
    const { hotelId, roomType, checkIn, checkOut, guests, rooms, guestDetails, specialRequests } = req.body;

    const hotel = mockHotels.find(h => h.id === hotelId);
    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel not found',
      });
    }

    const selectedRoomType = hotel.roomTypes.find(rt => rt.type === roomType);
    if (!selectedRoomType) {
      return res.status(404).json({
        status: 'error',
        message: 'Room type not found',
      });
    }

    if (selectedRoomType.available < rooms) {
      return res.status(400).json({
        status: 'error',
        message: 'Not enough rooms available',
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));
    const totalAmount = selectedRoomType.price * rooms * nights;

    const bookingDetails = {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        location: hotel.location,
      },
      room: selectedRoomType,
      checkIn,
      checkOut,
      nights,
      guests,
      rooms,
      guestDetails,
      specialRequests,
      pricePerNight: selectedRoomType.price,
    };

    const booking = new Booking({
      user: req.user._id,
      type: 'hotel',
      totalAmount,
      currency: selectedRoomType.currency,
      bookingDetails,
    });

    await booking.save();

    res.status(201).json({
      status: 'success',
      message: 'Hotel booked successfully',
      data: {
        booking: {
          id: booking._id,
          bookingReference: booking.bookingReference,
          status: booking.status,
          totalAmount: booking.totalAmount,
          currency: booking.currency,
          bookingDetails: booking.bookingDetails,
          createdAt: booking.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Hotel booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error booking hotel',
    });
  }
}));

/**
 * @route   GET /api/hotels/:id
 * @desc    Get hotel details by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hotel = mockHotels.find(h => h.id === id);

    if (!hotel) {
      return res.status(404).json({
        status: 'error',
        message: 'Hotel not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { hotel },
    });
  } catch (error) {
    console.error('Hotel detail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching hotel details',
    });
  }
}));

export default router;