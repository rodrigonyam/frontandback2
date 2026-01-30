import mongoose, { Schema } from 'mongoose';
import { IBooking } from '../types';

const BookingSchema = new Schema<IBooking>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  type: {
    type: String,
    required: [true, 'Booking type is required'],
    enum: ['flight', 'hotel', 'car', 'restaurant'],
  },
  bookingReference: {
    type: String,
    required: [true, 'Booking reference is required'],
    unique: true,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
  },
  bookingDetails: {
    type: Schema.Types.Mixed,
    required: [true, 'Booking details are required'],
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ bookingReference: 1 });
BookingSchema.index({ type: 1, status: 1 });

// Generate booking reference before saving
BookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingReference = `${this.type.toUpperCase()}-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

export default mongoose.model<IBooking>('Booking', BookingSchema);