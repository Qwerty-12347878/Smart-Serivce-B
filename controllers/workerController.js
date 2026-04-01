import Worker from '../models/workerModel.js';
import generateToken from '../utils/generateToken.js';
import Booking from '../models/bookingModel.js';
import Notification from '../models/notificationModel.js';
import { publishNotification } from '../utils/notificationBus.js';

// @desc    Auth worker & get token
// @route   POST /api/workers/login
// @access  Public
const authWorker = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const worker = await Worker.findOne({ email });

    if (worker && (await worker.matchPassword(password))) {
      generateToken(res, worker._id, 'worker');

      res.json({
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        category: worker.category,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new worker
// @route   POST /api/workers
// @access  Public
const registerWorker = async (req, res, next) => {
  try {
    const { name, email, password, category, experience, basePrice } = req.body;
    const workerExists = await Worker.findOne({ email });

    if (workerExists) {
      res.status(400);
      throw new Error('Worker already exists');
    }

    const worker = await Worker.create({
      name,
      email,
      password,
      category,
      experience,
      basePrice
    });

    if (worker) {
      generateToken(res, worker._id, 'worker');
      res.status(201).json({
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        category: worker.category,
      });
    } else {
      res.status(400);
      throw new Error('Invalid worker data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all workers (admin)
// @route   GET /api/workers/all
// @access  Private/Admin
const getAllWorkers = async (req, res, next) => {
  try {
    const workers = await Worker.find({}).select('-password');
    res.json(workers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get worker profile
// @route   GET /api/workers/profile
// @access  Private (Worker)
const getWorkerProfile = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.worker._id);
    if (worker) {
      res.json({
        _id: worker._id,
        name: worker.name,
        email: worker.email,
        category: worker.category,
        experience: worker.experience,
        basePrice: worker.basePrice,
        phone: worker.phone,
        address: worker.address,
      });
    } else {
      res.status(404);
      throw new Error('Worker not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update worker profile
// @route   PUT /api/workers/profile
// @access  Private (Worker)
const updateWorkerProfile = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.worker._id);

    if (!worker) {
      res.status(404);
      throw new Error('Worker not found');
    }

    worker.name = req.body.name || worker.name;
    worker.email = req.body.email || worker.email;
    worker.phone = req.body.phone || worker.phone;
    worker.address = req.body.address || worker.address;
    worker.category = req.body.category || worker.category;
    worker.experience = req.body.experience ?? worker.experience;
    worker.basePrice = req.body.basePrice ?? worker.basePrice;

    if (req.body.password) {
      if (req.body.password !== req.body.confirmPassword) {
        res.status(400);
        throw new Error('Passwords do not match');
      }

      worker.password = req.body.password;
    }

    const updatedWorker = await worker.save();

    res.json({
      _id: updatedWorker._id,
      name: updatedWorker.name,
      email: updatedWorker.email,
      category: updatedWorker.category,
      experience: updatedWorker.experience,
      basePrice: updatedWorker.basePrice,
      phone: updatedWorker.phone,
      address: updatedWorker.address,
      role: 'worker',
      isAdmin: false,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get worker job requests
// @route   GET /api/workers/requests
// @access  Private (Worker)
const getWorkerRequests = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      recipientType: 'worker',
      recipient: req.worker._id,
      actionRequired: true,
      actionStatus: 'pending',
    })
      .populate({
        path: 'booking',
        populate: [
          { path: 'service', select: 'name category image price' },
          { path: 'user', select: 'name email phone address' },
        ],
      })
      .sort({ createdAt: -1 });

    const requests = notifications
      .filter((notification) => notification.booking)
      .map((notification) => ({
        notificationId: notification._id,
        createdAt: notification.createdAt,
        booking: notification.booking,
      }));

    const acceptedJobs = await Booking.find({ worker: req.worker._id })
      .populate('service', 'name category image price')
      .populate('user', 'name email phone address')
      .sort({ date: 1 });

    res.json({ requests, acceptedJobs });
  } catch (error) {
    next(error);
  }
};

const acceptWorkerRequest = async (req, res, next) => {
  try {
    const workerNotification = await Notification.findOne({
      _id: req.params.notificationId,
      recipientType: 'worker',
      recipient: req.worker._id,
      actionRequired: true,
      actionStatus: 'pending',
    }).populate({
      path: 'booking',
      populate: [
        { path: 'service', select: 'name category image price' },
        { path: 'user', select: 'name email' },
      ],
    });

    if (!workerNotification || !workerNotification.booking) {
      res.status(404);
      throw new Error('Job request not found');
    }

    const booking = await Booking.findById(workerNotification.booking._id)
      .populate('service', 'name category image price')
      .populate('user', 'name email');

    if (!booking) {
      res.status(404);
      throw new Error('Booking not found');
    }

    if (booking.status !== 'Pending') {
      res.status(400);
      throw new Error('This request has already been handled');
    }

    booking.worker = req.worker._id;
    booking.status = 'Accepted';
    await booking.save();

    workerNotification.actionRequired = false;
    workerNotification.actionStatus = 'accepted';
    workerNotification.isRead = true;
    workerNotification.readAt = new Date();
    await workerNotification.save();

    await Notification.updateMany(
      {
        booking: booking._id,
        recipientType: 'worker',
        actionRequired: true,
        actionStatus: 'pending',
        _id: { $ne: workerNotification._id },
      },
      {
        $set: {
          actionRequired: false,
          actionStatus: 'expired',
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    const userNotification = await Notification.create({
      recipientType: 'user',
      recipient: booking.user._id,
      recipientModel: 'User',
      booking: booking._id,
      service: booking.service._id,
      type: 'booking_accepted',
      title: 'Worker accepted your request',
      message: `${req.worker.name} accepted your ${booking.service.name} request.`,
    });

    publishNotification('user', booking.user._id.toString(), {
      type: 'notification',
      notification: userNotification,
    });

    publishNotification('worker', req.worker._id.toString(), {
      type: 'booking_accepted',
      bookingId: booking._id.toString(),
    });

    const updatedBooking = await Booking.findById(booking._id)
      .populate('service', 'name category image price')
      .populate('user', 'name email phone address')
      .populate('worker', 'name email category');

    res.json({
      message: 'Request accepted successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

const rejectWorkerRequest = async (req, res, next) => {
  try {
    const workerNotification = await Notification.findOne({
      _id: req.params.notificationId,
      recipientType: 'worker',
      recipient: req.worker._id,
      actionRequired: true,
      actionStatus: 'pending',
    }).populate({
      path: 'booking',
      populate: { path: 'service', select: 'name' },
    });

    if (!workerNotification || !workerNotification.booking) {
      res.status(404);
      throw new Error('Job request not found');
    }

    workerNotification.actionRequired = false;
    workerNotification.actionStatus = 'rejected';
    workerNotification.isRead = true;
    workerNotification.readAt = new Date();
    await workerNotification.save();

    const otherPending = await Notification.countDocuments({
      booking: workerNotification.booking._id,
      recipientType: 'worker',
      actionRequired: true,
      actionStatus: 'pending',
    });

    if (otherPending === 0) {
      const userNotification = await Notification.create({
        recipientType: 'user',
        recipient: workerNotification.booking.user,
        recipientModel: 'User',
        booking: workerNotification.booking._id,
        service: workerNotification.booking.service?._id,
        type: 'booking_update',
        title: 'Request still waiting',
        message: `Workers have not accepted your ${workerNotification.booking.service?.name || 'service'} request yet.`,
      });

      publishNotification('user', workerNotification.booking.user.toString(), {
        type: 'notification',
        notification: userNotification,
      });
    }

    res.json({ message: 'Request declined' });
  } catch (error) {
    next(error);
  }
};

export { authWorker, registerWorker, getWorkerProfile, updateWorkerProfile, getAllWorkers, getWorkerRequests, acceptWorkerRequest, rejectWorkerRequest };
