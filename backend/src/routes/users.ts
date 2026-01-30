import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import User from '../models/User';
import Booking from '../models/Booking';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601(),
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
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth'];
    const updates: any = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields provided for update',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile',
    });
  }
}));

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', authenticate, [
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']),
  body('language').optional().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja']),
  body('notifications').optional().isBoolean(),
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
    const { currency, language, notifications } = req.body;
    const preferences: any = {};

    if (currency !== undefined) preferences.currency = currency;
    if (language !== undefined) preferences.language = language;
    if (notifications !== undefined) preferences.notifications = notifications;

    if (Object.keys(preferences).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No preferences provided for update',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'preferences': { ...req.user.preferences, ...preferences } } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating preferences',
    });
  }
}));

/**
 * @route   PUT /api/users/passport
 * @desc    Update passport information
 * @access  Private
 */
router.put('/passport', authenticate, [
  body('number').notEmpty().withMessage('Passport number is required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
  body('countryOfIssue').notEmpty().withMessage('Country of issue is required'),
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
    const { number, expiryDate, countryOfIssue } = req.body;

    // Check if passport is not expired
    const expiry = new Date(expiryDate);
    if (expiry <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Passport expiry date must be in the future',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        passport: {
          number,
          expiryDate: expiry,
          countryOfIssue,
        },
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Passport information updated successfully',
      data: {
        passport: user.passport,
      },
    });
  } catch (error) {
    console.error('Update passport error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating passport information',
    });
  }
}));

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticate, [
  body('password').notEmpty().withMessage('Password is required for account deletion'),
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
    const { password } = req.body;

    // Verify password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid password',
      });
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      user: req.user._id,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete account with active bookings. Please cancel or complete all bookings first.',
      });
    }

    // Delete user bookings (optional - you might want to keep for records)
    await Booking.deleteMany({ user: req.user._id });

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting account',
    });
  }
}));

/**
 * @route   GET /api/users/dashboard
 * @desc    Get user dashboard data
 * @access  Private
 */
router.get('/dashboard', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    
    // Get dashboard statistics
    const [recentBookings, bookingStats, upcomingTrips] = await Promise.all([
      Booking.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type bookingReference status totalAmount currency createdAt bookingDetails'),
      Booking.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
          },
        },
      ]),
      Booking.find({
        user: userId,
        status: 'confirmed',
        'bookingDetails.departure.date': { $gte: new Date() },
      })
        .sort({ 'bookingDetails.departure.date': 1 })
        .limit(3)
        .select('type bookingDetails.departure bookingDetails.arrival bookingDetails.checkIn'),
    ]);

    const totalBookings = await Booking.countDocuments({ user: userId });
    const totalSpent = await Booking.aggregate([
      { $match: { user: userId, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        dashboard: {
          user: req.user.toJSON(),
          stats: {
            totalBookings,
            totalSpent: totalSpent[0]?.total || 0,
            bookingsByStatus: bookingStats,
          },
          recentBookings,
          upcomingTrips,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching dashboard data',
    });
  }
}));

// Admin routes
/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    res.status(200).json({
      status: 'success',
      data: { users },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users',
    });
  }
}));

export default router;