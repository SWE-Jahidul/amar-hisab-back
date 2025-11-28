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
  },
  syncedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient sync queries
incomeSchema.index({ user: 1, updatedAt: 1 });
incomeSchema.index({ user: 1, isDeleted: 1 });

export default model<IIncome>('Income', incomeSchema);