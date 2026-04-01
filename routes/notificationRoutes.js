import express from 'express';
import { getMyNotifications, markNotificationAsRead, streamNotifications } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.get('/stream', protect, streamNotifications);
router.put('/:id/read', protect, markNotificationAsRead);

export default router;
