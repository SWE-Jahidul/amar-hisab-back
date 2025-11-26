// routes/auth.ts
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types';

const router = express.Router();

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '100y' });
};

// Register route
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response<AuthResponse>): Promise<void> => {
  try {
    const { phone, username } = req.body;

    // Validation
    if (!phone || !username) {
      res.status(400).json({
        success: false,
        message: 'Phone and username are required'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this phone number'
      });
      return;
    }

    // Create new user
    const user = new User({
      phone,
      username
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: (error as Error).message
    });
  }
});

// Login route
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response<AuthResponse>): Promise<void> => {
  try {
    const { phone, username } = req.body;

    // Validation
    if (!phone || !username) {
      res.status(400).json({
        success: false,
        message: 'Phone and username are required'
      });
      return;
    }

    // Find user by phone and username
    const user = await User.findOne({ phone, username });
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid phone number or username'
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: (error as Error).message
    });
  }
});

// Verify token route (optional - for frontend token validation)
router.get('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        username: user.username
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

export default router;