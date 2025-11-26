import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/database';
import authRoutes from './src/routes/auth';
import incomeRoutes from './src/routes/income';
import expenseRoutes from './src/routes/expense';
import bazarRoutes from './src/routes/bazar';
import statRoutes from './src/routes/stats';

// Load env vars
dotenv.config();

// Connect to database
connectDB();
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/bazar', bazarRoutes);
app.use('/api/stats', statRoutes);

// Test route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'Income Expense API is running!' 
  });
});

// Handle undefined routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});