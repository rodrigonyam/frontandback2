import { Router, Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Booking from '../models/Booking';
import { IFlight } from '../types';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Mock flight data for demonstration
const mockFlights: IFlight[] = [
  {
    id: 'FL001',
    airline: 'American Airlines',
    flightNumber: 'AA100',
    departure: {
      airport: 'JFK',
      city: 'New York',
      country: 'USA',
      date: new Date('2024-02-15T08:00:00Z'),
      terminal: '4',
    },
    arrival: {
      airport: 'LAX',
      city: 'Los Angeles',
      country: 'USA',
      date: new Date('2024-02-15T11:30:00Z'),
      terminal: '7',
    },
    duration: '5h 30m',
    aircraft: 'Boeing 737',
    price: 299.99,
    currency: 'USD',
    availableSeats: 45,
    class: 'economy',
    baggage: {
      carry: '1 x 10kg',
      checked: '1 x 23kg',
    },
  },
  {
    id: 'FL002',
    airline: 'Delta Air Lines',
    flightNumber: 'DL200',
    departure: {
      airport: 'LAX',
      city: 'Los Angeles',
      country: 'USA',
      date: new Date('2024-02-16T14:15:00Z'),
      terminal: '2',
    },
    arrival: {
      airport: 'JFK',
      city: 'New York',
      country: 'USA',
      date: new Date('2024-02-16T22:45:00Z'),
      terminal: '4',
    },
    duration: '5h 30m',
    aircraft: 'Airbus A320',
    price: 349.99,
    currency: 'USD',
    availableSeats: 23,
    class: 'economy',
    baggage: {
      carry: '1 x 10kg',
      checked: '1 x 23kg',
    },
  },
  {
    id: 'FL003',
    airline: 'United Airlines',
    flightNumber: 'UA300',
    departure: {
      airport: 'ORD',
      city: 'Chicago',
      country: 'USA',
      date: new Date('2024-02-17T09:30:00Z'),
      terminal: '1',
    },
    arrival: {
      airport: 'LHR',
      city: 'London',
      country: 'UK',
      date: new Date('2024-02-17T21:00:00Z'),
      terminal: '5',
    },
    duration: '8h 30m',
    aircraft: 'Boeing 787',
    price: 899.99,
    currency: 'USD',
    availableSeats: 67,
    class: 'business',
    baggage: {
      carry: '2 x 10kg',
      checked: '2 x 32kg',
    },
  },
];

/**
 * @route   GET /api/flights/search
 * @desc    Search for flights
 * @access  Public
 */
router.get('/search', [
  query('origin').optional().isString(),
  query('destination').optional().isString(),
  query('departureDate').optional().isISO8601().withMessage('Valid departure date is required when provided'),
  query('returnDate').optional().isISO8601().withMessage('Valid return date required if provided'),
  query('passengers').optional().isInt({ min: 1, max: 9 }).withMessage('Passengers must be between 1 and 9'),
  query('class').optional().isIn(['economy', 'business', 'first']).withMessage('Invalid class'),
], optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Check for validation errors
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
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      class: flightClass,
      maxPrice,
      airline
    } = req.query;

    // In a real application, you would call external APIs like Amadeus, Sabre, etc.
    // For now, we'll filter the mock data
    let flights = mockFlights.filter(flight => {
      const matchesRoute = origin
        ? flight.departure.airport.toLowerCase() === (origin as string).toLowerCase() ||
          flight.departure.city.toLowerCase().includes((origin as string).toLowerCase())
        : true;
      
      const matchesDestination = destination
        ? flight.arrival.airport.toLowerCase() === (destination as string).toLowerCase() ||
          flight.arrival.city.toLowerCase().includes((destination as string).toLowerCase())
        : true;
      
      const matchesClass = flightClass ? flight.class === flightClass : true;
      
      let matchesPrice = true;
      if (maxPrice) {
        matchesPrice = flight.price <= parseFloat(maxPrice as string);
      }
      
      let matchesAirline = true;
      if (airline) {
        matchesAirline = flight.airline.toLowerCase().includes((airline as string).toLowerCase());
      }

      return matchesRoute && matchesDestination && matchesClass && matchesPrice && matchesAirline;
    });

    // Sort by price (ascending)
    flights.sort((a, b) => a.price - b.price);

    // Apply pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedFlights = flights.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      data: {
        flights: paginatedFlights,
        searchParams: {
          origin,
          destination,
          departureDate,
          returnDate,
          passengers,
          class: flightClass,
        },
      },
      pagination: {
        page,
        limit,
        total: flights.length,
        totalPages: Math.ceil(flights.length / limit),
      },
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching flights',
    });
  }
}));

/**
 * @route   GET /api/flights/:id
 * @desc    Get flight details by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const flight = mockFlights.find(f => f.id === id);
    
    if (!flight) {
      return res.status(404).json({
        status: 'error',
        message: 'Flight not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        flight,
      },
    });
  } catch (error) {
    console.error('Get flight error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching flight details',
    });
  }
}));

/**
 * @route   POST /api/flights/book
 * @desc    Book a flight
 * @access  Private
 */
router.post('/book', authenticate, [
  body('flightId').notEmpty().withMessage('Flight ID is required'),
  body('passengers').isArray({ min: 1 }).withMessage('At least one passenger is required'),
  body('passengers.*.firstName').notEmpty().withMessage('Passenger first name is required'),
  body('passengers.*.lastName').notEmpty().withMessage('Passenger last name is required'),
  body('passengers.*.dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('passengers.*.passport').optional().isObject(),
  body('contactEmail').isEmail().withMessage('Valid contact email is required'),
  body('contactPhone').notEmpty().withMessage('Contact phone is required'),
], asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation errors',
      errors: errors.array(),
    });
  }

  try {
    const { flightId, passengers, contactEmail, contactPhone, seatPreferences, mealPreferences } = req.body;

    // Find the flight
    const flight = mockFlights.find(f => f.id === flightId);
    if (!flight) {
      return res.status(404).json({
        status: 'error',
        message: 'Flight not found',
      });
    }

    // Check availability
    if (flight.availableSeats < passengers.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Not enough seats available',
      });
    }

    // Calculate total price
    const totalAmount = flight.price * passengers.length;

    // Create booking
    const bookingDetails = {
      flight: {
        id: flight.id,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        departure: flight.departure,
        arrival: flight.arrival,
        class: flight.class,
        aircraft: flight.aircraft,
      },
      passengers,
      contact: {
        email: contactEmail,
        phone: contactPhone,
      },
      seatPreferences,
      mealPreferences,
      pricePerPassenger: flight.price,
    };

    const booking = new Booking({
      user: req.user._id,
      type: 'flight',
      totalAmount,
      currency: flight.currency,
      bookingDetails,
    });

    await booking.save();

    // In a real application, you would:
    // 1. Process payment
    // 2. Confirm booking with airline
    // 3. Send confirmation email
    // 4. Update flight availability

    res.status(201).json({
      status: 'success',
      message: 'Flight booked successfully',
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
    console.error('Flight booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error booking flight',
    });
  }
}));

/**
 * @route   GET /api/flights/airports/search
 * @desc    Search airports
 * @access  Public
 */
router.get('/airports/search', [
  query('q').notEmpty().withMessage('Search query is required'),
], asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation errors',
      errors: errors.array(),
    });
  }

  try {
    const { q } = req.query;
    const query = (q as string).toLowerCase();

    // Mock airport data
    const airports = [
      { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
      { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
      { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'USA' },
      { code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
      { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
      { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
      { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
    ];

    const filteredAirports = airports.filter(airport =>
      airport.code.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query)
    );

    res.status(200).json({
      status: 'success',
      data: {
        airports: filteredAirports,
      },
    });
  } catch (error) {
    console.error('Airport search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching airports',
    });
  }
}));

export default router;