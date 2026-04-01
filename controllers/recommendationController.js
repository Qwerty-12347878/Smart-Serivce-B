import Service from '../models/serviceModel.js';
import Booking from '../models/bookingModel.js';

// @desc    Get AI-based recommendations
// @route   GET /api/recommendations
// @access  Public
const getRecommendations = async (req, res, next) => {
  try {
    // For now, simple logic: return top rated and most reviewed services
    // If a user was logged in, we could look at req.user._id booking history 
    // to filter categories they often booked.
    
    const trending = await Service.find({}).sort({ rating: -1, numReviews: -1 }).limit(3);
    
    // Additional logic can be added here for pure collaborative/content-based filtering
    
    res.json({
        success: true,
        message: 'AI Recommendations generated',
        recommendations: trending
    });
  } catch (error) {
    next(error);
  }
};

export { getRecommendations };
