import express, { Response } from 'express';
import Income from '../models/Income';
import Expense from '../models/Expense';
import auth from '../middleware/auth';
import { AuthRequest } from '../types';

const router = express.Router();

// Get Monthly Net Balance
router.get('/monthly/net', auth, async (req: AuthRequest, res: Response): Promise<void> => {
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

    const expenses = await Expense.find({
      user: req.user!._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthlyIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const monthlyExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netBalance = monthlyIncome - monthlyExpense;

    res.json({
      success: true,
      month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
      monthlyIncome,
      monthlyExpense,
      netBalance
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
