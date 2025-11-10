import express, { Response } from 'express';
import Expense from '../models/Expense';
import auth from '../middleware/auth';
import { AuthRequest, IncomeExpenseRequest } from '../types';

const router = express.Router();

// Create Expense
router.post('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
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
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
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

// Get Single Expense
router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
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
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
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
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
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