import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  notificationDate?: Date;
  isNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  notificationDate: {
    type: Date,
    required: false
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient querying of notifications
noteSchema.index({ notificationDate: 1, isNotified: 1 });

export const Note = model<INote>('Note', noteSchema);