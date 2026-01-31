import { Router, Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Booking from '../models/Booking';
import { ICar } from '../types';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Mock car rental data
const mockCars: ICar[] = [
  {
    id: 'CAR001',
    make: 'Toyota',
    model: 'Camry',
    year: 2023,
    category: 'midsize',
    transmission: 'automatic',
    fuelType: 'hybrid',
    seats: 5,
    doors: 4,
    airConditioning: true,
    image: 'https://example.com/toyota-camry.jpg',
    pricePerDay: 45,
    currency: 'USD',
    available: true,
    pickupLocation: 'LAX Airport',
    dropoffLocation: 'LAX Airport',
    pickupDate: new Date('2024-02-15'),
    dropoffDate: new Date('2024-02-17'),
  },
  {
    id: 'CAR002',
    make: 'BMW',
    model: '3 Series',
    year: 2023,
    category: 'luxury',
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 5,
    doors: 4,
    airConditioning: true,
    image: 'https://example.com/bmw-3series.jpg',
    pricePerDay: 89,
    currency: 'USD',
    available: true,
    pickupLocation: 'JFK Airport',
    dropoffLocation: 'JFK Airport',
    pickupDate: new Date('2024-02-16'),
    dropoffDate: new Date('2024-02-18'),
  },
  {
    id: 'CAR003',
    make: 'Ford',
    model: 'Explorer',
    year: 2023,
    category: 'suv',
    transmission: 'automatic',
    fuelType: 'petrol',
    seats: 7,
    doors: 4,
    airConditioning: true,
    image: 'https://example.com/ford-explorer.jpg',
    pricePerDay: 65,
    currency: 'USD',
    available: true,
    pickupLocation: 'ORD Airport',
    dropoffLocation: 'ORD Airport',
    pickupDate: new Date('2024-02-17'),
    dropoffDate: new Date('2024-02-19'),
  },
];

/**
 * @route   GET /api/cars/search
 * @desc    Search for car rentals
 * @access  Public
 */
router.get('/search', [
  query('pickupLocation').optional().isString(),
  query('dropoffLocation').optional().isString(),
  query('pickupDate').optional().isISO8601().withMessage('Valid pickup date is required when provided'),
  query('dropoffDate').optional().isISO8601().withMessage('Valid dropoff date is required when provided'),
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
      pickupLocation,
      dropoffLocation,
      pickupDate,
      dropoffDate,
      category,
      transmission,
      minPrice,
      maxPrice
    } = req.query;

    let cars = mockCars.filter(car => {
      const matchesLocation = pickupLocation
        ? car.pickupLocation.toLowerCase().includes((pickupLocation as string).toLowerCase())
        : true;
      
      let matchesCategory = true;
      if (category) matchesCategory = car.category === category;
      
      let matchesTransmission = true;
      if (transmission) matchesTransmission = car.transmission === transmission;
      
      let matchesPrice = true;
      if (minPrice) matchesPrice = car.pricePerDay >= parseFloat(minPrice as string);
      if (maxPrice) matchesPrice = matchesPrice && car.pricePerDay <= parseFloat(maxPrice as string);

      return matchesLocation && matchesCategory && matchesTransmission && matchesPrice && car.available;
    });

    cars.sort((a, b) => a.pricePerDay - b.pricePerDay);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedCars = cars.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      data: {
        cars: paginatedCars,
        searchParams: {
          pickupLocation,
          dropoffLocation,
          pickupDate,
          dropoffDate,
        },
      },
      pagination: {
        page,
        limit,
        total: cars.length,
        totalPages: Math.ceil(cars.length / limit),
      },
    });
  } catch (error) {
    console.error('Car search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching cars',
    });
  }
}));

/**
 * @route   POST /api/cars/book
 * @desc    Book a car rental
 * @access  Private
 */
router.post('/book', authenticate, [
  body('carId').notEmpty().withMessage('Car ID is required'),
  body('pickupDate').isISO8601().withMessage('Valid pickup date is required'),
  body('dropoffDate').isISO8601().withMessage('Valid dropoff date is required'),
  body('driverDetails').isObject().withMessage('Driver details are required'),
  body('driverDetails.firstName').notEmpty().withMessage('Driver first name is required'),
  body('driverDetails.lastName').notEmpty().withMessage('Driver last name is required'),
  body('driverDetails.licenseNumber').notEmpty().withMessage('License number is required'),
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
    const { carId, pickupDate, dropoffDate, driverDetails, insurance } = req.body;

    const car = mockCars.find(c => c.id === carId);
    if (!car) {
      return res.status(404).json({
        status: 'error',
        message: 'Car not found',
      });
    }

    if (!car.available) {
      return res.status(400).json({
        status: 'error',
        message: 'Car is not available',
      });
    }

    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    const days = Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 3600 * 24));
    const totalAmount = car.pricePerDay * days;

    const bookingDetails = {
      car: {
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        category: car.category,
        image: car.image,
      },
      pickupDate,
      dropoffDate,
      days,
      driverDetails,
      insurance,
      pricePerDay: car.pricePerDay,
    };

    const booking = new Booking({
      user: req.user._id,
      type: 'car',
      totalAmount,
      currency: car.currency,
      bookingDetails,
    });

    await booking.save();

    res.status(201).json({
      status: 'success',
      message: 'Car booked successfully',
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
    console.error('Car booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error booking car',
    });
  }
}));

/**
 * @route   GET /api/cars/:id
 * @desc    Get car details by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const car = mockCars.find(c => c.id === id);

    if (!car) {
      return res.status(404).json({
        status: 'error',
        message: 'Car not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { car },
    });
  } catch (error) {
    console.error('Car detail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching car details',
    });
  }
}));

export default router;