import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Validation rules
const registerValidation = [
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation errors',
      errors: errors.array(),
    });
  }

  const { firstName, lastName, email, password, phone, dateOfBirth } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists',
      });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });

    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating user account',
    });
  }
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, asyncHandler(async (req: Request, res: Response) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation errors',
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  try {
    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error during login',
    });
  }
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    res.status(200).json({
      status: 'success',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user profile',
    });
  }
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
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
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'preferences'];
    const updateData: any = {};

    // Only include allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
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
    console.error('Profile update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile',
    });
  }
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token from storage
  res.status(200).json({
    status: 'success',
    message: 'Logout successful',
  });
}));

export default router;