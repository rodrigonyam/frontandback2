import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { IUser, JwtPayload } from '../types';

// Extend Express Request interface
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies (if you're using cookie-based auth)
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc: any, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies.token;
    }

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.',
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Token is valid but user no longer exists.',
        });
        return;
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid token.',
      });
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during authentication.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Access denied. Please log in.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

// Optional authentication - doesn't require login but sets user if token is provided
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
        // Invalid token, but continue without authentication
        console.log('Invalid token in optional auth:', jwtError);
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    next(); // Continue without authentication on error
  }
};