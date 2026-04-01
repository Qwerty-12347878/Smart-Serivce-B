import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Service from './models/serviceModel.js';
import Worker from './models/workerModel.js';
import Booking from './models/bookingModel.js';

dotenv.config();

const clearDataAndSeedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Clear all existing data
    await User.deleteMany();
    await Service.deleteMany();
    await Worker.deleteMany();
    await Booking.deleteMany();

    console.log('Data Destroyed!');

    // Create the admin user requested by the user
    await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      isAdmin: true,
    });

    console.log('Admin user created (admin@gmail.com / admin123)');

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

clearDataAndSeedAdmin();
