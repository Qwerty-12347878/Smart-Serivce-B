import Booking from '../models/bookingModel.js';
import Service from '../models/serviceModel.js';
import Worker from '../models/workerModel.js';
import Notification from '../models/notificationModel.js';
import { publishNotification } from '../utils/notificationBus.js';

const paymentMethodLabels = {
  card: 'Card',
  upi: 'UPI',
  wallet: 'Wallet',
  cash: 'Cash on Service',
};

const normalizeCategory = (value = '') => value.trim().toLowerCase();

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res, next) => {
  try {
    const { serviceId, date, time, paymentMethod, paymentDetails = {} } = req.body;

    if (!serviceId || !date || !time || !paymentMethod) {
      res.status(400);
      throw new Error('Service, date, time, and payment method are required');
    }

    if (!paymentMethodLabels[paymentMethod]) {
      res.status(400);
      throw new Error('Invalid payment method selected');
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404);
      throw new Error('Service not found');
    }

    const bookingDate = new Date(`${date}T${time}`);
    if (Number.isNaN(bookingDate.getTime())) {
      res.status(400);
      throw new Error('Please select a valid booking date and time');
    }

    const requiresInstantPayment = paymentMethod !== 'cash';
    const transactionId = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const paymentNotes = requiresInstantPayment
      ? `${paymentMethodLabels[paymentMethod]} payment confirmed for ${paymentDetails.referenceLabel || 'digital checkout'}`
      : 'Customer selected cash on service';

    const booking = new Booking({
      user: req.user._id,
      service: service._id,
      date: bookingDate,
      totalPrice: service.price,
      paymentMethod,
      paymentStatus: requiresInstantPayment ? 'Paid' : 'Pay Later',
      transactionId,
      paymentNotes,
      isPaid: requiresInstantPayment,
      paidAt: requiresInstantPayment ? new Date() : null,
    });

    const createdBooking = await booking.save();
    let eligibleWorkers = await Worker.find({
      isAvailable: true,
      $expr: {
        $eq: [
          { $toLower: '$category' },
          normalizeCategory(service.category),
        ],
      },
    }).select('_id name email category');

    if (eligibleWorkers.length === 0) {
      eligibleWorkers = await Worker.find({ isAvailable: true })
        .select('_id name email category');
    }

    const notificationDocs = eligibleWorkers.map((worker) => ({
      recipientType: 'worker',
      recipient: worker._id,
      recipientModel: 'Worker',
      booking: createdBooking._id,
      service: service._id,
      type: 'booking_request',
      title: `New ${service.category} job request`,
      message: `${req.user.name} requested ${service.name} on ${bookingDate.toLocaleString()}.`,
      actionRequired: true,
      actionStatus: 'pending',
    }));

    if (notificationDocs.length > 0) {
      const createdNotifications = await Notification.insertMany(notificationDocs);

      createdNotifications.forEach((notification) => {
        publishNotification('worker', notification.recipient.toString(), {
          type: 'notification',
          notification,
        });
      });
    }

    const userNotification = await Notification.create({
      recipientType: 'user',
      recipient: req.user._id,
      recipientModel: 'User',
      booking: createdBooking._id,
      service: service._id,
      type: 'booking_created',
      title: 'Service request submitted',
      message: notificationDocs.length > 0
        ? `Your ${service.name} request has been sent to available workers.`
        : `Your ${service.name} request is booked and waiting for worker availability.`,
    });

    publishNotification('user', req.user._id.toString(), {
      type: 'notification',
      notification: userNotification,
    });

    const populatedBooking = await Booking.findById(createdBooking._id)
      .populate('service', 'name image category price')
      .populate('worker', 'name email category');

    res.status(201).json({
      ...populatedBooking.toObject(),
      message: requiresInstantPayment
        ? `Booking confirmed and ${paymentMethodLabels[paymentMethod]} payment received`
        : 'Booking confirmed. Payment will be collected at service time',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const bookingQuery = req.user
      ? { user: req.user._id }
      : { worker: req.worker._id };

    const bookings = await Booking.find(bookingQuery)
      .populate('service', 'name image category price')
      .populate('user', 'name email phone address')
      .populate('worker', 'name email category')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/bookings/all
// @access  Private/Admin
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({})
      .populate('service', 'name category price')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
};

export { createBooking, getMyBookings, getAllBookings };
