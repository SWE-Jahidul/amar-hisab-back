import express, { Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import Bazar from '../models/Bazar';

const router = express.Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { item, quantity, price, date } = req.body;
    const bazar = new Bazar({
      user: req.user!._id,
      item,
      quantity,
      price,
      date: date || new Date()
    });

    await bazar.save();

    res.status(201).json({
      success: true,
      message: 'Bazar entry added successfully',
      bazar
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Get all Bazar entries for user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bazars = await Bazar.find({ user: req.user!._id }).sort({ date: -1 });

    res.json({
      success: true,
      bazars,
      total: bazars.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Get single Bazar entry
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bazar = await Bazar.findOne({ _id: req.params.id, user: req.user!._id });

    if (!bazar) {
      res.status(404).json({ success: false, message: 'Bazar entry not found' });
      return;
    }

    res.json({ success: true, bazar });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Update Bazar entry
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { item, quantity, price, date } = req.body;

    const bazar = await Bazar.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { item, quantity, price, date },
      { new: true, runValidators: true }
    );

    if (!bazar) {
      res.status(404).json({ success: false, message: 'Bazar entry not found' });
      return;
    }

    res.json({ success: true, message: 'Bazar entry updated successfully', bazar });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Delete Bazar entry
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bazar = await Bazar.findOneAndDelete({ _id: req.params.id, user: req.user!._id });

    if (!bazar) {
      res.status(404).json({ success: false, message: 'Bazar entry not found' });
      return;
    }

    res.json({ success: true, message: 'Bazar entry deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

export default router;
