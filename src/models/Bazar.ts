import { Schema, model, Types, Document } from 'mongoose';

export interface IBazar extends Document {
  _id: Types.ObjectId;
  item: string;
  quantity: number;
  price: number;
  user: Types.ObjectId;
  date: Date;
  syncedAt: Date;
  isDeleted: boolean;
}

const bazarSchema = new Schema<IBazar>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  item: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
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
bazarSchema.index({ user: 1, updatedAt: 1 });
bazarSchema.index({ user: 1, isDeleted: 1 });

export default model<IBazar>('Bazar', bazarSchema);
