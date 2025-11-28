import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  description: string;
  notificationDate?: Date;
  isNotified: boolean;
  syncedAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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

// Index for efficient querying of notifications
noteSchema.index({ notificationDate: 1, isNotified: 1 });
// Indexes for efficient sync queries
noteSchema.index({ user: 1, updatedAt: 1 });
noteSchema.index({ user: 1, isDeleted: 1 });

export const Note = model<INote>('Note', noteSchema);