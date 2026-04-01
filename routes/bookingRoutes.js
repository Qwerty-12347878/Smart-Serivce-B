import express from 'express';
import { createBooking, getMyBookings, getAllBookings } from '../controllers/bookingController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createBooking);
router.route('/mybookings').get(protect, getMyBookings);
router.route('/all').get(protect, admin, getAllBookings);

export default router;
