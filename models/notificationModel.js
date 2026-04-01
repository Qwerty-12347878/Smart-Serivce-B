import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ['user', 'worker'],
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientModel',
    },
    recipientModel: {
      type: String,
      enum: ['User', 'Worker'],
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    type: {
      type: String,
      enum: ['booking_created', 'booking_request', 'booking_accepted', 'booking_rejected', 'booking_update'],
      default: 'booking_update',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    actionRequired: {
      type: Boolean,
      default: false,
    },
    actionStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired', null],
      default: null,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
