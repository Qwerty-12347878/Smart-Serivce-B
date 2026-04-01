import express from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

router.route('/').get(getRecommendations);

export default router;
