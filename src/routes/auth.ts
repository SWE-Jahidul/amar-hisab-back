import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { RegisterRequest } from '../types';

const router = express.Router();

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '100y' });
};

router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response): Promise<void> => {
  try {
    const { phone, username } = req.body;

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
        id: user._id,
        phone: user.phone,
        username: user.username
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

export default router;