import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { IRestaurant } from '../types';

const router = Router();

// Mock restaurant data
const mockRestaurants: IRestaurant[] = [
  {
    id: 'REST001',
    name: 'The Golden Spoon',
    cuisine: ['Italian', 'Mediterranean'],
    rating: 4.5,
    priceRange: '$$$',
    location: {
      address: '789 Restaurant Row',
      city: 'New York',
      country: 'USA',
      coordinates: { lat: 40.7580, lng: -73.9855 },
    },
    contact: {
      phone: '+1-555-0123',
      website: 'https://thegoldenspoon.com',
      email: 'info@thegoldenspoon.com',
    },
    openingHours: {
      monday: { open: '17:00', close: '22:00', closed: false },
      tuesday: { open: '17:00', close: '22:00', closed: false },
      wednesday: { open: '17:00', close: '22:00', closed: false },
      thursday: { open: '17:00', close: '23:00', closed: false },
      friday: { open: '17:00', close: '23:00', closed: false },
      saturday: { open: '16:00', close: '23:00', closed: false },
      sunday: { open: '16:00', close: '22:00', closed: false },
    },
    images: [
      'https://example.com/restaurant1-1.jpg',
      'https://example.com/restaurant1-2.jpg',
    ],
    features: ['Outdoor Seating', 'Wine Bar', 'Romantic', 'Business Dining'],
    description: 'An elegant Italian restaurant featuring authentic Mediterranean cuisine in the heart of Manhattan.',
  },
  {
    id: 'REST002',
    name: 'Sakura Sushi',
    cuisine: ['Japanese', 'Sushi'],
    rating: 4.8,
    priceRange: '$$',
    location: {
      address: '456 Sushi Street',
      city: 'Los Angeles',
      country: 'USA',
      coordinates: { lat: 34.0522, lng: -118.2437 },
    },
    contact: {
      phone: '+1-555-0456',
      website: 'https://sakurasushi.com',
    },
    openingHours: {
      monday: { open: '11:30', close: '21:00', closed: false },
      tuesday: { open: '11:30', close: '21:00', closed: false },
      wednesday: { open: '11:30', close: '21:00', closed: false },
      thursday: { open: '11:30', close: '21:00', closed: false },
      friday: { open: '11:30', close: '22:00', closed: false },
      saturday: { open: '11:30', close: '22:00', closed: false },
      sunday: { open: '12:00', close: '21:00', closed: false },
    },
    images: [
      'https://example.com/restaurant2-1.jpg',
      'https://example.com/restaurant2-2.jpg',
    ],
    features: ['Fresh Fish', 'Sushi Bar', 'Takeout', 'Lunch Specials'],
    description: 'Fresh, authentic sushi and Japanese cuisine made with the finest ingredients.',
  },
  {
    id: 'REST003',
    name: 'Le Petit Bistro',
    cuisine: ['French'],
    rating: 4.3,
    priceRange: '$$$$',
    location: {
      address: '123 French Quarter',
      city: 'Chicago',
      country: 'USA',
      coordinates: { lat: 41.8781, lng: -87.6298 },
    },
    contact: {
      phone: '+1-555-0789',
      website: 'https://lepetitbistro.com',
      email: 'reservations@lepetitbistro.com',
    },
    openingHours: {
      monday: { open: '', close: '', closed: true },
      tuesday: { open: '17:30', close: '22:00', closed: false },
      wednesday: { open: '17:30', close: '22:00', closed: false },
      thursday: { open: '17:30', close: '22:00', closed: false },
      friday: { open: '17:30', close: '23:00', closed: false },
      saturday: { open: '17:30', close: '23:00', closed: false },
      sunday: { open: '17:00', close: '21:30', closed: false },
    },
    images: [
      'https://example.com/restaurant3-1.jpg',
      'https://example.com/restaurant3-2.jpg',
    ],
    features: ['Fine Dining', 'Wine Cellar', 'Chef\'s Table', 'Private Dining'],
    description: 'Classic French cuisine in an intimate bistro setting with an extensive wine collection.',
  },
];

/**
 * @route   GET /api/restaurants/search
 * @desc    Search restaurants
 * @access  Public
 */
router.get('/search', [
  query('location').notEmpty().withMessage('Location is required'),
  query('cuisine').optional(),
  query('priceRange').optional().isIn(['$', '$$', '$$$', '$$$$']),
  query('rating').optional().isFloat({ min: 1, max: 5 }),
], optionalAuth, asyncHandler(async (req: Request, res: Response) => {
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
      location,
      cuisine,
      priceRange,
      rating,
      features
    } = req.query;

    let restaurants = mockRestaurants.filter(restaurant => {
      const matchesLocation = 
        restaurant.location.city.toLowerCase().includes((location as string).toLowerCase()) ||
        restaurant.location.country.toLowerCase().includes((location as string).toLowerCase());
      
      let matchesCuisine = true;
      if (cuisine) {
        matchesCuisine = restaurant.cuisine.some(c => 
          c.toLowerCase().includes((cuisine as string).toLowerCase())
        );
      }
      
      let matchesPriceRange = true;
      if (priceRange) matchesPriceRange = restaurant.priceRange === priceRange;
      
      let matchesRating = true;
      if (rating) matchesRating = restaurant.rating >= parseFloat(rating as string);
      
      let matchesFeatures = true;
      if (features) {
        const requestedFeatures = (features as string).split(',');
        matchesFeatures = requestedFeatures.some(feature => 
          restaurant.features.some(restaurantFeature => 
            restaurantFeature.toLowerCase().includes(feature.toLowerCase())
          )
        );
      }

      return matchesLocation && matchesCuisine && matchesPriceRange && matchesRating && matchesFeatures;
    });

    // Sort by rating (descending)
    restaurants.sort((a, b) => b.rating - a.rating);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedRestaurants = restaurants.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      data: {
        restaurants: paginatedRestaurants,
        searchParams: {
          location,
          cuisine,
          priceRange,
          rating,
        },
      },
      pagination: {
        page,
        limit,
        total: restaurants.length,
        totalPages: Math.ceil(restaurants.length / limit),
      },
    });
  } catch (error) {
    console.error('Restaurant search error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching restaurants',
    });
  }
}));

/**
 * @route   GET /api/restaurants/nearby
 * @desc    Get restaurants near coordinates
 * @access  Public
 */
router.get('/nearby', [
  query('lat').isFloat().withMessage('Valid latitude is required'),
  query('lng').isFloat().withMessage('Valid longitude is required'),
  query('radius').optional().isFloat({ min: 0.1, max: 50 }).withMessage('Radius must be between 0.1 and 50 km'),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation errors',
      errors: errors.array(),
    });
  }

  try {
    const { lat, lng, radius = 5, cuisine, priceRange, rating } = req.query;
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const searchRadius = parseFloat(radius as string);

    // Calculate distance using Haversine formula (simplified)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLng = (lng2 - lng1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let nearbyRestaurants = mockRestaurants
      .map(restaurant => ({
        ...restaurant,
        distance: calculateDistance(
          userLat,
          userLng,
          restaurant.location.coordinates.lat,
          restaurant.location.coordinates.lng
        ),
      }))
      .filter(restaurant => restaurant.distance <= searchRadius)
      .filter(restaurant => {
        let matchesCuisine = true;
        if (cuisine) {
          matchesCuisine = restaurant.cuisine.some(c => 
            c.toLowerCase().includes((cuisine as string).toLowerCase())
          );
        }
        
        let matchesPriceRange = true;
        if (priceRange) matchesPriceRange = restaurant.priceRange === priceRange;
        
        let matchesRating = true;
        if (rating) matchesRating = restaurant.rating >= parseFloat(rating as string);

        return matchesCuisine && matchesPriceRange && matchesRating;
      })
      .sort((a, b) => a.distance - b.distance);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedRestaurants = nearbyRestaurants.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      data: {
        restaurants: paginatedRestaurants,
        searchParams: {
          lat: userLat,
          lng: userLng,
          radius: searchRadius,
        },
      },
      pagination: {
        page,
        limit,
        total: nearbyRestaurants.length,
        totalPages: Math.ceil(nearbyRestaurants.length / limit),
      },
    });
  } catch (error) {
    console.error('Nearby restaurants error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error finding nearby restaurants',
    });
  }
}));

/**
 * @route   GET /api/restaurants/:id
 * @desc    Get restaurant details
 * @access  Public
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const restaurant = mockRestaurants.find(r => r.id === id);
    
    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        restaurant,
      },
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching restaurant details',
    });
  }
}));

export default router;