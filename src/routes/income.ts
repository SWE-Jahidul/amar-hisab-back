import express, { Response } from 'express';
import Income from '../models/Income';
import auth from '../middleware/auth';
import { AuthRequest, IncomeExpenseRequest } from '../types';

const router = express.Router();



// Get Today's Income
router.get('/stats/today', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const incomes = await Income.find({
      user: req.user!._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const total = incomes.reduce((sum, income) => sum + income.amount, 0);

    res.json({
      success: true,
      todayIncome: total,
      count: incomes.length,
      incomes
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Get Monthly Income
router.get('/stats/monthly', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const incomes = await Income.find({
      user: req.user!._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const total = incomes.reduce((sum, income) => sum + income.amount, 0);

    res.json({
      success: true,
      monthlyIncome: total,
      count: incomes.length,
      month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
      incomes
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});
// Create Income
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, description, category, date } = req.body as IncomeExpenseRequest;

    const income = new Income({
      user: req.user!._id,
      amount,
      description,
      category,
      date: date || new Date()
    });

    await income.save();

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      income
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});
// Get All Incomes for User
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const incomes = await Income.find({ user: req.user!._id })
      .sort({ date: -1 });

    res.json({
      success: true,
      incomes,
      total: incomes.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Get Single Income
router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      user: req.user!._id
    });

    if (!income) {
      res.status(404).json({
        success: false,
        message: 'Income not found'
      });
      return;
    }

    res.json({
      success: true,
      income
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Update Income
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, description, category, date } = req.body as IncomeExpenseRequest;

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { amount, description, category, date },
      { new: true, runValidators: true }
    );

    if (!income) {
      res.status(404).json({
        success: false,
        message: 'Income not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Income updated successfully',
      income
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Delete Income
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      user: req.user!._id
    });

    if (!income) {
      res.status(404).json({
        success: false,
        message: 'Income not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Income deleted successfully'
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