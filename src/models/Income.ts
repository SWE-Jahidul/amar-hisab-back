import { Schema, model } from 'mongoose';
import { IIncome } from '../types';

const incomeSchema = new Schema<IIncome>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default model<IIncome>('Income', incomeSchema);