import express from 'express';
import { authWorker, registerWorker, getWorkerProfile, updateWorkerProfile, getAllWorkers, getWorkerRequests, acceptWorkerRequest, rejectWorkerRequest } from '../controllers/workerController.js';
import { protect, admin, worker } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', registerWorker);
router.post('/login', authWorker);
router.route('/profile').get(protect, worker, getWorkerProfile).put(protect, worker, updateWorkerProfile);
router.get('/all', protect, admin, getAllWorkers);
router.get('/requests', protect, worker, getWorkerRequests);
router.put('/requests/:notificationId/accept', protect, worker, acceptWorkerRequest);
router.put('/requests/:notificationId/reject', protect, worker, rejectWorkerRequest);

export default router;
