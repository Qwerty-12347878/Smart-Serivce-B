import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const workerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    category: { type: String, required: true }, // Plumber, Electrician, etc.
    experience: { type: Number, required: true }, // Years of experience
    basePrice: { type: Number },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

workerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

workerSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Worker = mongoose.model('Worker', workerSchema);
export default Worker;
