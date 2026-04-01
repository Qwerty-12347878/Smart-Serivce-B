import express from 'express';
import { authUser, registerUser, logoutUser, getUserProfile, updateUserProfile, getAllUsers, getAdminStats, forgotPassword, resetPassword } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.route('/all').get(protect, admin, getAllUsers);
router.route('/stats').get(protect, admin, getAdminStats);

export default router;
