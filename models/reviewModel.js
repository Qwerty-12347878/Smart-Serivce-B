import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
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
      ref: 'Worker',
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const Review = mongoose.model('Review', reviewSchema);
export default Review;
