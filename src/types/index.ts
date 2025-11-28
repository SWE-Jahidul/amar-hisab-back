import { Request } from 'express';
import { Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
  _id: ObjectId;
  phone: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIncome extends Document {
  _id: ObjectId;
  user: ObjectId;
  amount: number;
  description: string;
  category: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpense extends Document {
  _id: ObjectId;
  user: ObjectId;
  amount: number;
  description: string;
  category: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBazar extends Document {
  _id: ObjectId;
  item: string;
  quantity: number;
  price: number;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface RegisterRequest {
  phone: string;
  username: string;
}

export interface LoginRequest {
  phone: string;
  username: string;
}
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    phone: string;
    username: string;
  };
  error?: string;
}
export interface LoginRequest {
  phone: string;
}

export interface IncomeExpenseRequest {
  amount: number;
  description: string;
  category: string;
  date?: Date;
}

export interface JwtPayload {
  userId: string;
}

export interface INote extends Document {
  _id: ObjectId;
  title: string;
  description: string;
  notificationDate?: Date;
  isNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteData {
  title: string;
  description: string;
  notificationDate?: string; // ISO string with datetime
}

export interface UpdateNoteData {
  title?: string;
  description?: string;
  notificationDate?: string; // ISO string with datetime
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
}
