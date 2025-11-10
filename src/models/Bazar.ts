import { Schema, model, Types, Document } from 'mongoose';

export interface IBazar extends Document {
  _id: Types.ObjectId;
  item: string;
  quantity: number;
  price: number;
  user: Types.ObjectId;
  date: Date;
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
  }
}, {
  timestamps: true
});

export default model<IBazar>('Bazar', bazarSchema);
