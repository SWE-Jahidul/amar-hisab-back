import express, { Response } from 'express';
import Expense from '../models/Expense';
import { AuthRequest, IncomeExpenseRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get Today's Expense
router.get('/stats/today', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const expenses = await Expense.find({
      user: req.user!._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({
      success: true,
      todayExpense: total,
      count: expenses.length,
      expenses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Get Monthly Expense
router.get('/stats/monthly', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const expenses = await Expense.find({
      user: req.user!._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({
      success: true,
      monthlyExpense: total,
      count: expenses.length,
      month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
      expenses
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Create Expense
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, description, category, date } = req.body as IncomeExpenseRequest;

    const expense = new Expense({
      user: req.user!._id,
      amount,
      description,
      category,
      date: date || new Date()
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      expense
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Get All Expenses for User
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expenses = await Expense.find({ user: req.user!._id })
      .sort({ date: -1 });

    res.json({
      success: true,
      expenses,
      total: expenses.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Get Single Expense - MUST be after /stats routes
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user!._id
    });

    if (!expense) {
      res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
      return;
    }

    res.json({
      success: true,
      expense
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Update Expense
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, description, category, date } = req.body as IncomeExpenseRequest;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { amount, description, category, date },
      { new: true, runValidators: true }
    );

    if (!expense) {
      res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
});

// Delete Expense
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user!._id
    });

    if (!expense) {
      res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
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