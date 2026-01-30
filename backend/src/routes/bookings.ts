import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Booking from '../models/Booking';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * @route   GET /api/bookings
 * @desc    Get user's bookings
 * @access  Private
 */
router.get('/', authenticate, [
  query('type').optional().isIn(['flight', 'hotel', 'car', 'restaurant']),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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
    const { type, status, page = 1, limit = 20 } = req.query;
    
    // Build query filters
    const filters: any = { user: req.user._id };
    if (type) filters.type = type;
    if (status) filters.status = status;

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      Booking.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'firstName lastName email'),
      Booking.countDocuments(filters),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
      },
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching bookings',
    });
  }
}));

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, [
  param('id').isMongoId().withMessage('Valid booking ID is required'),
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
    const { id } = req.params;
    
    const booking = await Booking.findOne({ _id: id, user: req.user._id })
      .populate('user', 'firstName lastName email');
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching booking',
    });
  }
}));

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel a booking
 * @access  Private
 */
router.delete('/:id', authenticate, [
  param('id').isMongoId().withMessage('Valid booking ID is required'),
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
    const { id } = req.params;
    
    const booking = await Booking.findOne({ _id: id, user: req.user._id });
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found',
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is already cancelled',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel a completed booking',
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // In a real application, you would:
    // 1. Process refund based on cancellation policy
    // 2. Notify service providers
    // 3. Send cancellation confirmation email
    // 4. Update availability in external systems

    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully',
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error cancelling booking',
    });
  }
}));

/**
 * @route   GET /api/bookings/reference/:reference
 * @desc    Get booking by reference number
 * @access  Private
 */
router.get('/reference/:reference', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reference } = req.params;
    
    const booking = await Booking.findOne({ 
      bookingReference: reference.toUpperCase(),
      user: req.user._id 
    }).populate('user', 'firstName lastName email');
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found with this reference number',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (error) {
    console.error('Get booking by reference error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching booking',
    });
  }
}));

/**
 * @route   GET /api/bookings/stats/summary
 * @desc    Get booking statistics for user
 * @access  Private
 */
router.get('/stats/summary', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    
    // Get booking statistics
    const [totalBookings, bookingsByType, bookingsByStatus] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$type', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
      ]),
      Booking.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const recentBookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type bookingReference status totalAmount currency createdAt');

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalBookings,
          bookingsByType,
          bookingsByStatus,
          recentBookings,
        },
      },
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching booking statistics',
    });
  }
}));

export default router;