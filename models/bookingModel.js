import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Service',
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker', // Worker is assigned dynamically when accepted or booked
    },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Completed', 'Rejected'],
      default: 'Pending',
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'upi', 'wallet', 'cash'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Paid', 'Pay Later'],
      default: 'Pending',
    },
    transactionId: {
      type: String,
      default: '',
    },
    paymentNotes: {
      type: String,
      default: '',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
